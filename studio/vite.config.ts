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
        derivative: resolve(import.meta.dirname, 'derivative.html'),
        ode: resolve(import.meta.dirname, 'ode.html'),
        integrate: resolve(import.meta.dirname, 'integrate.html'),
        separation: resolve(import.meta.dirname, 'separation.html'),
        linear: resolve(import.meta.dirname, 'linear.html'),
        euler: resolve(import.meta.dirname, 'euler.html'),
      },
    },
  },
});
