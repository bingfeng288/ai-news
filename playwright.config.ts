import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright UI test configuration for AI News static site.
 * Uses a local static file server to serve the site during tests.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["list"],
  ],
  use: {
    baseURL: "http://localhost:3456",
    trace: "on-first-retry",
    screenshot: "on",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "tablet",
      use: { ...devices["iPad (gen 7)"] },
    },
  ],
  webServer: {
    command: "npx serve . -l 3456 -s",
    port: 3456,
    reuseExistingServer: !process.env.CI,
  },
});
