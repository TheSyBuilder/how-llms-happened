import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { atlasCases } from "../src/lib/atlas-cases";
import { getAtlas } from "../src/lib/atlas-data";
import { atlasEvidenceLenses, projectAtlasEvidenceLens } from "../src/lib/atlas-evidence-lens";

const atlas = getAtlas();
const sectionId = (key: string) => `#lens-case-${key}`;
const lensId = (key: string, lens: string) => `#lens-${key}-${lens}`;
const recordId = (key: string, id: string) => `#lens-${key}-record-${id}`;

test("all static intersections, excluded fields and full incident evidence work without JavaScript", async ({ browser, page }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: page.viewportSize()! });
  const staticPage = await context.newPage();
  await staticPage.goto("/atlas/lenses/");
  await expect(staticPage.locator("[data-focus-work]")).toHaveCount(4);
  await expect(staticPage.locator("script, canvas, input, select, button, astro-island")).toHaveCount(0);
  for (const item of atlasCases) {
    const section = staticPage.locator(sectionId(item.key));
    const all = projectAtlasEvidenceLens(atlas, {}, item.workId);
    await expect(section.locator("[data-relation-id]")).toHaveCount(all.counts.total);
    await expect(section.locator("table caption")).toContainText("Matched records under each lens");
    await expect(section.locator('table th[scope="col"]')).toHaveCount(4);
    await expect(section.locator('table th[scope="row"]')).toHaveCount(8);
    for (const lens of atlasEvidenceLenses) {
      const view = projectAtlasEvidenceLens(atlas, lens.constraints, item.workId);
      const detail = section.locator(lensId(item.key, lens.key));
      await detail.locator(":scope > summary").click();
      await expect(detail.locator("[data-lens-match]")).toHaveCount(view.counts.matched);
      await expect(detail.locator("[data-lens-excluded]")).toHaveCount(view.counts.excluded);
      await expect(detail.locator("[data-lens-outside]")).toHaveCount(view.counts.outsideMatched);
      for (const { relation, failedFields } of view.excluded) {
        const entry = detail.locator(`[data-lens-excluded="${relation.record.id}"]`);
        expect(await entry.locator("[data-failed-field]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-failed-field")))).toEqual(failedFields);
      }
      const cells = section.locator(`[data-count-lens="${lens.key}"] td`);
      expect(await cells.allTextContents()).toEqual([`${view.counts.matched} of ${view.counts.total}`, `${view.counts.outsideMatched} of ${view.counts.outsideTotal}`, `${view.counts.globalMatched} of ${view.counts.globalTotal}`]);
      await detail.locator(":scope > summary").click();
    }
    for (const relation of all.relationships) {
      const record = section.locator(recordId(item.key, relation.record.id));
      await record.locator("summary").click();
      await expect(record.locator(".atlas-evidence-list li")).toHaveCount(relation.record.sourceEvidence.length);
      await expect(record.locator(".atlas-bound-claims li")).toHaveCount(relation.record.claimIds.length);
      for (const evidence of relation.record.sourceEvidence) await expect(record).toContainText(evidence.support);
    }
  }
  await context.close();
});

test("documented comparison keeps prohibited causality and every three-field exclusion", async ({ page }) => {
  await page.goto("/atlas/lenses/#lens-case-documented-comparison");
  const conjunction = page.locator(lensId("documented-comparison", "documented-prohibited"));
  await conjunction.locator(":scope > summary").click();
  await expect(conjunction.locator("[data-lens-match]")).toHaveCount(1);
  await expect(conjunction.locator("[data-lens-match]")).toContainText("causal language prohibited");
  const threeFields = page.locator(lensId("documented-comparison", "documented-qualified-builds"));
  await threeFields.locator(":scope > summary").click();
  const excluded = threeFields.locator(`[data-lens-excluded="${atlasCases[2]!.id}"]`);
  await expect(excluded.locator("[data-failed-field]")).toHaveCount(2);
  await expect(excluded).toContainText("requires qualified; record has prohibited");
  await expect(excluded).toContainText("requires builds-on; record has addresses");
  const record = page.locator(recordId("documented-comparison", atlasCases[2]!.id));
  await record.locator("summary").click();
  await expect(record).toContainText("Causal language prohibited");
  await expect(record).toContainText("article p. 9");
  await expect(record).toContainText("article p. 8");
});

