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
const peepholeBeginner = `${base}beginner/gers-2002/`;
const peepholeExpert = `${base}expert/gers-2002/`;
const peepholeRecord = "/reference/works/gers-schraudolph-schmidhuber-2002-precise-timing/";
const wordBeginner = `${base}beginner/mikolov-2010/`;
const wordExpert = `${base}expert/mikolov-2010/`;
const wordRecord = "/reference/works/mikolov-2010-recurrent-neural-language-model/";
const bengioRecord = "/reference/works/bengio-2000-neural-probabilistic-language-model/";
const allRoutes = [base, `${base}beginner/`, `${base}expert/`, beginner, expert, record, originalBeginner, originalExpert, originalRecord, forgetBeginner, forgetExpert, forgetRecord, peepholeBeginner, peepholeExpert, peepholeRecord, wordBeginner, wordExpert, wordRecord, bengioRecord];

test("the recurrent chooser exposes five chapters while the final chapter stays queued", async ({ page }) => {
  await page.goto(base);
  await page.getByRole("link", { name: "Preview the beginner path" }).click();
  await expect(page.getByRole("list", { name: /From carried state/ }).getByText("Chapter queued")).toHaveCount(1);
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

test("peephole progression and mode switching preserve state inspection", async ({ page }) => {
  await page.goto(forgetBeginner);
  await page.getByRole("link", { name: /Continue to state inspection/ }).click();
  await expect(page).toHaveURL(new RegExp(`${peepholeBeginner}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("How can a gate see a hidden timer?");
  await page.getByRole("link", { name: /Switch to expert/ }).click();
  await expect(page).toHaveURL(new RegExp(`${peepholeExpert}$`));
  await expect(page.getByRole("heading", { name: "A forward read does not imply full backward flow." })).toBeVisible();
  await expect(page.locator("input, select, button, astro-island")).toHaveCount(0);
});

test("both peephole alternatives preserve exact read order without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const path of [peepholeBeginner, peepholeExpert]) {
    await page.goto(path);
    const precise = path === peepholeExpert;
    const enabled = page.getByRole("table", { name: /With state inspection · ordered forward update/ });
    const disabled = page.getByRole("table", { name: /Without state inspection · ordered forward update/ });
    for (const row of ["1. Input gate reads", "2. Forget gate reads"]) {
      await expect(enabled.getByRole("row", { name: new RegExp(row) })).toContainText(precise ? "0.600000" : "0.600");
      await expect(disabled.getByRole("row", { name: new RegExp(row) })).toContainText("No direct read");
    }
    await expect(enabled.getByRole("row", { name: /Updated state/ })).toContainText(precise ? "0.547298" : "0.547");
    await expect(enabled.getByRole("row", { name: /4. Output gate reads/ })).toContainText(precise ? "0.547298" : "0.547");
    await expect(enabled.getByRole("row", { name: /Output gate activation/ })).toContainText(precise ? "0.527590" : "0.528");
    await expect(enabled.getByRole("row", { name: /Fixture output|Exposed output/ })).toContainText(precise ? "0.263000" : "0.263");
    await expect(disabled.getByRole("row", { name: /Updated state/ })).toContainText(precise ? "0.539279" : "0.539");
    await expect(disabled.getByRole("row", { name: /Fixture output|Exposed output/ })).toContainText(precise ? "0.209562" : "0.210");
    await page.getByText("Check the previous-versus-updated read", { exact: true }).click();
    await expect(page.getByText(/Using 0.6 for all three reads would change the output decision/)).toBeVisible();
    if (precise) {
      await page.getByText("Audit enabled state terms", { exact: true }).click();
      const arithmetic = page.getByRole("table", { name: /With state inspection · gate preactivation arithmetic/ });
      for (const [term, value] of [["Input preactivation", "0.100000"], ["Forget preactivation", "0.250000"], ["Output state term", "0.410473"], ["Output preactivation", "0.110473"]]) {
        await expect(arithmetic.getByRole("row", { name: `${term} ${value}`, exact: true })).toBeVisible();
      }
    }
  }
  await context.close();
});

test("native peephole checkpoints and source equations work from the keyboard", async ({ page }) => {
  await page.goto(peepholeExpert);
  const checkpoint = page.getByText("Check inspection versus retention", { exact: true });
  await checkpoint.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/The new write also changes because its input gate changes/)).toBeVisible();
  const jump = page.getByRole("link", { name: "With state inspection", exact: true });
  await jump.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#with-peepholes$/);
  await page.setViewportSize({ width: 320, height: 640 });
  const equations = page.getByRole("region", { name: "JMLR peephole input and forget partials" });
  await equations.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => equations.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  const evidence = page.locator(".evidence-details > summary").first();
  await evidence.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".evidence-details[open] .source-row a").first()).toBeVisible();
});

test("peephole source and teaching boundaries stay beside the comparison", async ({ page }) => {
  await page.goto(peepholeExpert);
  await expect(page.getByRole("region", { name: "JMLR peephole forward equations" }).locator("math")).toHaveCount(3);
  await expect(page.getByRole("region", { name: "JMLR peephole input and forget partials" }).locator("math")).toHaveCount(2);
  await expect(page.getByRole("region", { name: "JMLR peephole weight updates" }).locator("math")).toHaveCount(2);
  await expect(page.getByText(/The 2002 paper removes that squashing/)).toBeVisible();
  await expect(page.getByText(/Gate errors update incoming weights but do not propagate backward/)).toBeVisible();
  await expect(page.getByText(/neither of its computed output gates is fully closed/)).toBeVisible();
  await expect(page.getByText(/“No direct read” means no peephole/)).toBeVisible();
  await expect(page.getByText(/Publication controls timeline order/)).toBeVisible();
});

test("all promoted timing rates and the ablation retain their ten-run scope", async ({ page }) => {
  await page.goto(peepholeExpert);
  const nmsd = page.getByRole("table", { name: /JMLR Table 1 · NMSD/ });
  for (const [f, values] of [[10, "100% 100%"], [20, "100% 100%"], [30, "100% 80%"], [40, "20% 70%"], [50, "0% 10%"]]) {
    await expect(nmsd.getByRole("row", { name: `F=${f} · {0,1} ${values}`, exact: true })).toBeVisible();
  }
  const msd = page.getByRole("table", { name: /JMLR Table 1 · continual MSD/ });
  await expect(msd.getByRole("row", { name: "F=10 · {0,1} 10% 20%", exact: true })).toBeVisible();
  await expect(msd.getByRole("row", { name: "F=10 · {0,1,2} 20% 60%", exact: true })).toBeVisible();
  const gts = page.getByRole("table", { name: /JMLR Figure 7 · GTS/ });
  for (const [condition, value] of [["F=10 · {0}", "100%"], ["F=20 · {0}", "100%"], ["F=30 · {0}", "80%"], ["F=40 · {0}", "100%"], ["F=50 · {0}", "100%"], ["F=10 · {0,1}", "50%"], ["F=10 · {0,1,2}", "30%"]]) {
    await expect(gts.getByRole("row", { name: `${condition} ${value}`, exact: true })).toBeVisible();
  }
  const pfg = page.getByRole("table", { name: /JMLR Table 3 · PFG/ });
  for (const [condition, values] of [["Cosine · F=10", "90% 100%"], ["Cosine · F=25", "0% 60%"], ["Triangle · F=10", "0% 100%"], ["Triangle · F=25", "0% 50%"], ["Rectangle · F=10", "0% 80%"], ["Rectangle · F=25", "0% 20%"]]) {
    await expect(pfg.getByRole("row", { name: `${condition} ${values}`, exact: true })).toBeVisible();
  }
  await expect(page.getByText(/^The authors find no clear statistical advantage overall/)).toBeVisible();
  await expect(page.getByText(/fixing the forget gate open while preserving learned weights/)).toBeVisible();
  await page.getByRole("link", { name: /Inspect the complete nine-claim/ }).click();
  await expect(page).toHaveURL(new RegExp(`${peepholeRecord}$`));
  await expect(page.locator(".claim-record")).toHaveCount(9);
  await page.getByRole("link", { name: "Audit the mechanism" }).click();
  await expect(page).toHaveURL(new RegExp(`${peepholeExpert}$`));
});

test("graphics-hidden and reduced-motion views preserve state-inspection causes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(peepholeBeginner);
  await page.addStyleTag({ content: "svg, canvas, [aria-hidden='true'] { display: none !important; } * { background-image: none !important; }" });
  await expect(page.getByRole("table", { name: /With state inspection · ordered forward update/ }).getByRole("row", { name: /4. Output gate reads/ })).toContainText("0.547");
  await page.getByText("Check inspection versus retention", { exact: true }).click();
  await expect(page.getByText(/The positive input-state term increases the input gate/)).toBeVisible();
  await expect(page.getByText(/The 2002 paper removes that squashing/)).toBeVisible();
});

test("word-model progression, mode switching, and prerequisite records preserve their targets", async ({ page }) => {
  await page.goto(peepholeBeginner);
  await page.getByRole("link", { name: /Continue to recurrent word prediction/ }).click();
  await expect(page).toHaveURL(new RegExp(`${wordBeginner}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("How does carried state become a word prediction?");
  await page.getByRole("link", { name: /Switch to expert/ }).click();
  await expect(page).toHaveURL(new RegExp(`${wordExpert}$`));
  await page.getByRole("link", { name: /Inspect Bengio’s versioned work record/ }).click();
  await expect(page).toHaveURL(new RegExp(`${bengioRecord}$`));
  await expect(page.locator(".claim-record")).toHaveCount(24);
  await page.getByRole("link", { name: "Audit the prerequisite" }).click();
  await expect(page).toHaveURL(new RegExp(`${wordExpert}#bengio-fixed-window-prerequisite$`));
  await expect(page.getByRole("heading", { name: "What the recurrent word model changes" })).toBeVisible();
  await page.getByRole("link", { name: /Inspect the complete thirteen-claim/ }).click();
  await expect(page).toHaveURL(new RegExp(`${wordRecord}$`));
  await expect(page.locator(".claim-record")).toHaveCount(13);
  await page.getByRole("link", { name: "Audit the mechanism" }).click();
  await expect(page).toHaveURL(new RegExp(`${wordExpert}$`));
});

test("normalized prediction and local-credit answers remain complete without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const path of [wordBeginner, wordExpert]) {
    const precise = path === wordExpert;
    await page.goto(path);
    const table = page.getByRole("table", { name: /Synthetic next-word normalization/ });
    for (const [word, mass, p] of [["alpha", "2", "0.5"], ["beta", "1", "0.25"], ["gamma", "1", "0.25"], ["Total", "4", "1"]]) {
      await expect(table.getByRole("row", { name: `${word} ${mass} ${Number(p).toFixed(precise ? 6 : 3)}`, exact: true })).toBeVisible();
    }
    await page.getByText("Check the normalized prediction", { exact: true }).click();
    await expect(page.getByText(/Alpha receives half the probability, but beta can still be observed/)).toBeVisible();
    await page.getByText("Check forward state versus backward credit", { exact: true }).click();
    await expect(page.getByText(/The recurrent weights still learn from the saved activation/)).toBeVisible();
    await expect(page.getByRole("list", { name: "Bengio fixed-window prediction path" }).getByRole("listitem")).toHaveCount(4);
    await expect(page.getByText(/This model has no LSTM cell, gates, or peepholes/)).toBeVisible();
    await expect(page.locator("script, input, select, button, astro-island")).toHaveCount(0);
    if (precise) {
      await page.getByText("Audit the current-target error", { exact: true }).click();
      const error = page.getByRole("table", { name: /Synthetic beta target/ });
      for (const [word, desired, value] of [["alpha", 0, "-0.500000"], ["beta", 1, "0.750000"], ["gamma", 0, "-0.250000"]]) {
        await expect(error.getByRole("row", { name: `${word} ${desired} ${value}`, exact: true })).toBeVisible();
      }
      await expect(page.getByText(/1.386294 nats/)).toBeVisible();
    }
  }
  await context.close();
});

test("word-model source notation and keyboard inspection preserve probability and credit boundaries", async ({ page }) => {
  await page.goto(wordExpert);
  await expect(page.getByText(/Here y denotes scores/)).toBeVisible();
  await expect(page.getByText(/joined, not added elementwise/)).toBeVisible();
  await expect(page.getByText(/C rare counts merged word types, not their occurrences/)).toBeVisible();
  await expect(page.getByText(/normally at learning rate 0.1/)).toBeVisible();
  for (const label of ["Check the normalized prediction", "Check forward state versus backward credit", "Audit the current-target error"]) {
    const summary = page.getByText(label, { exact: true });
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(summary.locator("..")).toHaveAttribute("open", "");
  }
  await page.setViewportSize({ width: 320, height: 640 });
  for (const label of ["Bengio lookup and score equations", "Bengio normalized next-word probability", "Mikolov printed input equation", "Mikolov hidden and output equations", "Mikolov current-target error equation", "Mikolov rare-word probability equation"]) {
    const region = page.getByRole("region", { name: label });
    await expect(region.locator("math")).not.toHaveCount(0);
    await region.focus();
    await expect(region).toBeFocused();
    if (await region.evaluate((element) => element.scrollWidth > element.clientWidth)) {
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    }
  }
  const evidence = page.locator(".word-prerequisite .evidence-details > summary").first();
  await evidence.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".word-prerequisite .evidence-details[open] .source-row a").first()).toBeVisible();
});

