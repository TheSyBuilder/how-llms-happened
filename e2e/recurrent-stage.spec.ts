import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const base = "/journeys/recurrent-memory/";
const beginner = `${base}beginner/elman-1988-1990/`;
const expert = `${base}expert/elman-1988-1990/`;
const record = "/reference/works/elman-1988-finding-structure-in-time/";

test("the recurrent chooser and previews expose Elman while later chapters stay queued", async ({ page }) => {
  await page.goto(base);
  await page.getByRole("link", { name: "Preview the beginner path" }).click();
  await expect(page.getByRole("list", { name: /From carried state/ }).getByText("Chapter queued")).toHaveCount(5);
  await page.getByRole("link", { name: /Start with Elman/ }).click();
  await expect(page).toHaveURL(new RegExp(`${beginner}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Can the same word leave a different state?");
  await page.getByRole("link", { name: /Switch to expert/ }).click();
  await expect(page).toHaveURL(new RegExp(`${expert}$`));
  await expect(page.getByRole("heading", { name: "A scalar update you can audit" })).toBeVisible();
  await expect(page.locator("astro-island")).toHaveCount(0);
});

test("both static Elman traces and answers remain complete without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const path of [beginner, expert]) {
    await page.goto(path);
    const precise = path === expert;
    const a = page.getByRole("table", { name: /History A: complete forward-state/ });
    const b = page.getByRole("table", { name: /History B: complete forward-state/ });
    await expect(a.getByRole("row", { name: /Copied context/ })).toContainText(precise ? "0.446125" : "0.446");
    await expect(b.getByRole("row", { name: /Copied context/ })).toContainText(precise ? "0.639205" : "0.639");
    await expect(a.getByRole("row", { name: /Resulting state/ })).toContainText(precise ? "0.570012" : "0.570");
    await expect(b.getByRole("row", { name: /Resulting state/ })).toContainText(precise ? "0.607392" : "0.607");
    await page.getByText("Check the prediction", { exact: true }).click();
    await expect(page.getByText(/Different copied contexts produce different final states/)).toBeVisible();
    if (path === expert) {
      await page.getByText("Reconstruct History A term by term", { exact: true }).click();
      await expect(page.getByRole("table", { name: /History A: scalar teaching calculation/ })).toContainText("0.281900");
    }
    await expect(page.getByRole("link", { name: /Return to the .* route map/ })).toBeVisible();
  }
  await context.close();
});

test("the native checkpoint and source inspection work from the keyboard", async ({ page }) => {
  await page.goto(beginner);
  const checkpoint = page.locator(".prediction-reveal > summary");
  await checkpoint.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/Different copied contexts produce different final states/)).toBeVisible();
  const evidence = page.locator(".evidence-details > summary").first();
  await evidence.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".evidence-details[open] .source-row a").first()).toBeVisible();
});

test("graphics-hidden and reduced-motion treatments preserve the state comparison", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(beginner);
  await page.addStyleTag({ content: "svg, canvas, [aria-hidden='true'] { display: none !important; } * { background-image: none !important; }" });
  await expect(page.getByRole("table", { name: /History A: complete forward-state/ })).toContainText("0.570");
  await expect(page.getByRole("table", { name: /History B: complete forward-state/ })).toContainText("0.607");
  await page.getByText("Check the prediction", { exact: true }).click();
  await expect(page.getByText(/History dependence does not require every pair/)).toBeVisible();
});

test("the expert treatment keeps the copy, training, and output boundaries visible", async ({ page }) => {
  await page.goto(expert);
  await expect(page.getByText(/wₕ = 0.8 belongs to the separate trainable return path/)).toBeVisible();
  await expect(page.getByText(/No compact scalar recurrence is printed there/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Forward recurrence is not full temporal credit" })).toBeVisible();
  await expect(page.getByText(/Those figures are neither held-out perplexity/)).toBeVisible();
  await expect(page.locator("input, select, button, astro-island")).toHaveCount(0);
  await page.goto(record);
  await expect(page.locator(".claim-record")).toHaveCount(10);
  await page.getByRole("link", { name: "Audit the mechanism" }).click();
  await expect(page).toHaveURL(new RegExp(`${expert}$`));
});

test("recurrent pages pass axe with the checkpoint and evidence open", async ({ page }) => {
  for (const path of [base, `${base}beginner/`, `${base}expert/`, beginner, expert, record]) {
    await page.goto(path);
    await page.locator("details").evaluateAll((items) => items.forEach((item) => item.setAttribute("open", "")));
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  }
});

test("all recurrent content reflows at 320 and 640 CSS pixels", async ({ page }) => {
  for (const width of [320, 640]) {
    await page.setViewportSize({ width, height: 800 });
    for (const path of [base, `${base}beginner/`, `${base}expert/`, beginner, expert, record]) {
      await page.goto(path);
      await page.locator("details").evaluateAll((items) => items.forEach((item) => item.setAttribute("open", "")));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      for (const table of await page.locator(".trace-table").all()) {
        expect(await table.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
        for (const cell of await table.locator("td").all()) {
          expect(await cell.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
        }
      }
    }
  }
});
