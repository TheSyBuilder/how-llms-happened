import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const base = "/journeys/recurrent-memory/";
const beginner = `${base}beginner/elman-1988-1990/`;
const expert = `${base}expert/elman-1988-1990/`;
const record = "/reference/works/elman-1988-finding-structure-in-time/";
const originalBeginner = `${base}beginner/hochreiter-schmidhuber-1995-1997/`;
const originalExpert = `${base}expert/hochreiter-schmidhuber-1995-1997/`;
const originalRecord = "/reference/works/hochreiter-schmidhuber-1995-long-short-term-memory/";
const forgetBeginner = `${base}beginner/gers-1999-2000/`;
const forgetExpert = `${base}expert/gers-1999-2000/`;
const forgetRecord = "/reference/works/gers-schmidhuber-cummins-1999-learning-to-forget/";
const allRoutes = [base, `${base}beginner/`, `${base}expert/`, beginner, expert, record, originalBeginner, originalExpert, originalRecord, forgetBeginner, forgetExpert, forgetRecord];

test("the recurrent chooser exposes three chapters while later chapters stay queued", async ({ page }) => {
  await page.goto(base);
  await page.getByRole("link", { name: "Preview the beginner path" }).click();
  await expect(page.getByRole("list", { name: /From carried state/ }).getByText("Chapter queued")).toHaveCount(3);
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
  for (const path of allRoutes) {
    await page.goto(path);
    await page.locator("details").evaluateAll((items) => items.forEach((item) => item.setAttribute("open", "")));
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  }
});

