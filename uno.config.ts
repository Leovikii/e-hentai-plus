import { defineConfig, presetUno } from 'unocss';

export default defineConfig({
  presets: [presetUno()],
  content: {
    filesystem: ['src/**/*.ts'],
  },
  theme: {
    colors: {
      'eh-bg': '#111',
      'eh-surface': '#1a1a1a',
      'eh-border': '#555',
      'eh-text': '#ccc',
      'eh-text-dim': '#888',
      'eh-accent': '#4CAF50',
      'eh-error': '#d44',
    },
  },
});
