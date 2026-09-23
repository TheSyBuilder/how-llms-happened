import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const beginnerPath = "/journeys/smoothing/beginner/good-1953/";
const expertPath = "/journeys/smoothing/expert/good-1953/";

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
  const paths = ["/", "/journeys/smoothing/", beginnerPath, expertPath, "/reference/works/good-1953-population-frequencies/"];
  for (const path of paths) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, `${path} on ${testInfo.project.name}`).toEqual([]);
  }
});

test("narrow layout avoids essential horizontal page scrolling", async ({ page }) => {
  await page.goto(expertPath);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
