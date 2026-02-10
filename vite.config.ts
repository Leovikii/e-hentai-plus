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
        namespace: 'http://tampermonkey.net/',
        homepageURL: 'https://github.com/Leovikii/e-hentai-plus',
        version: '2.2',
        description: 'Continuous reading mode with floating page control and ultra-fast loading',
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
