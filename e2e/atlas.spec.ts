import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const markov = "markov-1913-onegin";
const elman = "elman-1988-finding-structure-in-time";
const gravesRelation = "graves-2013-to-bahdanau-2014";
const paths = ["/atlas/", "/atlas/beginner/", "/atlas/expert/", "/atlas/evidence/"];

test("both complete catalogues and evidence registers work without JavaScript", async ({ browser, page }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: page.viewportSize()! });
  const staticPage = await context.newPage();
  for (const mode of ["beginner", "expert"]) {
    await staticPage.goto(`/atlas/${mode}/`);
    await expect(staticPage.locator("[data-work-id]")).toHaveCount(66);
    await expect(staticPage.locator(".atlas-claim")).toHaveCount(969);
    await expect(staticPage.locator("script, input, select, button, astro-island, canvas")).toHaveCount(0);
    const record = staticPage.locator(`#work-${markov} .atlas-record`);
    await record.locator(":scope > summary").click();
    await record.getByText("Ordering event, dates and versions", { exact: true }).click();
    await expect(record).toContainText("calendar: source-as-printed");
    await expect(record).toContainText("does not state the calendar convention");
    await staticPage.goto("/atlas/evidence/");
    await expect(staticPage.locator(".atlas-relation")).toHaveCount(109);
    await expect(staticPage.locator(".atlas-source")).toHaveCount(602);
    const relation = staticPage.locator(`#relation-${gravesRelation} > details`);
    await relation.locator(":scope > summary").click();
    await expect(relation).toContainText("Causal language prohibited");
    await expect(relation).toContainText("Direct Graves comparison in the first revision");
    await expect(relation.locator(".atlas-evidence-list li")).toHaveCount(2);
  }
  await context.close();
});

test("beginner prediction and expert audit use different tasks over the same works", async ({ page }) => {
  await page.goto("/atlas/beginner/");
  await expect(page.locator(".atlas-case-grid article")).toHaveCount(4);
  await expect(page.getByText(/Predict: do June and September/)).toBeVisible();
  const reveal = page.getByText("Reveal the bounded explanation", { exact: true }).first();
  await reveal.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/It provides an empirical prologue/)).toBeVisible();
  await page.locator(`#work-${elman}`).getByRole("link", { name: "This work in expert mode", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/atlas/expert/#work-${elman}$`));
  await expect(page.locator(`#work-${elman}`)).toContainText("1988-04");
  await expect(page.locator(".atlas-case-grid")).toHaveCount(0);
  await expect(page.locator(".atlas-audit-cases li")).toHaveCount(4);
  await expect(page.locator("[data-work-id]")).toHaveCount(66);
});

test("keyboard inspection reaches dates, incident connections, claims and sources", async ({ page }) => {
  await page.goto(`/atlas/expert/#work-${elman}`);
  const work = page.locator(`#work-${elman}`);
  const recordSummary = work.locator(".atlas-record > summary");
  await recordSummary.focus();
  await page.keyboard.press("Enter");
  const dates = work.getByText("Ordering event, dates and versions", { exact: true });
  await dates.focus();
  await page.keyboard.press("Enter");
  await expect(work).toContainText("1990-03");
  const incident = work.locator(".atlas-incident > summary");
  await incident.focus();
  await page.keyboard.press("Enter");
  const connection = work.locator('.atlas-incident a[href="/atlas/evidence/#relation-elman-1988-to-mikolov-2010"]');
  await connection.focus();
  await page.keyboard.press("Enter");
  const relation = page.locator("#relation-elman-1988-to-mikolov-2010");
  await relation.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(relation).toContainText("Qualified connection");
  const claimLink = relation.locator(".atlas-bound-claims a").first();
  const claimHref = await claimLink.getAttribute("href");
  await claimLink.focus();
  await page.keyboard.press("Enter");
  const claim = page.locator(new URL(claimHref!, "http://127.0.0.1:4321").hash);
  await expect(claim.locator(":scope > summary")).toBeVisible();
  await claim.locator(":scope > summary").focus();
  await page.keyboard.press("Enter");
  const sourceLink = claim.locator(".atlas-evidence-list a").first();
  const sourceHref = await sourceLink.getAttribute("href");
  await sourceLink.focus();
  await page.keyboard.press("Enter");
  const source = page.locator(new URL(sourceHref!, "http://127.0.0.1:4321").hash);
  await source.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(source.getByRole("link", { name: /^Open source:/ })).toBeVisible();
  await expect(source).toContainText("accessed");
});

