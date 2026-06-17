# Hentai Reader (原 E-Hentai Plus)

由 E-Hentai Plus 升级而来的多站点通用阅读框架。
为你提供增强阅读体验，支持无限卷轴、全屏阅读器模式和智能图片加载。

目前已适配以下网站（未来将适配更多）：
- E-Hentai / ExHentai
- 18comic (禁漫天堂)
- 4KHD

[English](README.md)

## 功能特性

- **一键卷轴模式** — 开启后将多页图库转换为无限滚动视图，并自动无缝加载后续页面；同时智能保留原生页面的关键元数据（如标题、标签、评论等）。支持随时开关与即时刷新。
- **沉浸式阅读器** — 提供全屏无干扰的单图阅读体验。支持键盘、鼠标滚轮、屏幕边缘点击等多种翻页方式，内置高级缩略图侧边栏用于快速跳转。
- **极致流畅的性能引擎** — 采用智能内存回收技术与底层 DOM 虚拟化，自动卸载非可视区域节点。即使单次加载上千张高清大图，也能保持 60fps 的稳定帧率，彻底告别浏览器内存溢出。
- **高效反爬虫解码引擎 (New)** — 针对 18comic 的乱序反爬虫图集，业内首创采用 HTML5 硬件加速解码与极速重组算法，大幅降低重组时的 CPU 满载与发热，解决页面卡死顽疾。
- **智能防屏蔽反制 (New)** — 针对 4KHD 等频繁更换或重定向域名的网站，引入智能特征寻址与跳转跟随机制，确保脚本在网站更换网址后依然有效。
- **断网恢复与容错** — 具备完善的图片加载失败重试机制，提供可视化悬浮控件，支持随时查看加载进度与手动干预重载。
- **自动播放** — 提供自定义播放速度的幻灯片模式，彻底解放双手。

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 从 [Sleazy Fork](https://sleazyfork.org/zh-CN/scripts/565718-hentai-reader) 或 [Github release](https://github.com/Leovikii/Hentai-Reader/releases/latest/download/hentai-reader.user.js) 安装脚本

## 从源码构建

```bash
npm install
npm run dev    # 开发模式（热重载）
npm run build  # 生产构建
```

输出：`dist/hentai-reader.user.js`

## 技术栈

- **TypeScript** + **Vite** + **vite-plugin-monkey**
- **UnoCSS**

## 项目结构

```
src/
├── main.ts                    # 入口文件
├── menu-commands.ts           # Tampermonkey 菜单命令
├── types/index.ts             # 类型定义
├── state/
│   ├── config.ts              # 常量与设置
│   └── store.ts               # 集中式状态管理
├── utils/
│   ├── dom.ts                 # DOM 工具函数
│   └── icons.ts               # SVG 图标
├── services/
│   ├── page-parser.ts         # 页面 URL 与范围解析
│   ├── image-loader.ts        # 图片加载、重试与缓存
│   ├── request-queue.ts       # 并发请求队列
│   └── prefetch.ts            # 下一页预取
├── ui/
│   ├── styles.css             # 样式
│   ├── float-control.ts       # 悬浮控制按钮
│   ├── settings-panel.ts      # 设置面板
│   └── single-page/
│       ├── overlay.ts         # 阅读模式覆盖层
│       ├── scrollbar.ts       # 滚动条与缩略图面板
│       ├── thumbnail-panel.ts # 虚拟滚动缩略图
│       ├── navigation.ts      # 键盘/滚轮/点击导航
│       └── auto-play.ts       # 自动播放逻辑
└── features/
    ├── scroll-mode.ts         # 无限卷轴模式
    └── single-page-mode.ts    # 阅读模式门面
```

## 许可证

MIT
