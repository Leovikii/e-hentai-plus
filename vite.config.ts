import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import UnoCSS from '@unocss/vite';
import { readFileSync } from 'fs';

const iconBase64 = readFileSync('src/assets/icon.png', 'base64');

export default defineConfig({
  plugins: [
    UnoCSS(),
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: {
          '': 'Hentai Reader',
          'zh-CN': '绅士阅读器',
        },
        namespace: 'http://tampermonkey.net/',
        homepageURL: 'https://github.com/Leovikii/Hentai-Reader',
        icon: `data:image/png;base64,${iconBase64}`,

        description: {
          '': 'A generalized multi-site reading framework. Provides an enhanced reading experience with infinite scroll, full-screen reader mode, and smart image loading for E-Hentai, 18comic, 4KHD, etc.',
          'zh-CN': '多站点通用阅读框架，为 E-Hentai、18comic、4KHD 等提供无限滚动、全屏阅读模式、智能预取与硬件加速解码',
        },
        author: 'Viki',
        updateURL: 'https://github.com/Leovikii/Hentai-Reader/releases/latest/download/hentai-reader.user.js',
        downloadURL: 'https://github.com/Leovikii/Hentai-Reader/releases/latest/download/hentai-reader.user.js',
        match: [
          'https://e-hentai.org/g/*',
          'https://exhentai.org/g/*',
          'https://e-hentai.org/s/*',
          'https://exhentai.org/s/*',
          '*://*.4khd.com/*',
          '*://*.xxtt.ink/*',
          '*://*.uuss.uk/*',
          '*://*.ssuu.uk/*',
          '*://*.18comic.vip/*',
          '*://*.18comic.ink/*',
        ],
        grant: [
          'GM_getValue',
          'GM_setValue',
          'GM_registerMenuCommand',
          'unsafeWindow',
        ],
        license: 'MIT',
      },
      build: {
        fileName: 'hentai-reader.user.js',
        autoGrant: true,
      },
    }),
  ],
});