test("WSJ scaling and ensemble tables retain all source values and system components", async ({ page }) => {
  await page.goto(wordExpert);
  const scalingPpl = page.getByRole("table", { name: /Table 1 · held-out perplexity/ });
  const scalingWer = page.getByRole("table", { name: /Table 1 · development WER/ });
  for (const [label, ppl, wer] of [["200,000 · 90/2", "336 271", "16.4% 15.4%"], ["1 million · 90/2", "287 225", "15.1% 14.0%"], ["6.4 million · 250/5", "221 156", "13.5% 11.7%"]]) {
    await expect(scalingPpl.getByRole("row", { name: `${label} ${ppl}`, exact: true })).toBeVisible();
    await expect(scalingWer.getByRole("row", { name: `${label} ${wer}`, exact: true })).toBeVisible();
  }
  const ppl = page.getByRole("table", { name: /Table 2 · held-out perplexity/ });
  const wer = page.getByRole("table", { name: /Table 2 · development WER/ });
  for (const [label, p, w] of [["KN5 baseline", "— 221", "— 13.5%"], ["RNN 60/20", "229 186", "13.2% 12.6%"], ["RNN 90/10", "202 173", "12.8% 12.2%"], ["RNN 250/5", "173 155", "12.3% 11.7%"], ["RNN 250/2", "176 156", "12.0% 11.9%"], ["RNN 400/10", "171 152", "12.5% 12.1%"], ["Three RNNs · static", "151 143", "11.6% 11.3%"], ["Three RNNs · dynamic", "128 121", "11.3% 11.1%"]]) {
    await expect(ppl.getByRole("row", { name: `${label} ${p}`, exact: true })).toBeVisible();
    await expect(wer.getByRole("row", { name: `${label} ${w}`, exact: true })).toBeVisible();
  }
  await expect(page.getByText(/0.75 RNN probability \+ 0.25 KN5 probability/)).toBeVisible();
  await expect(page.getByText(/exact component weights\/run composition are not fully specified/)).toBeVisible();
});

