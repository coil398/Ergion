import { defineConfig } from '@playwright/test';

const port = Number(process.env.STUDIO_PORT ?? 4187);
const outDir = process.env.STUDIO_DIST ?? 'dist';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: false,
  use: {
    baseURL: `http://127.0.0.1:${port}/Ergion/`,
    headless: true,
    colorScheme: 'light',
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/local/bin/google-chrome',
    },
  },
  webServer: {
    command: `npm run preview -- --port ${port} --strictPort --outDir ${outDir}`,
    wait: { stdout: new RegExp(`Local:\\s+http://127\\.0\\.0\\.1:${port}/Ergion/`) },
    timeout: 30_000,
  },
});
