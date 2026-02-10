# E-Hentai Plus

为 E-Hentai / ExHentai 提供增强的连续阅读模式，带有悬浮控制和极速加载。

## 功能特性

- **滚动模式** — 无限滚动，自动加载下一页并预取图片
- **阅读模式** — 全屏单图查看器，支持键盘、鼠标滚轮和滚动条导航
- **自动播放** — 自动图片幻灯片，可配置播放间隔
- **骨架占位** — 图片加载时显示脉冲动画占位符
- **悬浮控制** — 紧凑的悬浮按钮组：阅读模式切换、自动播放和设置
- **设置面板** — 切换自动滚动、显示/隐藏控制、自动进入阅读模式、调整播放间隔
- **菜单命令** — Tampermonkey 菜单集成，快速切换设置
- **图片预取** — 后台预取下一页图片，实现无缝浏览

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 从 [Sleazy Fork](https://sleazyfork.org/zh-CN/scripts/565718-e-hentai-plus) 或 [Github release](https://github.com/Leovikii/e-hentai-plus/releases/latest/download/e-hentai-plus.user.js) 安装用户脚本

## 从源码构建

```bash
# 安装依赖
npm install

# 开发模式（支持热重载）
npm run dev

# 生产构建
npm run build
```

构建后的用户脚本位于 `dist/e-hentai-plus.user.js`。

## 技术栈

- **TypeScript** — 启用严格模式
- **Vite** + **vite-plugin-monkey** — Tampermonkey 用户脚本构建工具链
- **UnoCSS** — 原子化 CSS 引擎

## 项目结构

```
src/
├── main.ts                    # 入口文件
├── menu-commands.ts           # GM_registerMenuCommand 注册
├── types/
│   └── index.ts               # 共享类型定义
├── state/
│   ├── config.ts              # 常量与设置加载器
│   └── store.ts               # 集中式状态管理
├── utils/
│   ├── dom.ts                 # DOM 工具函数
│   └── icons.ts               # SVG 图标常量
├── services/
│   ├── page-parser.ts         # 页面解析（总页数、下一页 URL）
│   ├── image-loader.ts        # 图片加载与重试
│   └── prefetch.ts            # 下一页预取
├── ui/
│   ├── styles.css             # 组件样式
│   ├── float-control.ts       # 悬浮控制按钮
│   ├── settings-panel.ts      # 设置面板 UI
│   └── single-page/
│       ├── overlay.ts         # 阅读模式覆盖层
│       ├── scrollbar.ts       # 自定义滚动条
│       ├── navigation.ts      # 键盘/滚轮/点击导航
│       └── auto-play.ts       # 自动播放逻辑
└── features/
    ├── scroll-mode.ts         # 无限滚动模式
    └── single-page-mode.ts    # 阅读模式门面
```

## 许可证

MIT