test("cross-data and RT05 tables preserve footnote four and mixed-data results", async ({ page }) => {
  await page.goto(wordExpert);
  const cross = page.getByRole("table", { name: /Table 3 · WSJ/ });
  for (const [label, values] of [["Lattice 1-best", "12.9% 18.4%"], ["KN5 · 37M", "12.2% 17.2%"], ["Discriminative LM [8] · 37M", "11.5% 16.9%"], ["Joint LM [9] · 70M", "— 16.7%"], ["Three static RNNs + KN5 · 37M", "11.0% 15.5%"], ["Three dynamic RNNs + KN5 · 37M", "10.7% 16.3% · note 4"]]) {
    await expect(cross.getByRole("row", { name: `${label} ${values}`, exact: true })).toBeVisible();
  }
  await expect(page.getByText(/proposed explanation, not a controlled order ablation/)).toBeVisible();
  const rt = page.getByRole("table", { name: /Table 4 · RT05/ });
  for (const [label, values] of [["RT05 LM", "24.5% —"], ["RT09 LM baseline", "24.1% —"], ["KN5 · in-domain", "25.7% —"], ["RNN 500/10 · in-domain", "24.2% 24.1%"], ["RNN 500/10 + RT09", "23.3% 23.2%"], ["RNN 800/10 · in-domain", "24.3% 23.8%"], ["RNN 800/10 + RT09", "23.4% 23.1%"], ["RNN 1000/5 · in-domain", "24.2% 23.7%"], ["RNN 1000/5 + RT09", "23.4% 22.9%"], ["Three RNNs + RT09", "23.3% 22.8%"]]) {
    await expect(rt.getByRole("row", { name: `${label} ${values}`, exact: true })).toBeVisible();
  }
  await expect(page.locator("#word-model-rt05").locator("..").getByText(/more than 1.3 billion words/).first()).toBeVisible();
  await expect(page.getByText(/not asserted as a fully specified RT05 interpolation recipe/)).toBeVisible();
  await expect(page.getByText(/main training uses temporal depth one/)).toBeVisible();
});

test("graphics-hidden and reduced-motion word prediction retains both learning distinctions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(wordBeginner);
  await page.addStyleTag({ content: "svg, canvas, [aria-hidden='true'] { display: none !important; } * { background-image: none !important; }" });
  await expect(page.getByRole("table", { name: /Synthetic next-word normalization/ }).getByRole("row", { name: "Total 4 1.000", exact: true })).toBeVisible();
  await expect(page.getByRole("list", { name: "Forward recurrence and current-step credit" }).getByText(/earlier computation stops/)).toBeVisible();
  await page.getByText("Check forward state versus backward credit", { exact: true }).click();
  await expect(page.getByText(/cutting the earlier computation limits backward credit/)).toBeVisible();
  await expect(page.getByText(/A fixed word row does not make the whole feed-forward prediction context independent/)).toBeVisible();
});
