import os from 'node:os'
import { defineConfig, devices } from '@playwright/test'

// When CPU model strings are missing (e.g. some sandboxes), Playwright picks mac-x64 on arm64 Darwin.
if (
  process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE === undefined &&
  os.platform() === 'darwin' &&
  os.arch() === 'arm64' &&
  !os.cpus().some((c) => String(c.model).includes('Apple'))
) {
  const darwinMajor = Number(os.release().split('.')[0])
  const macSlot = Math.min(darwinMajor - 9, 15)
  process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE = `mac${macSlot}-arm64`
}

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