test("availability links reach built chapters while corpus-only records remain inline", async ({ page }) => {
  await page.goto("/atlas/expert/");
  const roots = page.locator("#work-laurencon-2022-bigscience-roots-corpus");
  await expect(roots.getByRole("link", { name: /Chapter available|Reference available/ })).toHaveCount(0);
  await roots.locator(".atlas-record > summary").click();
  await expect(roots.locator(".atlas-claim")).toHaveCount(16);
  await expect(roots.locator(".atlas-record")).toContainText("Canonical identity");
  const prerequisite = page.locator("#work-bengio-2000-neural-probabilistic-language-model");
  await prerequisite.getByRole("link", { name: /Prerequisite available/ }).click();
  await expect(page).toHaveURL(/mikolov-2010\/#bengio-fixed-window-prerequisite$/);
  await page.goto(`/atlas/expert/#work-${elman}`);
  await page.locator(`#work-${elman}`).getByRole("link", { name: /Chapter available/ }).click();
  await expect(page).toHaveURL(/\/expert\/elman-1988-1990\/$/);
  await page.getByRole("link", { name: "Locate this work in the expert atlas" }).click();
  await expect(page).toHaveURL(new RegExp(`/atlas/expert/#work-${elman}$`));
});

test("chronology discloses gaps and unresolved year precision without false priority", async ({ page }) => {
  await page.goto("/atlas/expert/");
  await expect(page.locator(".atlas-gap").first()).toHaveText("1914–1947 · No selected works in this interval.");
  const roots = page.locator(".atlas-date-group--unresolved").filter({ has: page.locator("#work-laurencon-2022-bigscience-roots-corpus") });
  await expect(roots).toContainText("Month and day not established");
  await expect(roots).toContainText("position does not assert within-year order");
  const year2021 = page.locator(".atlas-year").filter({ has: page.locator("#year-2021") });
  await expect(year2021.locator("[data-work-id]").first()).toHaveAttribute("data-work-id", "fedus-2021-switch-transformers-scaling-trillion-parameter-models");
});

test("expanded evidence passes accessibility checks in both modes", async ({ page }) => {
  test.setTimeout(60_000);
  for (const mode of ["beginner", "expert"]) {
    await page.goto(`/atlas/${mode}/`);
    await page.locator(`#work-${markov} .atlas-record > summary`).click();
    await page.locator(`#work-${markov}`).getByText("Ordering event, dates and versions", { exact: true }).click();
    await page.locator(`#work-${markov} .atlas-claim > summary`).first().click();
    const catalogueResults = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(catalogueResults.violations).toEqual([]);
  }
  await page.goto("/atlas/evidence/");
  for (const id of ["markov-1913-to-shannon-1948", "elman-1988-to-mikolov-2010", gravesRelation, "cho-2014-to-sutskever-2014"]) await page.locator(`#relation-${id} > details > summary`).click();
  await page.locator("#source-markov-1913-mathnet summary").click();
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations).toEqual([]);
});

test("the catalogue and expanded high-degree evidence reflow at four target widths", async ({ page }) => {
  const checkReflow = async (width: number) => {
    const overflowing = await page.evaluate(() => [...document.querySelectorAll("main *, .site-header")].filter((node) => {
      const element = node as HTMLElement;
      return element.getClientRects().length > 0 && element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 2;
    }).map((node) => `${node.tagName}.${node.className}`).slice(0, 12));
    expect(overflowing, `overflow at ${width}`).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  };
  for (const width of [1440, 768, 640, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/atlas/expert/");
    await page.locator("#work-vaswani-2017-attention-is-all-you-need .atlas-incident > summary").click();
    await checkReflow(width);
    await page.goto("/atlas/evidence/");
    await page.locator(`#relation-${gravesRelation} summary`).click();
    await page.locator("#source-bahdanau-2014-arxiv-v1-full-text summary").click();
    await checkReflow(width);
  }
});

test("reduced motion and hidden graphics preserve relationship semantics", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/atlas/evidence/");
  await page.addStyleTag({ content: "svg, canvas, .atlas-line { display: none !important; }" });
  await page.emulateMedia({ forcedColors: "active" });
  const relation = page.locator(`#relation-${gravesRelation}`);
  await relation.locator("summary").click();
  await expect(relation).toContainText("documented-influence");
  await expect(relation).toContainText("Causal language prohibited");
  await expect(page.getByText("The three fields are independent.", { exact: false })).toBeVisible();
});

test("chooser and shared navigation link to the implemented atlas", async ({ page }) => {
  for (const path of paths) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Atlas", exact: true })).toHaveAttribute("href", "/atlas/");
  }
  await page.goto("/");
  await page.getByRole("link", { name: /Explore the research atlas/ }).click();
  await expect(page).toHaveURL(/\/atlas\/$/);
  await page.getByRole("link", { name: "Open the expert atlas →", exact: true }).click();
  await expect(page).toHaveURL(/\/atlas\/expert\/$/);
});

test("print exposes evidence inside closed native disclosures", async ({ page }) => {
  await page.emulateMedia({ media: "print" });
  await page.goto("/atlas/expert/");
  await expect(page.locator("#claim-markov-binary-text-sequence .atlas-detail-body")).toBeVisible();
  await page.goto("/atlas/evidence/");
  await expect(page.locator(`#relation-${gravesRelation} .atlas-evidence-list`)).toBeVisible();
  await expect(page.locator("#source-markov-1913-mathnet .atlas-detail-body")).toBeVisible();
});