test("all recurrent content reflows at 320 and 640 CSS pixels", async ({ page }) => {
  for (const width of [320, 640]) {
    await page.setViewportSize({ width, height: 800 });
    for (const path of allRoutes) {
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

test("chapter progression and mode switching preserve the original-cell stage", async ({ page }) => {
  await page.goto(beginner);
  await page.getByRole("link", { name: /Continue to the original LSTM cell/ }).click();
  await expect(page).toHaveURL(new RegExp(`${originalBeginner}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Can a hidden state still carry a teaching signal?");
  await page.getByRole("link", { name: /Switch to expert/ }).click();
  await expect(page).toHaveURL(new RegExp(`${originalExpert}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Which credit path stays constant?");
  await page.getByRole("link", { name: "Revisit Elman’s carried state" }).click();
  await expect(page).toHaveURL(new RegExp(`${expert}$`));
});

test("the original-cell state and credit traces are complete without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const path of [originalBeginner, originalExpert]) {
    const precise = path === originalExpert;
    await page.goto(path);
    const late = page.getByRole("table", { name: /Forward state · steps 3–4/ });
    await expect(late.getByRole("row", { name: /Resulting state/ })).toContainText(precise ? "0.700000" : "0.700");
    await expect(late.getByRole("row", { name: /Exposed output/ })).toContainText(precise ? "0.604368" : "0.604");
    await page.getByText("Check the hidden-state prediction", { exact: true }).click();
    await expect(page.getByText(/Closing the output gate hides the state; it does not erase it/)).toBeVisible();
    const credit = page.getByRole("table", { name: /Backward credit comparison/ });
    await expect(credit.getByRole("row").last()).toContainText(precise ? "0.129600" : "0.130");
    await expect(credit.getByRole("row").last()).toContainText(precise ? "1.000000" : "1.000");
    await page.getByText("Check the state-versus-credit distinction", { exact: true }).click();
    await expect(page.getByText(/does not make the full network gradient equal to 1/)).toBeVisible();
    await expect(page.locator("script, input, select, button, astro-island")).toHaveCount(0);
  }
  await context.close();
});

test("source functions and idealized fixture choices stay explicit", async ({ page }) => {
  await page.goto(originalExpert);
  await expect(page.getByText(/Gates 0 and 1 are idealized/)).toBeVisible();
  await page.getByText("Audit the source-to-teaching crosswalk", { exact: true }).click();
  await expect(page.getByText(/source h is tanh\(x\/2\)/)).toContainText("0.336376");
  await expect(page.getByText(/source h is tanh\(x\/2\)/)).toContainText("0.604368");
  await expect(page.getByText(/starts at s₀ = 0.4 rather than the source’s zero/)).toBeVisible();
  await expect(page.getByRole("region", { name: "Source experiment functions" }).locator("math")).toHaveCount(2);
});

test("the expert chapter marks scaling and truncation without cutting forward connections", async ({ page }) => {
  await page.goto(originalExpert);
  await expect(page.getByText("Entry · scaled", { exact: true })).toBeVisible();
  await expect(page.getByText("Cell loop · preserved", { exact: true })).toBeVisible();
  await expect(page.getByText("Exit · scaled, then cut", { exact: true })).toBeVisible();
  await expect(page.getByText("Gate inputs · cut", { exact: true })).toBeVisible();
  await expect(page.getByText(/Forward connections still exist and their weights remain trainable/)).toBeVisible();
  await expect(page.getByText(/factors are not derivatives measured from this forward trace/)).toBeVisible();
  await expect(page.getByRole("region", { name: "Source truncation rule" }).locator("math")).toHaveCount(1);
});

test("Table 3 and the work record retain all promoted result boundaries", async ({ page }) => {
  await page.goto(originalExpert);
  const table = page.getByRole("table", { name: /Table 3’s five/ });
  await expect(table.getByRole("row")).toHaveCount(6);
  for (const [p, mean] of [["1,000", "49,000"], ["500", "49,000"], ["200", "75,000"], ["100", "135,000"], ["50", "203,000"]]) {
    await expect(table.getByRole("row", { name: `${p} ${mean}`, exact: true })).toBeVisible();
  }
  await expect(page.getByText(/minimum lag is q \+ 1 = 1,001 steps/)).toBeVisible();
  await expect(page.getByText(/not a printed 20\/20 success numerator/)).toBeVisible();
  await page.getByRole("link", { name: /Inspect the complete six-claim/ }).click();
  await expect(page).toHaveURL(new RegExp(`${originalRecord}$`));
  await expect(page.locator(".claim-record")).toHaveCount(6);
  await page.getByRole("link", { name: "Audit the mechanism" }).click();
  await expect(page).toHaveURL(new RegExp(`${originalExpert}$`));
});

test("original-cell checkpoints and arithmetic support native keyboard inspection", async ({ page }) => {
  await page.goto(originalExpert);
  for (const label of ["Check the hidden-state prediction", "Check the state-versus-credit distinction", "Reconstruct the four-step product"]) {
    const summary = page.getByText(label, { exact: true });
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(summary.locator("..")).toHaveAttribute("open", "");
  }
  await expect(page.getByText(/Ordinary: 0.6 × 0.6/)).toBeVisible();
  for (const label of ["Original-cell source equations", "Source truncation rule"]) {
    const region = page.getByRole("region", { name: label });
    await region.focus();
    await expect(region).toBeFocused();
    if (await region.evaluate((element) => element.scrollWidth > element.clientWidth)) {
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    }
  }
});

test("graphics-hidden and reduced-motion views preserve both original-cell traces", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(originalBeginner);
  await page.addStyleTag({ content: "svg, canvas, [aria-hidden='true'] { display: none !important; } * { background-image: none !important; }" });
  await expect(page.getByRole("table", { name: /Forward state · steps 3–4/ })).toContainText("0.604");
  await expect(page.getByRole("table", { name: /Backward credit comparison/ })).toContainText("0.130");
  await expect(page.getByText(/No learned forget gate or peephole in this stage/)).toBeVisible();
});

test("progression and mode switching preserve the forget-gate stage", async ({ page }) => {
  await page.goto(originalBeginner);
  await page.getByRole("link", { name: /Continue to adaptive retention/ }).click();
  await expect(page).toHaveURL(new RegExp(`${forgetBeginner}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What survives when a cell learns to reset?");
  await page.getByRole("link", { name: /Switch to expert/ }).click();
  await expect(page).toHaveURL(new RegExp(`${forgetExpert}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Which term does a forget gate change?");
  await page.getByRole("link", { name: "Revisit the original LSTM cell" }).click();
  await expect(page).toHaveURL(new RegExp(`${originalExpert}$`));
});

test("all retention alternatives and answers remain complete without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const path of [forgetBeginner, forgetExpert]) {
    const precise = path === forgetExpert;
    await page.goto(path);
    for (const [label, retained, state] of [["Near retain", "0.72", "0.92"], ["Gradual decay", "0.4", "0.6"], ["Near reset", "0.08", "0.28"]]) {
      const table = page.getByRole("table", { name: new RegExp(`${label} · one forward update`) });
      const format = (value: string) => Number(value).toFixed(precise ? 6 : 3);
      await expect(table.getByRole("row", { name: /Retained old state/ })).toContainText(format(retained));
      await expect(table.getByRole("row", { name: /Same new write/ })).toContainText(format("0.2"));
      await expect(table.getByRole("row", { name: /Resulting state/ })).toContainText(format(state));
    }
    await page.getByText("Check the retention prediction", { exact: true }).click();
    await expect(page.getByText(/Near reset therefore produces/)).toContainText(precise ? "0.280000, not zero" : "0.280, not zero");
    await page.getByText("Check the activation-versus-parameters distinction", { exact: true }).click();
    await expect(page.locator(".prediction-reveal").getByText(/does not erase learned weights/)).toBeVisible();
    await expect(page.getByText(/They are not three successive steps/)).toBeVisible();
    await expect(page.locator("script, input, select, button, astro-island")).toHaveCount(0);
  }
  await context.close();
});

test("retention inspection and source equations work from the keyboard", async ({ page }) => {
  await page.goto(forgetExpert);
  const preset = page.getByRole("navigation", { name: "Inspect a retention preset" }).getByRole("link", { name: "Near reset", exact: true });
  await preset.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`${forgetExpert}#retention-near-reset$`));
  for (const label of ["Check the retention prediction", "Check the activation-versus-parameters distinction", "Audit initialization and computational scope"]) {
    const summary = page.getByText(label, { exact: true });
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(summary.locator("..")).toHaveAttribute("open", "");
  }
  for (const label of ["Journal forget-gate forward equations", "Journal forget-weight eligibility recurrence", "Journal shared-gate weight update"]) {
    const region = page.getByRole("region", { name: label });
    await region.focus();
    await expect(region).toBeFocused();
    if (await region.evaluate((element) => element.scrollWidth > element.clientWidth)) {
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    }
  }
  const evidence = page.locator(".evidence-details > summary").first();
  await evidence.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".evidence-details[open] .source-row a").first()).toBeVisible();
});

