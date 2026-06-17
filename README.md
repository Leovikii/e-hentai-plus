# Hentai Reader (Formerly E-Hentai Plus)

A generalized multi-site reading framework upgraded from E-Hentai Plus. 
It provides an enhanced reading experience with infinite scroll, full-screen reader mode, and smart image loading.

Currently supported websites (with more to come):
- E-Hentai / ExHentai
- 18comic
- 4KHD

[中文](README.zh-CN.md)

## Features

- **Infinite Scroll Mode** — Seamlessly converts multi-page galleries into a continuous vertical scroll with auto-prefetching. Intelligently preserves native page metadata (e.g., tags, titles, comments). Features real-time reloading upon toggling.
- **Immersive Reader Mode** — A distraction-free, full-screen single-page viewer. Navigate effortlessly via keyboard, mouse wheel, or screen clicks, augmented by a built-in thumbnail sidebar for quick jumping.
- **Ultra-Smooth Performance Engine** — Utilizes smart memory management and low-level DOM virtualization to automatically unmount off-screen elements. Guarantees a stable 60 FPS scrolling experience without memory overflow, even when loading thousands of high-resolution images.
- **High-Efficiency 18comic Decoding Engine (New)** — Engineered with a pioneering HTML5 hardware-accelerated decoding and rapid JPEG reconstruction algorithm, specifically designed to bypass 18comic's image scrambling while drastically reducing CPU load and preventing browser freezes.
- **Smart Anti-Blocking (New)** — Features an intelligent domain feature matching and redirection follower for sites like 4KHD that frequently alter their domains, ensuring uninterrupted script functionality.
- **Error Recovery** — Equipped with a robust auto-retry mechanism for failed image loads, along with a floating visual indicator for monitoring progress and manual reloading.
- **Auto Play** — Enjoy an adjustable slideshow mode for a hands-free reading experience.

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
