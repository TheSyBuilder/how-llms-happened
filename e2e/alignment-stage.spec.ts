import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const base = "/journeys/encoder-decoder-alignment/";
const beginner = `${base}beginner/cho-2014/`;
const expert = `${base}expert/cho-2014/`;
const workId = "cho-2014-rnn-encoder-decoder";
const record = `/reference/works/${workId}/`;
const routes = [base, `${base}beginner/`, `${base}expert/`, beginner, expert, record];

test("chooser, stage modes, records and atlas returns preserve destination identity", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Explore source summaries and alignment/ }).click();
  await page.getByRole("link", { name: "Preview the beginner path" }).click();
  await expect(page.getByText("Chapter queued", { exact: true })).toHaveCount(2);
  await page.getByRole("link", { name: /Start with Cho et al/ }).click();
  await expect(page).toHaveURL(new RegExp(`${beginner}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("How can one phrase become a score for another?");
  await page.getByRole("link", { name: "Switch to expert" }).click();
  await expect(page).toHaveURL(new RegExp(`${expert}$`));
  await page.getByRole("link", { name: /Inspect the complete fourteen-claim/ }).click();
  await expect(page).toHaveURL(new RegExp(`${record}$`));
  await expect(page.locator(".claim-record")).toHaveCount(14);
  await page.getByRole("link", { name: "Audit the mechanism" }).click();
  await expect(page).toHaveURL(new RegExp(`${expert}$`));
  await page.getByRole("link", { name: "Locate this work in the expert atlas" }).click();
  await expect(page).toHaveURL(new RegExp(`/atlas/expert/#work-${workId}$`));
  await page.locator(`#work-${workId}`).getByRole("link", { name: /Chapter available/ }).click();
  await expect(page).toHaveURL(new RegExp(`${expert}$`));
  await page.getByRole("link", { name: /Revisit recurrent word prediction in expert mode/ }).click();
  await expect(page).toHaveURL(/recurrent-memory\/expert\/mikolov-2010\/$/);
});

test("both conditional score and reset alternatives remain complete without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const path of [beginner, expert]) {
    const decimals = path === expert ? 6 : 3;
    const f = (v: number) => v.toFixed(decimals);
    await page.goto(path);
    const probabilities = page.getByRole("table", { name: /Synthetic conditional target probabilities/ });
    for (const [label, values] of [["P(X)", [.6, .1, .1]], ["P(Y)", [.2, .6, .1]], ["P(<eos>)", [.2, .3, .8]], ["Selected factor", [.6, .6, .8]] ] as const) {
      await expect(probabilities.getByRole("row", { name: `${label} ${values.map(f).join(" ")}`, exact: true })).toBeVisible();
    }
    for (const [caption, values] of [["Main Eq. 8", [.43101626751925814, -.42956124923200834]], ["Attachment encoder", [.5097770067246635, -.5082198056445675]]] as const) {
      const table = page.getByRole("table", { name: `${caption} · complete synthetic update`, exact: true });
      await expect(table.getByRole("row", { name: `Sum → new state ${values.map(f).join(" ")}`, exact: true })).toBeVisible();
    }
    await page.getByText("Check the phrase score", { exact: true }).click();
    await expect(page.getByText(/leaving it out would score an unfinished prefix/)).toBeVisible();
    await page.getByText("Check reset and carry", { exact: true }).click();
    await expect(page.getByText(/Reset controls the candidate’s use of old state/)).toBeVisible();
    await page.getByText("Check what the BLEU gain establishes", { exact: true }).click();
    await expect(page.getByText(/It does not measure a standalone neural sentence translator/)).toBeVisible();
    await page.getByText("Inspect all supplied logits and normalizers", { exact: true }).click();
    await expect(page.getByRole("table", { name: "Step 3 · supplied scores and shifted exponentials", exact: true })).toBeVisible();
    await page.getByText("Inspect gate inputs and matrix order", { exact: true }).click();
    await expect(page.getByRole("table", { name: "Supplied gate logits and reset-order intermediates" })).toBeVisible();
    await expect(page.locator("script, input, select, button, astro-island, canvas")).toHaveCount(0);
  }
  await context.close();
});

