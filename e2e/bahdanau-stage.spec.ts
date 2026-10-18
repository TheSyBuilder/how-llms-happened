import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const base = "/journeys/encoder-decoder-alignment/";
const beginner = `${base}beginner/bahdanau-2014-2015/`;
const expert = `${base}expert/bahdanau-2014-2015/`;
const workId = "bahdanau-cho-bengio-2014-neural-machine-translation";
const record = `/reference/works/${workId}/`;
const gravesRecord = "/reference/works/graves-2013-generating-sequences-recurrent-neural-networks/";
const routes = [beginner, expert, record, gravesRecord];
const fixture = JSON.parse(readFileSync(new URL("../data/fixtures/encoder-decoder-alignment.json", import.meta.url), "utf8"));
const cases = fixture.scenarios.filter((s: { kind: string }) => s.kind === "bahdanau-read");

test("chapter, atlas, mode and source-comparison returns retain their owning destination", async ({ page }) => {
  await page.goto(`${base}beginner/sutskever-2014/`);
  await page.getByRole("link", { name: "Continue to Bahdanau in beginner mode" }).click();
  await expect(page).toHaveURL(new RegExp(`${beginner}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("How can the decoder revisit the source?");
  await page.getByRole("link", { name: "Switch to expert" }).click();
  await expect(page).toHaveURL(new RegExp(`${expert}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Reconstruct the read. Audit the evidence.");
  await page.getByRole("link", { name: "Inspect the complete nineteen-claim Bahdanau record" }).click();
  await expect(page.locator(".claim-record")).toHaveCount(19);
  await page.getByRole("link", { name: "Audit the mechanism" }).click();
  await expect(page).toHaveURL(new RegExp(`${expert}$`));
  await page.getByRole("link", { name: "Inspect Graves’s complete source record" }).click();
  await page.getByRole("link", { name: "Expert reconstruction: A monotonic handwriting window is a comparison" }).click();
  await expect(page).toHaveURL(new RegExp(`${expert}#graves-window-comparison$`));
  await page.getByRole("link", { name: "Locate this work in the expert atlas" }).click();
  await page.locator(`#work-${workId}`).getByRole("link", { name: /Chapter available/ }).click();
  await expect(page).toHaveURL(new RegExp(`${expert}$`));
});

test("both modes retain all independent expected read values and safeguards without JavaScript", async ({ browser, page: configured }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: configured.viewportSize()! });
  const page = await context.newPage();
  for (const path of [beginner, expert]) {
    await page.goto(path);
    const decimals = path === expert ? 6 : 3;
    const f = (v: number) => (Math.abs(v) < 0.5 * 10 ** -decimals ? 0 : v).toFixed(decimals);
    for (const scenario of cases) {
      const section = page.locator(`[data-read-case="${scenario.case}"]`);
      const label = scenario.case === "changing-query" ? "Changing prior state" : scenario.case === "equal-energies" ? "Equal energies" : "Identical annotations";
      for (const [i, read] of scenario.expected.entries()) {
        const shares = section.getByRole("table", { name: `${label} · read ${i + 1} · source energies and weights`, exact: true });
        const contributions = section.getByRole("table", { name: `${label} · read ${i + 1} · signed weighted contributions`, exact: true });
        for (const [j, a] of scenario.annotations.entries()) {
          await expect(shares.getByRole("row", { name: `${a.token} ${f(read.energies[j])} ${f(read.weights[j])}`, exact: true })).toBeVisible();
          await expect(contributions.getByRole("row", { name: `${a.token} ${read.contributions[j].map(f).join(" ")}`, exact: true })).toBeVisible();
        }
        await expect(contributions.getByRole("row", { name: `Sum → context ${read.context.map(f).join(" ")}`, exact: true })).toBeVisible();
        await section.getByText(`Inspect ${label.toLowerCase()} read ${i + 1} calculation`, { exact: true }).click();
        const scorer = section.getByRole("table", { name: `${label} · read ${i + 1} · complete scorer terms`, exact: true });
        for (const [j, a] of scenario.annotations.entries()) {
          for (const [label, values] of [["Uₐh", read.annotationProjections[j]], ["+ Wₐs", read.preactivations[j]], ["tanh", read.activations[j]]] as [string, number[]][]) {
            await expect(scorer.getByRole("row", { name: `${a.token} · ${label} ${values.map(f).join(" ")}`, exact: true })).toBeVisible();
          }
        }
        const denominator = section.getByRole("table", { name: `${label} · read ${i + 1} · stable source softmax`, exact: true });
        await expect(denominator.getByRole("row", { name: `Sum → denominator ${f(read.normalizer)}`, exact: true })).toBeVisible();
      }
      await section.getByText(`Check ${label.toLowerCase()} prediction`, { exact: true }).click();
      await expect(section.locator(".prediction-reveal p").first()).toBeVisible();
    }
    await page.getByText("Check the two denominators", { exact: true }).click();
    await expect(page.getByText(/It cannot give P\(next word = X\)/)).toBeVisible();
    await expect(page.locator("script, input, select, button, astro-island, canvas")).toHaveCount(0);
  }
  await context.close();
});

