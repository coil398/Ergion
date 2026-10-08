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
        homogeneous: resolve(import.meta.dirname, 'homogeneous.html'),
        exact: resolve(import.meta.dirname, 'exact.html'),
        bernoulli: resolve(import.meta.dirname, 'bernoulli.html'),
        secondOrder: resolve(import.meta.dirname, 'second-order.html'),
        undetermined: resolve(import.meta.dirname, 'undetermined.html'),
        variation: resolve(import.meta.dirname, 'variation.html'),
        laplace: resolve(import.meta.dirname, 'laplace.html'),
        series: resolve(import.meta.dirname, 'series.html'),
        system: resolve(import.meta.dirname, 'system.html'),
        euler: resolve(import.meta.dirname, 'euler.html'),
        midpoint: resolve(import.meta.dirname, 'midpoint.html'),
        rk4: resolve(import.meta.dirname, 'rk4.html'),
        newton: resolve(import.meta.dirname, 'newton.html'),
      },
    },
  },
});