test("the forget-gate audit preserves journal rules and version boundaries", async ({ page }) => {
  await page.goto(forgetExpert);
  await expect(page.getByRole("region", { name: "Journal forget-gate forward equations" }).locator("math")).toHaveCount(2);
  await expect(page.getByRole("region", { name: "Journal forget-weight eligibility recurrence" }).locator("math")).toHaveCount(1);
  await expect(page.getByText(/Near zero attenuates them; it does not guarantee exact reset/)).toBeVisible();
  await expect(page.getByText(/previous cell state/).first()).toBeVisible();
  await expect(page.getByText(/Each cell keeps its own sensitivity/)).toBeVisible();
  await expect(page.getByText(/Earlier accounts report 375 weights; the journal reports 424/)).toBeVisible();
  await expect(page.getByText(/24 February build/)).toBeVisible();
  await expect(page.getByText(/grammar still contains B\/E symbols/)).toBeVisible();
  await expect(page.getByText(/They do not map to published pp. 2451–2471/)).toBeVisible();
  await expect(page.getByText(/No cell-state-to-gate peephole in this stage/)).toBeVisible();
});

test("the continual result ledgers and nine-claim record preserve experimental scope", async ({ page }) => {
  await page.goto(forgetExpert);
  const cerg = page.getByRole("table", { name: /Journal Table 2 · perfect/ });
  for (const [label, values] of [["Standard · external reset", "74% 7,441"], ["Standard · no reset", "0% —"], ["Fixed state decay · 0.9", "0% —"], ["Learned forget gate", "18% 18,889"], ["Forget gate + learning-rate decay", "62% 14,087"]]) {
    await expect(cerg.getByRole("row", { name: `${label} ${values}`, exact: true })).toBeVisible();
  }
  const good = page.getByRole("table", { name: /Journal Table 2 · good/ });
  await expect(good.getByRole("row", { name: "Learned forget gate 29%", exact: true })).toBeVisible();
  await expect(good.getByRole("row", { name: "Forget gate + learning-rate decay 6%", exact: true })).toBeVisible();
  const cnto = page.getByRole("table", { name: /Journal Table 3 · perfect/ });
  for (const [label, values] of [["Standard · no reset", "0% —"], ["Learned forget gate", "24% 18,077"], ["Forget gate + learning-rate decay", "37% 22,654"]]) {
    await expect(cnto.getByRole("row", { name: `${label} ${values}`, exact: true })).toBeVisible();
  }
  const partial = page.getByRole("table", { name: /Journal Table 3 · mean error-free/ });
  for (const value of ["4.6", "12.2", "11.8"]) await expect(partial.getByRole("cell", { name: value, exact: true })).toBeVisible();
  await expect(page.locator("#forget-cnto").locator("..").getByText(/1,000 successive correct sequences in each of ten/).first()).toBeVisible();
  await page.getByRole("link", { name: /Inspect the complete nine-claim/ }).click();
  await expect(page).toHaveURL(new RegExp(`${forgetRecord}$`));
  await expect(page.locator(".claim-record")).toHaveCount(9);
  await page.getByRole("link", { name: "Audit the mechanism" }).click();
  await expect(page).toHaveURL(new RegExp(`${forgetExpert}$`));
});

test("graphics-hidden and reduced-motion views preserve all retention alternatives", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(forgetBeginner);
  await page.addStyleTag({ content: "svg, canvas, [aria-hidden='true'] { display: none !important; } * { background-image: none !important; }" });
  for (const [label, state] of [["Near retain", "0.920"], ["Gradual decay", "0.600"], ["Near reset", "0.280"]]) {
    await expect(page.getByRole("table", { name: new RegExp(`${label} · one forward update`) }).getByRole("row", { name: /Resulting state/ })).toContainText(state);
  }
  await page.getByText("Check the activation-versus-parameters distinction", { exact: true }).click();
  await expect(page.getByText(/The carried activation changes/)).toBeVisible();
});