test("all nineteen claims, both BLEU conditions and source timing boundaries stay inspectable", async ({ page }) => {
  for (const path of [beginner, expert]) {
    await page.goto(path);
    await page.locator("details").evaluateAll((items) => items.forEach((item) => item.setAttribute("open", "")));
    const ids = await page.locator(".claim-id").allTextContents();
    expect(new Set(ids.filter((id) => id.startsWith("bahdanau-2014-"))).size).toBe(19);
    const table = page.getByRole("table", { name: "Canonical Table 1 · complete All and No UNK BLEU" });
    for (const row of ["RNNencdec-30 13.93 24.19", "RNNsearch-30 21.50 31.44", "RNNencdec-50 17.82 26.71", "RNNsearch-50 26.75 34.16", "RNNsearch-50* · longer trained 28.45 36.15", "Moses 33.30 35.63"]) await expect(table.getByRole("row", { name: row, exact: true })).toBeVisible();
    const training = page.getByRole("table", { name: "Canonical Table 2 · all reported training durations" });
    await expect(training.locator("tbody tr")).toHaveCount(5);
    await expect(training.getByRole("row", { name: "RNNsearch-50* 252", exact: true })).toBeVisible();
    await expect(page.getByText(/The second state is not computed from the first read/)).toBeVisible();
    await expect(page.getByText(/Each Gaussian center must move forward/)).toBeVisible();
    await expect(page.getByText(/subset size is not reported/).first()).toBeVisible();
  }
  await expect(page.getByRole("region", { name: "Bahdanau v5 source-read and conditional-output abstraction" }).locator("math")).toHaveCount(3);
  await expect(page.getByRole("region", { name: "Graves v5 soft-window equations 46 through 51" }).locator("math")).toHaveCount(2);
});

test("new chapter and both reference records pass expanded accessibility checks", async ({ page }) => {
  test.setTimeout(60_000);
  for (const path of routes) {
    await page.goto(path);
    await page.locator("details").evaluateAll((items) => items.forEach((item) => item.setAttribute("open", "")));
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  }
});

test("every numeric cell and raw value remains readable at four widths", async ({ page }) => {
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
      for (const raw of await page.locator(".alignment-raw-data").all()) expect(await raw.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    }
  }
});

test("native keyboard reaches arithmetic, checkpoints, sources and scrollable equations", async ({ page }) => {
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

test("graphics-hidden reduced-motion and forced colors preserve the signed context and boundaries", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  await page.goto(beginner);
  await page.addStyleTag({ content: "svg, canvas, [aria-hidden='true'] { display: none !important; } * { background-image: none !important; }" });
  await expect(page.getByRole("table", { name: "Changing prior state · read 1 · signed weighted contributions", exact: true })).toContainText("-0.066");
  await expect(page.getByRole("table", { name: "Identical annotations · read 2 · signed weighted contributions", exact: true })).toContainText("-0.200");
  await expect(page.getByRole("list", { name: "Bahdanau main-text operation order" })).toContainText("separate distribution");
  await expect(page.getByRole("table", { name: /complete All and No UNK BLEU/ })).toContainText("36.15");
});

test("print exposes closed scorer arithmetic, raw values and evidence", async ({ page }) => {
  await page.goto(expert);
  const details = page.getByText("Inspect changing prior state read 1 calculation", { exact: true }).locator("..");
  await expect(details).not.toHaveAttribute("open");
  await page.emulateMedia({ media: "print" });
  expect(await details.locator("table").first().evaluate((node) => node.getBoundingClientRect().height)).toBeGreaterThan(0);
  expect(await page.locator(".alignment-raw-data").first().evaluate((node) => node.getBoundingClientRect().height)).toBeGreaterThan(0);
  expect(await page.locator(".evidence-details .source-row").first().evaluate((node) => node.getBoundingClientRect().height)).toBeGreaterThan(0);
  await expect(details).not.toHaveAttribute("open");
});
