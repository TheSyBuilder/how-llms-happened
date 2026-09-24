import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const beginnerPath = "/journeys/smoothing/beginner/good-1953/";
const expertPath = "/journeys/smoothing/expert/good-1953/";
const beginnerKatzPath = "/journeys/smoothing/beginner/katz-1987/";
const expertKatzPath = "/journeys/smoothing/expert/katz-1987/";

async function waitForKatzHydration(page: Page) {
  await page.getByLabel("Count pattern").scrollIntoViewIfNeeded();
  await expect(page.locator("astro-island")).not.toHaveAttribute("ssr", "");
}

test("beginner and expert routes expose different tasks over the same work", async ({ page }) => {
  await page.goto(beginnerPath);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("How can rare events reveal the unseen?");
  await expect(page.getByText("beginner mode")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Count what appeared once" })).toBeVisible();
  await page.getByRole("link", { name: /Switch to expert/ }).click();
  await expect(page).toHaveURL(new RegExp(`${expertPath}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What does n₁/N estimate—and what does it not?");
  await expect(page.getByText("Frequency-of-frequencies register")).toBeVisible();
});

test("the Good stage remains complete without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(beginnerPath);
  await expect(page.getByRole("table", { name: "Observed synthetic types and counts" })).toBeVisible();
  await expect(page.getByText("n₁ / N = 3 / 12 = 0.25")).toBeVisible();
  await page.getByText("Check the prediction").click();
  await expect(page.getByText(/The estimate is 25%/)).toBeVisible();
  await context.close();
});

test("beginner Katz predicts the zero-estimate gate and changes reviewed scenarios", async ({ page }) => {
  await page.goto(beginnerKatzPath);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("When does Katz keep an estimate—and when does it back off?");
  await waitForKatzHydration(page);
  await page.getByLabel("Only continuations with a zero higher-order estimate").check();
  await page.getByRole("button", { name: "Check prediction" }).click();
  await expect(page.getByRole("status")).toContainText("Correct");
  await expect(page.getByRole("table", { name: "Final conditional probabilities after the active Katz branch" }).getByRole("row", { name: /improved/ })).toContainText("0.06");

  await page.getByLabel("Count pattern").selectOption("narrow-eligible-set");
  await expect(page.getByRole("status")).toContainText("Three seen, one unseen loaded");
  await expect(page.getByRole("table", { name: "Final conditional probabilities after the active Katz branch" }).getByRole("row", { name: /adapts/ })).toContainText("0.25");
});

test("expert Katz exposes alpha, cutoff, and direct unseen-history recursion", async ({ page }) => {
  await page.goto(expertKatzPath);
  await waitForKatzHydration(page);
  await expect(page.getByText("α = 0.1 / 0.5 = 0.2")).toBeVisible();
  await page.getByLabel("Count pattern").selectOption("narrow-eligible-set");
  await expect(page.getByText("α = 0.25 / 0.1 = 2.5")).toBeVisible();
  await page.getByRole("button", { name: "Compare with default" }).click();
  await expect(page.getByRole("table", { name: /State change/ })).toBeVisible();
  await page.getByLabel("Count pattern").selectOption("unseen-history");
  await expect(page.getByText("β̃ and α are not computed for this branch.")).toBeVisible();
});

test("a committed Katz update stays inside the interaction budget", async ({ page }) => {
  await page.goto(expertKatzPath);
  await waitForKatzHydration(page);
  const elapsed = await page.evaluate(async () => {
    const ledger = document.querySelector<HTMLElement>(".katz-ledger");
    const select = document.querySelector<HTMLSelectElement>("#katz-scenario");
    if (ledger === null || select === null) throw new Error("Katz controls are unavailable.");
    const committed = new Promise<void>((resolve) => {
      const observer = new MutationObserver(() => {
        if (ledger.dataset.scenario === "narrow-eligible-set") {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(ledger, { attributes: true, attributeFilter: ["data-scenario"] });
    });
    const started = performance.now();
    select.value = "narrow-eligible-set";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await committed;
    return performance.now() - started;
  });
  expect(elapsed).toBeLessThan(50);
});

test("reduced motion and a hidden graphic preserve the semantic ledger", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(beginnerKatzPath);
  await waitForKatzHydration(page);
  const motion = await page.locator(".mass-bar span").evaluateAll((nodes) => nodes.map((node) => {
    const style = getComputedStyle(node);
    return { transition: style.transitionDuration, animation: style.animationName };
  }));
  expect(motion.every((item) => item.transition === "0s" && item.animation === "none")).toBe(true);
  await page.locator(".mass-transfer").evaluate((node) => { (node as HTMLElement).style.display = "none"; });
  await expect(page.getByRole("table", { name: "Final conditional probabilities after the active Katz branch" })).toBeVisible();
  await expect(page.getByText("observed history · zero-estimate gate")).toBeVisible();
});

test("the Katz stage retains its default ledger and sources without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(beginnerKatzPath);
  await expect(page.getByRole("table", { name: "Final conditional probabilities after the active Katz branch" })).toBeVisible();
  await expect(page.getByText("The default Katz ledger", { exact: false })).toBeVisible();
  await page.getByText("Why does only the zero branch use lower-order probability?").click();
  await expect(page.getByText("This is hard backoff, not an all-event interpolation rule.")).toBeVisible();
  await context.close();
});

test("evidence opens inline and reaches a stable claim anchor", async ({ page }) => {
  await page.goto(beginnerPath);
  const firstEvidence = page.locator("details.evidence-details").first();
  await firstEvidence.locator("summary").click();
  const claimLink = firstEvidence.getByRole("link", { name: "Inspect this claim in the work record" });
  const href = await claimLink.getAttribute("href");
  expect(href).toMatch(/^\/reference\/works\/good-1953-population-frequencies\/#claim-good-1953-/);
  await claimLink.click();
  await expect(page.locator(":target")).toBeVisible();
});

test("checkpoint and evidence disclosure work from the keyboard", async ({ page }) => {
  await page.goto(beginnerPath);
  const checkpoint = page.locator("details.checkpoint");
  await checkpoint.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(checkpoint).toHaveAttribute("open", "");

  const evidence = page.locator("details.evidence-details").first();
  await evidence.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(evidence).toHaveAttribute("open", "");
  await page.keyboard.press("Tab");
  await expect(evidence.locator("a").first()).toBeFocused();
});

test("the built pages have no automatically detectable accessibility violations", async ({ page }, testInfo) => {
  const paths = [
    "/",
    "/journeys/smoothing/",
    beginnerPath,
    expertPath,
    beginnerKatzPath,
    expertKatzPath,
    "/reference/works/good-1953-population-frequencies/",
    "/reference/works/katz-1987-sparse-data/",
  ];
  for (const path of paths) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, `${path} on ${testInfo.project.name}`).toEqual([]);
  }
});

test("narrow and 200%-zoom-equivalent layouts avoid essential page scrolling", async ({ page }) => {
  for (const width of [320, 640]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(expertKatzPath);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${width}px viewport`).toBeLessThanOrEqual(1);
  }
});
