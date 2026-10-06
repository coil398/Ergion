import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Ergion/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        uniform: resolve(import.meta.dirname, 'uniform.html'),
        accelerated: resolve(import.meta.dirname, 'accelerated.html'),
      },
    },
  },
});
