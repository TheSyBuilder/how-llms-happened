import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const base = "/journeys/encoder-decoder-alignment/";
const beginner = `${base}beginner/luong-2015/`;
const expert = `${base}expert/luong-2015/`;
const workId = "luong-pham-manning-2015-effective-attention-nmt";
const record = `/reference/works/${workId}/`;
const routes = [beginner, expert, record];

test("final chapter preserves progression, mode, reference and atlas returns", async ({ page }) => {
  await page.goto(`${base}beginner/bahdanau-2014-2015/`);
  await page.getByRole("link", { name: "Continue to Luong in beginner mode" }).click();
  await expect(page).toHaveURL(new RegExp(`${beginner}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Where should the decoder look next?");
  await page.getByRole("link", { name: "Switch to expert" }).click();
  await expect(page).toHaveURL(new RegExp(`${expert}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Audit the state, support and score.");
  await page.getByRole("link", { name: "Inspect the complete seventeen-claim Luong record" }).click();
  await expect(page.locator(".claim-record")).toHaveCount(17);
  await page.getByRole("link", { name: "Audit the mechanism" }).click();
  await expect(page).toHaveURL(new RegExp(`${expert}$`));
  await page.getByRole("link", { name: "Locate this work in the expert atlas" }).click();
  await page.locator(`#work-${workId}`).getByRole("link", { name: /Chapter available/ }).click();
  await expect(page).toHaveURL(new RegExp(`${expert}$`));
  await page.getByRole("link", { name: "Return to Bahdanau in expert mode" }).click();
  await expect(page).toHaveURL(new RegExp(`${base}expert/bahdanau-2014-2015/$`));
});

test("both modes retain source operations and distinct checkpoints without JavaScript", async ({ browser, page: configured }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: configured.viewportSize()! });
  const page = await context.newPage();
  for (const path of [beginner, expert]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "Fixed summary · no new positional read" })).toBeVisible();
    await expect(page.getByRole("list", { name: "Luong current-state operation order" })).toContainText("Compute hₜ");
    await expect(page.getByRole("list", { name: "Input-feeding history path" })).toContainText("h̃ₜ₋₁");
    await page.getByText(path === expert ? "Audit support and the normalization claim" : "Check what a window can miss", { exact: true }).click();
    await page.getByText("Inspect the local-p source boundary", { exact: true }).click();
    await expect(page.getByText(/No local-p weights or gradients are supplied/)).toBeVisible();
    await page.getByText(path === expert ? "Reconstruct the input width and dependency" : "Check which summary reaches the next step", { exact: true }).click();
    await page.getByText(path === expert ? "Audit a 3-wide query and 2-wide source" : "Check whether every score reads source content", { exact: true }).click();
    await page.getByText(path === expert ? "Audit the five-point comparison" : "Check whether five points measure locality alone", { exact: true }).click();
    await page.getByText(path === expert ? "Audit which target word receives the link" : "Check what this alignment test establishes", { exact: true }).click();
    await expect(page.locator("script, input, select, button, astro-island, canvas")).toHaveCount(0);
  }
  await context.close();
});

