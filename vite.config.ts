import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import UnoCSS from '@unocss/vite';

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

        description: {
          '': 'Infinite scroll & reader mode with image prefetch and floating controls for E-Hentai / ExHentai',
          'zh-CN': '为 E-Hentai / ExHentai 提供无限滚动和阅读模式，支持图片预取与悬浮控制',
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
          '*://*.uuss.uk/*',
          '*://*.ssuu.uk/*',
        ],
        grant: [
          'GM_getValue',
          'GM_setValue',
          'GM_registerMenuCommand',
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
