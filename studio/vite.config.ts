import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const root = import.meta.dirname;
const pages = Object.fromEntries(
  readdirSync(root)
    .filter(name => name.endsWith('.html'))
    .map(name => [name === 'index.html' ? 'main' : name.replace(/\.html$/, ''), resolve(root, name)]),
);

export default defineConfig({
  base: '/Ergion/',
  server: {
    fs: {
      allow: [resolve(root, '..')],
    },
  },
  build: {
    rollupOptions: {
      input: pages,
    },
  },
});
