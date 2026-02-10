import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import UnoCSS from '@unocss/vite';

export default defineConfig({
  plugins: [
    UnoCSS(),
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'e-hentai Plus',
        'name:zh-CN': 'E-Hentai Plus',
        namespace: 'http://tampermonkey.net/',
        homepageURL: 'https://github.com/Leovikii/sm/tree/main/js',
        version: '2.2',
        description: 'Continuous reading mode with floating page control and ultra-fast loading',
        'description:zh-CN': 'E-Hentai 的增强型连续阅读模式，具有高级功能和优化。',
        author: 'Viki',
        updateURL: 'https://raw.githubusercontent.com/Leovikii/sm/refs/heads/main/js/e-hentai%20Plus.js',
        downloadURL: 'https://raw.githubusercontent.com/Leovikii/sm/refs/heads/main/js/e-hentai%20Plus.js',
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
