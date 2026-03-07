# E-Hentai Plus

为 E-Hentai / ExHentai 提供增强阅读体验，支持无限卷轴、全屏阅读器和智能图片加载。

[English](README.md)

## 功能特性

- **卷轴模式开关** — 开启后为无限卷轴自动加载下一页；关闭则保持图库原始布局不变
- **阅读器模式** — 全屏单图浏览，支持键盘、鼠标滚轮、滚动条和缩略图面板导航
- **自动播放** — 可配置间隔的幻灯片播放，自动跳过加载失败的图片
- **双向翻页** — 卷轴模式和阅读器模式均支持向前/向后加载页面
- **智能图片加载** — 并发请求队列、指数退避重试、限流检测、URL 缓存
- **错误恢复** — 卷轴模式和阅读器模式中图片加载失败均可重试

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 从 [Sleazy Fork](https://sleazyfork.org/zh-CN/scripts/565718-e-hentai-plus) 或 [Github release](https://github.com/Leovikii/e-hentai-plus/releases/latest/download/e-hentai-plus.user.js) 安装脚本

## 从源码构建

```bash
npm install
npm run dev    # 开发模式（热重载）
npm run build  # 生产构建
```

输出：`dist/e-hentai-plus.user.js`

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