test("canonical results retain every component and both split values", async ({ page }) => {
  await page.goto(expert);
  const table = page.getByRole("table", { name: "Canonical Table 1 · development and test BLEU" });
  for (const row of ["Baseline 30.64 33.30", "Baseline + RNN 31.20 33.87", "Baseline + CSLM + RNN 31.48 34.64", "Baseline + CSLM + RNN + WP 31.50 34.54"]) {
    await expect(table.getByRole("row", { name: row, exact: true })).toBeVisible();
  }
  await expect(page.getByText(/Attachment §1.1: 500-dimensional source embeddings/)).toBeVisible();
  await expect(page.getByText(/Hardware, epoch count, convergence rule/)).toBeVisible();
  await expect(page.getByText(/main phrase plot says 5,000 points/)).toBeVisible();
  await expect(page.getByRole("region", { name: "Conditional probability and sequence objective" }).locator("math")).toHaveCount(3);
  await expect(page.getByRole("heading", { name: "One work, several consequential revisions." })).toBeVisible();
  await expect(page.getByRole("link", { name: /Continue to Sutskever in expert mode/ })).toHaveAttribute("href", /\/expert\/sutskever-2014\/$/);
});

test("native checkpoints, evidence and equation scrolling work with the keyboard", async ({ page }) => {
  await page.goto(expert);
  for (const summary of await page.locator(".prediction-reveal > summary, .trace-arithmetic > summary").all()) {
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(summary.locator("..")).toHaveAttribute("open", "");
  }
  const evidence = page.locator(".evidence-details > summary").first();
  await evidence.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".evidence-details[open] .source-row a").first()).toBeVisible();
  await page.setViewportSize({ width: 320, height: 800 });
  for (const region of await page.locator(".equation-panel").all()) {
    await region.focus();
    await expect(region).toBeFocused();
    if (await region.evaluate((node) => node.scrollWidth > node.clientWidth)) {
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => region.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
    }
  }
});

test("all six routes pass axe with evidence and arithmetic expanded", async ({ page }) => {
  test.setTimeout(60_000);
  for (const path of routes) {
    await page.goto(path);
    await page.locator("details").evaluateAll((items) => items.forEach((item) => item.setAttribute("open", "")));
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations).toEqual([]);
  }
});

test("all chapter and arithmetic cells reflow at four widths", async ({ page }) => {
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

test("graphics-hidden, reduced-motion and forced-color views preserve the teaching distinctions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  await page.goto(beginner);
  await page.addStyleTag({ content: "svg, canvas, [aria-hidden='true'] { display: none !important; } * { background-image: none !important; }" });
  await expect(page.getByRole("table", { name: /Main Eq. 8 · complete synthetic update/ })).toContainText("0.431");
  await page.getByText("Check reset and carry", { exact: true }).click();
  await expect(page.getByText(/z = 0.8 keeps a 0.48 old-state contribution/)).toBeVisible();
  await expect(page.getByRole("table", { name: /Canonical Table 1/ })).toContainText("34.64");
  await expect(page.getByRole("list", { name: "Evaluated phrase-table scoring path" })).toHaveCount(1);
});

test("print exposes closed arithmetic and evidence without changing disclosure state", async ({ page }) => {
  await page.goto(expert);
  const details = page.locator(".trace-arithmetic").first();
  await expect(details).not.toHaveAttribute("open");
  await page.emulateMedia({ media: "print" });
  const table = page.getByRole("table", { name: "Step 1 · supplied scores and shifted exponentials", exact: true });
  expect(await table.evaluate((node) => node.getBoundingClientRect().height)).toBeGreaterThan(0);
  const source = page.locator(".evidence-details .source-row").first();
  expect(await source.evaluate((node) => node.getBoundingClientRect().height)).toBeGreaterThan(0);
  await expect(details).not.toHaveAttribute("open");
});
