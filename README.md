# 感谢您的投递 · Thank You for Your Application

一部关于秋招的黏土定格动画（约 3 分 13 秒，16:9，24 fps，动画按 12 fps「一拍二」逐格制作）。

> 一枚 2027 届的应届生，在「金九银十」的秋天投出了三百份简历，收到的回音几乎都以同一句话开头——「感谢您的投递」。

- 成片：[`output/感谢您的投递.mp4`](output/感谢您的投递.mp4)
- 剧本与分镜：[`docs/剧本与分镜.md`](docs/剧本与分镜.md)
- 剧照：[`output/stills/`](output/stills/)

## 这部片子是怎么「做」出来的

片中的一切都是用代码从零生成的，没有使用任何现成的模型、贴图、图片、HDRI、音乐、采样或音效素材：

| 部分 | 做法 |
|---|---|
| 剧本、分镜、台词、屏幕文案 | 手写（`docs/`、`src/dialogue.py`、`src/lib/tex.py`） |
| 角色「小满」 | 用基本体「捏」出来的黏土偶：可开合的眼睑、黏土条眉毛和嘴、压出发缝的头发、会耷拉的呆毛；四肢是带两段 IK 的「铁丝骨架」软管（`src/lib/puppet.py`） |
| 黏土质感 | 程序化材质：低频起伏、拇指按痕、指纹螺纹；每一帧指纹位置都会轻微移动，模拟定格动画被手摆弄后的「沸腾感」（`src/lib/mats.py`） |
| 布景与道具 | 上床下桌的宿舍、窗外的银杏与宿舍楼、软木板、日历、便利贴、泡面桶、笔记本电脑、手机、AI 面试间、「人才库」泳池……全部是程序化建模（`src/lib/dorm.py`、`src/lib/props.py`、`src/shots/`） |
| 屏幕、日历、信封、便利贴上的内容 | 用 PIL 绘制（`src/lib/tex.py`） |
| 动画 | 逐镜头的「姿势到姿势」关键帧，12 fps 逐格求值；每格都有轻微的「手摆」误差（`src/lib/anim.py`、`src/shots/`） |
| 渲染 | Blender Cycles（`bpy`），微缩比例 + 真实光圈的浅景深 |
| 配乐 | 用 numpy 加法合成的「毛毡钢琴」演奏同一个主题：九月是 C 大调，其余是 A 小调；混响也是合成的冲激响应（`src/audio/`） |
| 音效 | 全部合成：手机震动、提示音、键盘、翻页撕纸、信封落下、心跳、雨、落水、水下、鸟叫……妈妈的声音是一支「闷住的小号」，小满的声音是一支带气声的簧管（`src/audio/synth.py`） |
| 后期 | 分镜头调色、逐格曝光闪烁、片门抖动、胶片颗粒、片名与字幕（`src/post/compose.py`） |

唯一的外部资源是用来排版中文的开源字体（Noto CJK、霞鹜文楷），它们只负责把手写的文字「印」出来。

## 目录

```
docs/剧本与分镜.md      剧本、分镜、声音设计
src/lib/               积木：场景工具、材质、黏土偶、道具、宿舍、贴图绘制、关键帧
src/shots/             每个镜头的布景、机位、表演（宿舍 / AI 面试 / 人才库）
src/edl.py             剪辑表：镜头顺序与时长
src/dialogue.py        对白、字幕、片名与片尾
src/render.py          逐格「拍摄」一个镜头
src/audio/             合成器与配乐 / 音效时间线
src/post/compose.py    调色、颗粒、字幕与编码
build.sh               从零重建整部片子
output/                成片与剧照
```

## 重建

```bash
pip install "bpy==4.5.*" numpy scipy pillow imageio-ffmpeg
sudo apt install fonts-noto-cjk fonts-lxgw-wenkai
./build.sh              # 全质量（4 核 CPU 上需要数小时）
Q=draft ./build.sh      # 低清快速预览
```

单独渲染一个镜头：`python3 src/render.py s07 --q preview`
