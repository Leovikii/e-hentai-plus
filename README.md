# E-Hentai Plus

Enhanced continuous reading mode for E-Hentai / ExHentai with floating controls and ultra-fast loading.

## Features

- **Scroll Mode** — Infinite scroll with automatic next-page loading and image prefetching
- **Reader Mode** — Full-screen single-image viewer with keyboard, mouse wheel, and scrollbar navigation
- **Auto Play** — Automatic image slideshow with configurable interval
- **Skeleton Placeholder** — Pulse animation placeholder for images still loading
- **Floating Controls** — Compact floating button group: reader mode toggle, auto-play, and settings
- **Settings Panel** — Toggle auto scroll, show/hide controls, auto-enter reader mode, and adjust play interval
- **Menu Commands** — Tampermonkey menu integration for quick setting toggles
- **Image Prefetch** — Background prefetching of next page images for seamless browsing

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Install the userscript from [Greasy Fork](https://greasyfork.org/) or build from source

## Build from Source

```bash
# Install dependencies
npm install

# Development mode (with hot reload)
npm run dev

# Production build
npm run build
```

The built userscript will be at `dist/e-hentai-plus.user.js`.

## Tech Stack

- **TypeScript** — Strict mode enabled
- **Vite** + **vite-plugin-monkey** — Build toolchain for Tampermonkey userscripts
- **UnoCSS** — Atomic CSS engine

## Project Structure

```
src/
├── main.ts                    # Entry point
├── menu-commands.ts           # GM_registerMenuCommand registration
├── types/
│   └── index.ts               # Shared type definitions
├── state/
│   ├── config.ts              # Constants and settings loader
│   └── store.ts               # Centralized state management
├── utils/
│   ├── dom.ts                 # DOM utility functions
│   └── icons.ts               # SVG icon constants
├── services/
│   ├── page-parser.ts         # Page parsing (total pages, next URL)
│   ├── image-loader.ts        # Image loading with retry
│   └── prefetch.ts            # Next page prefetching
├── ui/
│   ├── styles.css             # Component styles
│   ├── float-control.ts       # Floating control buttons
│   ├── settings-panel.ts      # Settings panel UI
│   └── single-page/
│       ├── overlay.ts         # Reader mode overlay
│       ├── scrollbar.ts       # Custom scrollbar
│       ├── navigation.ts      # Keyboard/wheel/click navigation
│       └── auto-play.ts       # Auto-play logic
└── features/
    ├── scroll-mode.ts         # Infinite scroll mode
    └── single-page-mode.ts    # Reader mode facade
```

## License

MIT
