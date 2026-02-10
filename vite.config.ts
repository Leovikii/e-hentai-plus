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
          '': 'e-hentai Plus',
          'zh-CN': 'E-Hentai 增强阅读',
        },
        namespace: 'http://tampermonkey.net/',
        homepageURL: 'https://github.com/Leovikii/e-hentai-plus',
        version: '2.2.1',
        description: {
          '': 'Infinite scroll & reader mode with image prefetch and floating controls for E-Hentai / ExHentai',
          'zh-CN': '为 E-Hentai / ExHentai 提供无限滚动和阅读模式，支持图片预取与悬浮控制',
        },
        author: 'Viki',
        updateURL: 'https://github.com/Leovikii/e-hentai-plus/releases/latest/download/e-hentai-plus.user.js',
        downloadURL: 'https://github.com/Leovikii/e-hentai-plus/releases/latest/download/e-hentai-plus.user.js',
        match: [
          'https://e-hentai.org/g/*',
          'https://exhentai.org/g/*',
        ],
        grant: [
          'GM_getValue',
          'GM_setValue',
          'GM_registerMenuCommand',
        ],
        license: 'MIT',
      },
      build: {
        fileName: 'e-hentai-plus.user.js',
        autoGrant: true,
      },
    }),
  ],
});
