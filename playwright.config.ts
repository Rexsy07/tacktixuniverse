import { defineConfig } from '@playwright/test'

export default defineConfig({
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:8080',
    headless: true,
    // Use the system-installed Microsoft Edge to avoid downloading browsers (network-restricted envs)
    channel: 'msedge',
    viewport: { width: 1280, height: 800 },
    actionTimeout: 10_000,
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  reporter: [['list']],
})
