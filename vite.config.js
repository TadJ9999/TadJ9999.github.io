import { defineConfig } from 'vite';

export default defineConfig({
  // relative base so the built site works from any host path (GitHub Pages included)
  base: './',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
  },
});
