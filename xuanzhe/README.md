# 你哭的不是选择，是悬着

横版无声科普短视频（Remotion，1920×1080，30fps，导出不带音轨）。全片只用动效和字幕表达，所有画面元素都是 SVG / Canvas 现画的，不用照片或外部素材。

| Composition | 内容 | 时长 |
|---|---|---|
| `Full` | 镜头 1–17 | 196 秒 |
| `Part1` | 镜头 1–10 + 3 秒「下集：很多人，选择了逃」 | 115 秒 |
| `Part2` | 5 秒引子 + 镜头 11–17 | 89 秒 |

![关键帧总览](preview/总览.jpg)

## 常用命令

```bash
npm install
npm run dev            # 打开 Remotion Studio 预览、拖时间轴
npm run check          # 类型检查 + 检查每段字幕够不够时间读完
npm run stills         # 导出确认用的关键帧到 preview/
npm run render:all     # 导出三个 mp4 到 out/（H.264，无音轨）
```

导出单集：`npm run render:full` / `render:part1` / `render:part2`。

## 要改东西，改这两个文件

- **`src/config/timeline.ts`**：每个镜头的起止时间、字幕、角标，时钟出现的时段，上下集的片头片尾，以及画面里的文字（四条路、轨道刻度、坐标轴、「不确定性」「早闭」「延缓」等）。改完运行 `npm run check`，或者在 Studio 的「工具 / TimingSheet」里看时间表。
- **`src/config/theme.ts`**：颜色、字体、小球尺寸和残影、字幕 / 角标 / 时钟的位置和字号、颗粒和暗角强度。

字幕的出入点是按规则自动排的（逐字 2 帧/字、出全后至少停留 2.5 秒、参考阅读速度 5 字/秒），一般只要改文字和镜头时间。个别镜头需要卡画面时，可以在镜头配置里写 `segmentStarts`（指定每段开始时间）或 `subtitleWindow`（指定可用时间窗口，可以向相邻镜头借时间）。

## 目录

```
src/config/timeline.ts   时间线配置（镜头、字幕、角标、时钟、上下集）
src/config/theme.ts      视觉风格
src/shots/ShotNN.tsx     17 个镜头，每个一个组件，只关心「本镜头的第几秒」
src/components/          共用元素：小球、四条路、石头与蛇、倒 U 曲线、冰壳、人影、字幕、时钟、颗粒…
src/lib/subtitles.ts     字幕排程（逐字、停留、两段衔接、自动折行）
src/lib/plan.ts          把一集的配置展开成帧级排期
src/compositions/Film.tsx      三个 Composition 共用的总装
src/compositions/TimingSheet.tsx  时间表（工具）
scripts/                 check-timing.ts、render-stills.ts
preview/                 确认用的关键帧
```

## 当前进度

第一步（搭项目 + 配置 + 定风格）：镜头 1–7、12、14 已做到可以出关键帧；镜头 8–11、13、15–17 暂时是占位画面（小球在原位颤动），确认风格后逐个制作。

## 时间上的几处处理

需求里有三处时间放不下「每段出全后停留 ≥ 2.5 秒」，目前这样处理（都在 `timeline.ts` 里，可以改）：

1. **上集结尾 3 秒**：「下集：很多人，选择了逃」提前 0.5 秒开始逐字出现（镜头 10 的字幕提前 0.6 秒收），出全后停留 2.57 秒，最后一帧不淡出。
2. **下集引子 5 秒**：两段字幕各停留 2.5 秒需要约 8 秒，所以第二段「但很多人，选择了逃」延续到镜头 11 的前 3.6 秒（正好配小球慌乱下坠），下集里镜头 11 的字幕相应顺延。引子的画面是镜头 10 最后 5 秒的重放，从黑场淡入。
3. **镜头 17**：最后 2 秒只剩光点，字幕必须在 194 秒前消失；第一段提前 0.3 秒出现，镜头 16 的字幕相应提前 0.4 秒收。

## 渲染环境说明

字体（Noto Serif SC / Noto Sans SC）通过 `@fontsource` 随 npm 包本地打包，渲染不需要联网。Remotion 默认会下载 Chrome Headless Shell；如果网络受限，可以用 `--browser-executable=/path/to/chrome` 指定本机浏览器（`npm run stills` 用环境变量 `BROWSER`）。