test("empty local matches retain constraints, outside records and all-record recovery", async ({ page }) => {
  await page.goto("/atlas/lenses/#lens-case-parallel-development");
  const lens = page.locator(lensId("parallel-development", "inherited"));
  await lens.locator(":scope > summary").click();
  await expect(lens.locator(".lens-constraints")).toContainText("inherited-mechanism");
  await expect(lens.locator(".lens-empty")).toContainText("No matching incident records");
  await expect(lens.locator(".lens-empty")).toContainText("0 of 5");
  await expect(lens.locator(".lens-empty")).toContainText("1 matching record is elsewhere");
  await expect(lens.locator("[data-lens-match]")).toHaveCount(0);
  await lens.locator(".lens-outside > summary").click();
  await lens.locator("[data-lens-outside] a").click();
  await expect(page).toHaveURL(/\/atlas\/evidence\/#relation-shannon-1948-to-jelinek-1975$/);
  await page.goBack();
  if (await lens.getAttribute("open") === null) await lens.locator(":scope > summary").click();
  await lens.getByRole("link", { name: "Inspect the All records lens" }).click();
  await expect(page).toHaveURL(/#lens-parallel-development-all$/);
  const all = page.locator(lensId("parallel-development", "all"));
  await all.locator(":scope > summary").click();
  await expect(all.locator("[data-lens-match]")).toHaveCount(5);
});

test("keyboard path preserves the case and reaches complete source scope", async ({ page }) => {
  await page.goto("/atlas/cases/expert/#case-carried-state");
  const entry = page.locator("#case-carried-state").getByRole("link", { name: "Compare evidence lenses for this study" });
  await entry.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/atlas\/lenses\/#lens-case-carried-state$/);
  const rowLink = page.locator('#lens-case-carried-state [data-count-lens="documented-qualified-builds"] a');
  await rowLink.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#lens-carried-state-documented-qualified-builds$/);
  const lens = page.locator(lensId("carried-state", "documented-qualified-builds"));
  await lens.locator(":scope > summary").focus();
  await page.keyboard.press("Space");
  const match = lens.locator(`[data-lens-match="${atlasCases[1]!.id}"] a`);
  await match.focus();
  await page.keyboard.press("Enter");
  const record = page.locator(recordId("carried-state", atlasCases[1]!.id));
  await record.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(record).toContainText("Qualified connection");
  const source = record.locator(".atlas-evidence-list a").first();
  await source.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/atlas\/evidence\/#source-/);
  await page.goto("/atlas/lenses/#lens-case-carried-state");
  await page.locator("#lens-case-carried-state .neighborhood-return").getByRole("link", { name: "Try this study in beginner mode" }).click();
  await expect(page).toHaveURL(/\/atlas\/cases\/beginner\/#case-carried-state$/);
  await expect(page.getByRole("link", { name: "Compare evidence lenses for this study" })).toHaveCount(0);
});

test("fully expanded lens comparisons and source evidence pass accessibility checks", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/atlas/lenses/");
  await page.locator("details").evaluateAll((nodes) => nodes.forEach((node) => { (node as HTMLDetailsElement).open = true; }));
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations).toEqual([]);
});

test("count tables, constraints and complete expanded evidence reflow at four widths", async ({ page }) => {
  for (const width of [1440, 768, 640, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/atlas/lenses/");
    await page.locator("details").evaluateAll((nodes) => nodes.forEach((node) => { (node as HTMLDetailsElement).open = true; }));
    const overflowing = await page.evaluate(() => [...document.querySelectorAll("main *, .site-header")].filter((node) => {
      const element = node as HTMLElement;
      return element.getClientRects().length > 0 && element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 2;
    }).map((node) => `${node.tagName}.${node.className}`).slice(0, 12));
    expect(overflowing, `lens comparison at ${width}`).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const tables = page.locator(".lens-table");
    await expect(tables).toHaveCount(4);
    for (const table of await tables.all()) await expect(table.locator("tbody tr")).toHaveCount(8);
  }
});

test("graphics-hidden, forced colors, reduced motion and print retain lens meaning", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  await page.goto("/atlas/lenses/");
  await page.addStyleTag({ content: "svg, .atlas-line { display: none !important; }" });
  const lens = page.locator(lensId("documented-comparison", "documented-prohibited"));
  await lens.locator(":scope > summary").click();
  await expect(lens).toContainText("documented-influence");
  await expect(lens).toContainText("prohibited");
  await page.emulateMedia({ media: "print", forcedColors: "none" });
  await page.goto("/atlas/lenses/");
  await expect(page.locator(`${lensId("parallel-development", "inherited")} .lens-empty`)).toBeVisible();
  await expect(page.locator(`${recordId("documented-comparison", atlasCases[2]!.id)} .atlas-evidence-list`)).toBeVisible();
});
