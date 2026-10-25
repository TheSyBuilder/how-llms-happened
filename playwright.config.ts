import { defineConfig, devices } from "@playwright/test";

const channel = process.env.LLM_LINEAGE_BROWSER_CHANNEL === "chrome" ? { channel: "chrome" as const } : {};

export default defineConfig({
  testDir: "./e2e",
  testMatch: "lineage.spec.ts",
  fullyParallel: true,
  retries: 0,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:4321",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/serve-dist.mjs",
    url: "http://127.0.0.1:4321",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], ...channel } },
    {
      name: "mobile-chromium",
      use: {
        browserName: "chromium",
        ...channel,
        viewport: { width: 320, height: 640 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