test("all claims, complete result rows, failed cells and printed discrepancy stay visible", async ({ page }) => {
  for (const path of [beginner, expert]) {
    await page.goto(path);
    await page.locator("details").evaluateAll((items) => items.forEach((item) => item.setAttribute("open", "")));
    const ids = await page.locator(".claim-id").allTextContents();
    expect(new Set(ids.filter((id) => id.startsWith("luong-2015-"))).size).toBe(17);
    for (const [caption, count] of [["Canonical Table 1 · English-to-German component ladder", 12], ["Canonical Table 2 · newstest2015 NIST BLEU", 2], ["Canonical Table 3 · German-to-English component ladder", 7], ["Canonical Table 4 · score and source-scope sweep", 7], ["Canonical footnote 15 · concat perplexities only", 3], ["Canonical Table 6 · alignment error rates", 5]] as const) {
      await expect(page.getByRole("table", { name: caption, exact: true }).locator("tbody tr")).toHaveCount(count);
    }
    const ladder = page.getByRole("table", { name: /Canonical Table 1/ });
    await expect(ladder.getByRole("row", { name: "Base 10.6 11.3", exact: true })).toBeVisible();
    await expect(ladder.getByRole("row", { name: "Base + reversal + dropout + local-p/general + input feeding 5.9 19.0 (+0.9)", exact: true })).toBeVisible();
    await expect(ladder.getByRole("row", { name: "Heterogeneous eight-model ensemble + unknown replacement — 23.0 (+2.1)", exact: true })).toBeVisible();
    const sweep = page.getByRole("table", { name: /Canonical Table 4/ });
    for (const row of ["global/location 6.4 18.1 19.3", "global/dot 6.1 18.6 20.5", "global/general 6.1 17.3 19.1", "local-m/dot · two runs >7.0 × ×", "local-m/general 6.2 18.6 20.4", "local-p/dot 6.6 18.0 19.6", "local-p/general 5.9 19.0 20.9"]) await expect(sweep.getByRole("row", { name: row, exact: true })).toBeVisible();
    for (const row of ["global/location 0.39", "local-m/general 0.34", "local-p/general 0.36", "Ensemble 0.34", "Berkeley Aligner 0.32"]) await expect(page.getByRole("table", { name: /Canonical Table 6/ }).getByRole("row", { name: row, exact: true })).toBeVisible();
    await expect(page.getByText(/printed \+1.9 conflicts with 19.6 − 18.0 = 1.6/)).toBeVisible();
    await expect(page.getByText(/footnote 14 uses aₜ for predicted yₜ/)).toBeVisible();
  }
  await expect(page.getByRole("region", { name: "Luong score-family formulas and corrected concat" }).locator("math")).toHaveCount(5);
});

test("chapter modes and source record pass expanded accessibility checks", async ({ page }) => {
  test.setTimeout(60_000);
  for (const path of routes) {
    await page.goto(path);
    await page.locator("details").evaluateAll((items) => items.forEach((item) => item.setAttribute("open", "")));
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  }
});

test("all table values reflow at four widths", async ({ page }) => {
  test.setTimeout(60_000);
  for (const width of [1440, 768, 640, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of routes) {
      await page.goto(path);
      await page.locator("details").evaluateAll((items) => items.forEach((item) => item.setAttribute("open", "")));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      for (const table of await page.locator(".trace-table").all()) {
        expect(await table.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
        for (const cell of await table.locator("td").all()) expect(await cell.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
      }
    }
  }
});

test("native keyboard reaches checkpoints, sources and scrollable equations", async ({ page }) => {
  await page.goto(expert);
  for (const summary of await page.locator(".prediction-reveal > summary, .trace-arithmetic > summary").all()) {
    await summary.focus(); await page.keyboard.press("Enter");
    await expect(summary.locator("..")).toHaveAttribute("open", "");
  }
  const evidence = page.locator(".evidence-details > summary").first();
  await evidence.focus(); await page.keyboard.press("Enter");
  await expect(page.locator(".evidence-details[open] .source-row a").first()).toBeVisible();
  await page.setViewportSize({ width: 320, height: 800 });
  for (const region of await page.locator(".equation-panel").all()) {
    await region.focus(); await expect(region).toBeFocused();
    if (await region.evaluate((node) => node.scrollWidth > node.clientWidth)) {
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => region.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
    }
  }
});

test("reduced motion, forced colors and hidden graphics preserve support and metrics", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  await page.goto(beginner);
  await page.addStyleTag({ content: "svg, canvas, [aria-hidden='true'] { display: none !important; } * { background-image: none !important; }" });
  await expect(page.getByRole("heading", { name: "Local-m · center follows the target step" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Input-feeding history path" })).toContainText("Concatenate");
  await expect(page.getByRole("table", { name: /Canonical Table 4/ })).toContainText(">7.0");
  await expect(page.getByRole("table", { name: /Canonical Table 6/ })).toContainText("0.32");
});

test("print exposes closed source boundaries, task answers and evidence", async ({ page }) => {
  await page.goto(expert);
  const details = page.getByText("Inspect the local-p source boundary", { exact: true }).locator("..");
  await expect(details).not.toHaveAttribute("open");
  await page.emulateMedia({ media: "print" });
  expect(await details.locator("dl").evaluate((node) => node.getBoundingClientRect().height)).toBeGreaterThan(0);
  expect(await page.locator(".prediction-reveal p").first().evaluate((node) => node.getBoundingClientRect().height)).toBeGreaterThan(0);
  expect(await page.locator(".evidence-details .source-row").first().evaluate((node) => node.getBoundingClientRect().height)).toBeGreaterThan(0);
  await expect(details).not.toHaveAttribute("open");
});
