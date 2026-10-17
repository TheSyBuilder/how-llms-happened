import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const base = "/journeys/encoder-decoder-alignment/";
const beginner = `${base}beginner/sutskever-2014/`;
const expert = `${base}expert/sutskever-2014/`;
const workId = "sutskever-vinyals-le-2014-sequence-to-sequence";
const gravesId = "graves-2013-generating-sequences-recurrent-neural-networks";
const record = `/reference/works/${workId}/`;
const gravesRecord = `/reference/works/${gravesId}/`;
const routes = [beginner, expert, record, gravesRecord];

test("chapter progression, mode switching and both source records retain their owner", async ({ page }) => {
  await page.goto(`${base}beginner/cho-2014/`);
  await page.getByRole("link", { name: "Continue to Sutskever in beginner mode" }).click();
  await expect(page).toHaveURL(new RegExp(`${beginner}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What changes when we reverse the source?");
  await page.getByRole("link", { name: "Switch to expert" }).click();
  await expect(page).toHaveURL(new RegExp(`${expert}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Which source order, search and result pipeline?");
  await page.getByRole("link", { name: "Inspect the complete fifteen-claim Sutskever record" }).click();
  await expect(page.locator(".claim-record")).toHaveCount(15);
  await page.getByRole("link", { name: "Audit the mechanism" }).click();
  await expect(page).toHaveURL(new RegExp(`${expert}$`));
  await page.getByRole("link", { name: "Inspect Graves’s complete source record" }).click();
  await expect(page).toHaveURL(new RegExp(`${gravesRecord}$`));
  await expect(page.locator(".claim-record")).toHaveCount(15);
  await page.getByRole("link", { name: "Audit the prerequisite" }).click();
  await expect(page).toHaveURL(new RegExp(`${expert}#graves-formulation-prerequisite$`));
  await page.getByRole("link", { name: "Revisit state-to-gate feedback" }).click();
  await expect(page).toHaveURL(/recurrent-memory\/expert\/gers-2002\/$/);
  await page.goto(expert);
  await page.getByRole("link", { name: "Locate this work in the expert atlas" }).click();
  await page.locator(`#work-${workId}`).getByRole("link", { name: /Chapter available/ }).click();
  await expect(page).toHaveURL(new RegExp(`${expert}$`));
});

test("original identities, EOS slots and early late mean gaps survive without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const path of [beginner, expert]) {
    await page.goto(path);
    await expect(page.getByRole("list", { name: "Forward source", exact: true }).locator("strong")).toHaveText(["A", "B", "C", "D", "<eos>"]);
    await expect(page.getByRole("list", { name: "Reversed source", exact: true }).locator("strong")).toHaveText(["D", "C", "B", "A", "<eos>"]);
    await expect(page.getByRole("list", { name: "Unchanged target", exact: true }).locator("span")).toHaveText(["slot 5", "slot 6", "slot 7", "slot 8", "slot 9"]);
    const gaps = page.getByRole("table", { name: "Same declared pairs · gaps in slot transitions" });
    for (const row of ["A → W 5 2", "B → X 5 4", "C → Y 5 6", "D → Z 5 8", "Mean 5 5"]) await expect(gaps.getByRole("row", { name: row, exact: true })).toBeVisible();
    await page.getByText("Check early, late and average distance", { exact: true }).click();
    await expect(page.getByText(/It does not measure a gradient’s magnitude/)).toBeVisible();
    await page.getByText("Inspect slot arithmetic and the mean boundary", { exact: true }).click();
    await expect(page.getByText(/Retain only A → W and the means become 5 versus 2/)).toBeVisible();
    await page.getByText("Check the candidate source behind 36.5", { exact: true }).click();
    await expect(page.getByText(/oracle uses reference knowledge/)).toBeVisible();
    await expect(page.locator("script, input, select, button, astro-island, canvas")).toHaveCount(0);
  }
  await context.close();
});

