import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const channel = process.env.LLM_LINEAGE_BROWSER_CHANNEL === "chrome" ? { channel: "chrome" as const } : {};
// LINEAGE_E2E_ROOT: a folder whose dist/ is the build under test (default: this repo's dist/).
// LINEAGE_E2E_PORT: serve it on another port when 4321 is taken.
const port = Number(process.env.LINEAGE_E2E_PORT ?? 4321);
const root = resolve(process.env.LINEAGE_E2E_ROOT ?? ".");
// Base-path run: build and test with the same SITE_BASE, for example
//   SITE_BASE=/how-llms-happened npx astro build && SITE_BASE=/how-llms-happened npx playwright test
// It runs only the @base tests; the normal run skips them.
const siteBase = (process.env.SITE_BASE ?? "").replace(/\/$/, "");

export default defineConfig({
  testDir: "./e2e",
  testMatch: "lineage.spec.ts",
  fullyParallel: true,
  retries: 0,
  reporter: "line",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `node ${JSON.stringify(resolve("scripts/serve-dist.mjs"))}`,
    cwd: root,
    env: { PORT: String(port), SITE_BASE: siteBase },
    url: `http://127.0.0.1:${port}${siteBase}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: siteBase
    ? [{ name: "base-path", grep: /@base/, use: { ...devices["Desktop Chrome"], ...channel } }]
    : [
        { name: "chromium", grepInvert: /@base/, use: { ...devices["Desktop Chrome"], ...channel } },
        {
          name: "mobile-chromium",
          // Phones run the per-page smoke checks, including the 320 px overflow check.
          grep: /@smoke/,
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
