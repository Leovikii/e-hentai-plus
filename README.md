# Hentai Reader (Formerly E-Hentai Plus)

A generalized multi-site reading framework upgraded from E-Hentai Plus. 
It provides an enhanced reading experience with infinite scroll, full-screen reader mode, and smart image loading.

Currently supported websites (with more to come):
- E-Hentai / ExHentai
- 4KHD

[中文](README.zh-CN.md)

## Features

- **Scroll Mode Toggle** — Enable for infinite scroll with auto next-page loading; disable to keep the original gallery layout untouched
- **Reader Mode** — Full-screen single-image viewer with keyboard, mouse wheel, scrollbar, and thumbnail panel navigation
- **Auto Play** — Slideshow with configurable interval, auto-skips failed images
- **Bidirectional Page Loading** — Load next/previous pages seamlessly in both scroll and reader mode
- **Smart Image Loading** — Concurrent request queue, exponential backoff retry, rate limit detection, and URL caching
- **Error Recovery** — Retry button on failed images in both scroll mode and reader mode

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Install the userscript from [Sleazy Fork](https://sleazyfork.org/zh-CN/scripts/565718-hentai-reader) or [Github release](https://github.com/Leovikii/Hentai-Reader/releases/latest/download/hentai-reader.user.js)

## Build from Source

```bash
npm install
npm run dev    # Development (hot reload)
npm run build  # Production
```

Output: `dist/hentai-reader.user.js`

## Tech Stack

- **TypeScript** + **Vite** + **vite-plugin-monkey**
- **UnoCSS**

## Project Structure

```
src/
├── main.ts                    # Entry point
├── menu-commands.ts           # Tampermonkey menu commands
├── types/index.ts             # Type definitions
├── state/
│   ├── config.ts              # Constants and settings
│   └── store.ts               # Centralized state
├── utils/
│   ├── dom.ts                 # DOM utilities
│   └── icons.ts               # SVG icons
├── services/
│   ├── page-parser.ts         # Page URL and range parsing
│   ├── image-loader.ts        # Image loading with retry and cache
│   ├── request-queue.ts       # Concurrent request queue
│   └── prefetch.ts            # Next page prefetching
├── ui/
│   ├── styles.css             # Styles
│   ├── float-control.ts       # Floating controls
│   ├── settings-panel.ts      # Settings panel
│   └── single-page/
│       ├── overlay.ts         # Reader mode overlay
│       ├── scrollbar.ts       # Scrollbar with thumbnail panel
│       ├── thumbnail-panel.ts # Virtual-scrolling thumbnails
│       ├── navigation.ts      # Keyboard/wheel/click navigation
│       └── auto-play.ts       # Auto-play logic
└── features/
    ├── scroll-mode.ts         # Infinite scroll mode
    └── single-page-mode.ts    # Reader mode facade
```

## License

MIT
