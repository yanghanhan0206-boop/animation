# 踩不住的刹车

数据动效短片，Remotion（React）制作。16:9，1920×1080，30fps，2 分 36 秒（4680 帧），黑金风格，无旁白。

## 快速开始

```bash
cd brake-film
npm install
npm run dev        # 打开 Remotion Studio 预览（浏览器访问 http://localhost:3000）
npm run render     # 渲染成片 → out/踩不住的刹车.mp4
```

其他命令：

| 命令 | 作用 |
|---|---|
| `npm run preview` | 渲染一版半分辨率（960×540）的快速预览 → `out/预览_半分辨率.mp4` |
| `npm run stills` | 每场导出三张关键帧 → `out/stills/` |
| `npm run cover` | 导出 9:16 竖屏封面（1080×1920）→ `out/封面_9x16.png`，标题在 `data.ts` 的 `COVER` 里改 |
| `npm run typecheck` | TypeScript 类型检查 |

渲染需要 Chrome（Remotion 首次渲染会自动下载 Chrome Headless Shell）。
已有 Chromium 时可以指定：`npx remotion render BrakeFilm out/踩不住的刹车.mp4 --browser-executable=/path/to/chrome`。

## 已交付的文件

- 成片：[`output/踩不住的刹车.mp4`](output/踩不住的刹车.mp4)（1920×1080，30fps，H.264，BT.709，2:36，暂无声音）
- 竖屏封面：[`output/封面_9x16.png`](output/封面_9x16.png)（1080×1920）

`out/` 是渲染的工作目录，不进 git；确认过的成品放在 `output/`。

## 改内容

**所有字幕、数字、数据来源、分场时间、音频文件名都在 [`src/data.ts`](src/data.ts)。**

- 需要滚动计数的数字写成字符串（如 `'169.64'`），小数位按字符串原样保留，动画结束时画面上显示的就是这串字符。
- 字幕时间是相对本场开始的秒数。打开 Studio 时会自动检查：每条字幕完全可见不少于 2 秒、不重叠、不超出本场，文字里没有破折号；不通过会直接报错并指出哪一条。
- 第五场圆环的「其他」由总额减去各业态自动算出，灰色、不标数字。
- `SHOW_CHAPTER_TITLES` 控制每场左上角的分场标题。

## 声音

背景音乐和音效放进 [`public/audio/`](public/audio/)，文件名和触发时间表见 [`public/audio/README.md`](public/audio/README.md)。
没有文件时自动跳过，照常渲染。冲破瞬间之后背景音乐会自动静音一拍。

## 视觉规范

| | |
|---|---|
| 底色 | `#0A0A0A`，极淡的金色噪点 + 暗角 |
| 主金 `#C9A45C` | 控制线、关键数字、图表 |
| 亮金 `#E8C77A` | 只用于冲破、高光时刻 |
| 暗灰 `#5A5A5A` | 次要信息、数据来源 |
| 红 | 全片只出现一次：第四场金线断裂 |
| 字体 | 标题 Noto Serif SC Bold；字幕 Noto Sans SC Medium；数字 Oswald（DIN Condensed 的开源替代） |

字体随工程打包（`@fontsource`），渲染不依赖网络。

## 目录

```
src/data.ts                 全部内容数据（改这里）
src/theme.ts                颜色、字体、布局、数字滚动工具
src/Film.tsx                总合成：八场依次排列 + 噪点暗角 + 片尾黑场 + 音频
src/scenes/Scene1Line.tsx   第一场 一条线
src/scenes/Scene2Speed.tsx  第二场 为什么要限速
src/scenes/Scene3Bars.tsx   第三场 一路狂奔
src/scenes/Scene4Break.tsx  第四场 冲线
src/scenes/Scene5Ring.tsx   第五场 拆开这235亿
src/scenes/Scene6Money.tsx  第六场 钱去了哪里
src/scenes/Scene7Accel.tsx  第七场 还在加速
src/scenes/Scene8Zhengzhou.tsx 第八场 郑州，还没有答案
src/components/             字幕、角标、金线、滚动数字、柱子、小人、粒子等通用组件
src/audio/                  音效触发表与音频轨
src/geo/henan.ts            河南省轮廓（来自 Apache ECharts 4.9.0 地图数据，合并抽稀）
scripts/stills.mjs          批量导出关键帧
```