test("both complete result ledgers preserve search, candidate and score conditions", async ({ page }) => {
  await page.goto(expert);
  const direct = page.getByRole("table", { name: "Canonical Table 1 · complete direct-decoding comparison" });
  const rescoring = page.getByRole("table", { name: "Canonical Table 2 · complete SMT-combination and rescoring comparison" });
  await expect(direct.locator("tbody tr")).toHaveCount(8);
  await expect(rescoring.locator("tbody tr")).toHaveCount(7);
  for (const row of ["Bahdanau et al. · comparison system 28.45", "Phrase-based baseline · comparison system 33.30", "1 forward LSTM · beam 12 26.17", "1 reversed LSTM · beam 12 30.59", "5 reversed LSTMs · beam 1 33.00", "2 reversed LSTMs · beam 12 33.27", "5 reversed LSTMs · beam 2 34.50", "5 reversed LSTMs · beam 12 34.81"]) await expect(direct.getByRole("row", { name: row, exact: true })).toBeVisible();
  for (const row of ["Phrase-based baseline 33.30", "Cho et al. · phrase-based combination 34.54", "Comparison system · re-evaluated consistently 37.0", "Baseline 1,000-best + 1 forward LSTM 35.61", "Baseline 1,000-best + 1 reversed LSTM 35.85", "Baseline 1,000-best + 5 reversed LSTMs 36.5", "Baseline 1,000-best oracle · reference-informed ≈45"]) await expect(rescoring.getByRole("row", { name: row, exact: true })).toBeVisible();
  await expect(page.getByText(/^Only source word order reverses\./)).toContainText("25.9 to 30.6");
  await expect(page.getByText(/384 million parameters and an 8,000-dimensional-state/)).toBeVisible();
  await expect(page.getByText(/Canonical PDF: 380 million/)).toBeVisible();
  await expect(page.getByText(/specifies no length normalization/)).toBeVisible();
  await expect(page.getByText(/full gate implementation/)).toBeVisible();
  await expect(page.getByRole("region", { name: "Graves v5 LSTM equations 7 through 11" }).locator("math")).toHaveCount(4);
  await expect(page.getByRole("list", { name: "Graves cell update order" })).toContainText("updated cell");
});

test("all new routes pass expanded-evidence accessibility checks", async ({ page }) => {
  test.setTimeout(60_000);
  for (const path of routes) {
    await page.goto(path);
    await page.locator("details").evaluateAll((items) => items.forEach((item) => item.setAttribute("open", "")));
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  }
});

test("new routes and numerical cells reflow at four widths", async ({ page }) => {
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

test("keyboard reaches checkpoints, sources and every overflowing equation", async ({ page }) => {
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

test("graphics-hidden reduced-motion and forced-color views preserve both pipelines", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  await page.goto(beginner);
  await page.addStyleTag({ content: "svg, canvas, [aria-hidden='true'] { display: none !important; } * { background-image: none !important; }" });
  await expect(page.getByRole("table", { name: /Same declared pairs/ })).toContainText("D → Z");
  await expect(page.getByRole("list", { name: "Direct neural generation path" })).toContainText("EOS");
  await expect(page.getByRole("list", { name: "Phrase-based list rescoring path" })).toContainText("1,000");
  await expect(page.getByRole("table", { name: /Canonical Table 2/ })).toContainText("≈45");
});

test("print reveals closed arithmetic and evidence", async ({ page }) => {
  await page.goto(expert);
  const arithmetic = page.locator(".trace-arithmetic");
  await expect(arithmetic).not.toHaveAttribute("open");
  await page.emulateMedia({ media: "print" });
  expect(await arithmetic.locator("p").first().evaluate((node) => node.getBoundingClientRect().height)).toBeGreaterThan(0);
  expect(await page.locator(".evidence-details .source-row").first().evaluate((node) => node.getBoundingClientRect().height)).toBeGreaterThan(0);
  await expect(arithmetic).not.toHaveAttribute("open");
});
