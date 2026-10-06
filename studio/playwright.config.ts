import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:4187/Ergion/',
    headless: true,
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/local/bin/google-chrome',
    },
  },
  webServer: {
    command: 'npm run preview -- --port 4187 --strictPort',
    wait: { stdout: /Local:\s+http:\/\/127\.0\.0\.1:4187\/Ergion\// },
    timeout: 30_000,
  },
});
