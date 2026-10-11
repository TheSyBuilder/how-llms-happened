import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { atlasCases } from "../src/lib/atlas-cases";
import { getAtlas, projectAtlasNeighborhood } from "../src/lib/atlas-data";

const atlas = getAtlas();
const target = (key: string, id: string) => `#case-${key}-relation-${id}`;

test("both study modes retain complete dates and incident evidence without JavaScript", async ({ browser, page }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: page.viewportSize()! });
  const staticPage = await context.newPage();
  for (const mode of ["beginner", "expert"]) {
    await staticPage.goto(`/atlas/cases/${mode}/`);
    await expect(staticPage.locator("[data-focus-work]")).toHaveCount(4);
    await expect(staticPage.locator("script, canvas, input, select, button, astro-island")).toHaveCount(0);
    for (const item of atlasCases) {
      const view = projectAtlasNeighborhood(atlas, item.workId);
      const section = staticPage.locator(`#case-${item.key}`);
      await expect(section.locator("[data-neighbor-id]")).toHaveCount(view.counts.neighbors);
      await expect(section.locator("[data-relation-id]")).toHaveCount(view.counts.incident);
      const relation = section.locator(target(item.key, item.id));
      await relation.locator("summary").click();
      const record = view.relationships.find(({ record }) => record.id === item.id)!.record;
      await expect(relation).toContainText(record.causalLanguage);
      await expect(relation.locator(".atlas-evidence-list li")).toHaveCount(record.sourceEvidence.length);
      await expect(relation.locator(".atlas-bound-claims li")).toHaveCount(record.claimIds.length);
    }
    const elman = staticPage.locator("#case-carried-state > .neighborhood-dates");
    await expect(elman).toContainText("1988-04");
    await expect(elman).toContainText("1990-03");
    await staticPage.locator("#case-opening > .neighborhood-dates summary").click();
    await expect(staticPage.locator("#case-opening > .neighborhood-dates")).toContainText("does not state the calendar convention");
  }
  await context.close();
});

test("diagram nodes, paths, line classes and scoped arrows match the incident records", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/atlas/cases/expert/");
  for (const item of atlasCases) {
    const view = projectAtlasNeighborhood(atlas, item.workId);
    const section = page.locator(`#case-${item.key}`);
    await section.locator(".neighborhood-diagram > summary").click();
    await expect(section.locator("[data-diagram-node]")).toHaveCount(view.counts.neighbors + 1);
    await expect(section.locator("[data-diagram-relation]")).toHaveCount(view.counts.incident);
    for (const relation of view.relationships) {
      const edge = section.locator(`[data-diagram-relation="${relation.record.id}"]`);
      await expect(edge).toHaveClass(new RegExp(`neighborhood-edge--${relation.record.evidenceClass}`));
      if (relation.record.causalLanguage === "prohibited") {
        expect(await edge.getAttribute("marker-start")).toBeNull();
        expect(await edge.getAttribute("marker-end")).toBeNull();
      } else {
        const fromFocus = relation.from.record.id === item.workId;
        await expect(edge).toHaveAttribute(fromFocus ? "marker-end" : "marker-start", `url(#arrow-${item.key})`);
        expect(await edge.getAttribute(fromFocus ? "marker-start" : "marker-end")).toBeNull();
      }
    }
    await expect(section.locator("figcaption")).toContainText("prohibited records have none");
  }
});

test("prediction and locator-audit tasks differ and preserve the chosen study across modes", async ({ page }) => {
  await page.goto("/atlas/cases/beginner/#case-carried-state");
  await expect(page.locator(".neighborhood-answer")).toHaveCount(4);
  const summary = page.locator("#case-carried-state .neighborhood-answer > summary");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#case-carried-state .neighborhood-answer")).toContainText("training procedure, data or results");
  const switchLink = page.locator("#case-carried-state").getByRole("link", { name: "Continue this study in expert mode" });
  await switchLink.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/atlas\/cases\/expert\/#case-carried-state$/);
  await expect(page.locator("#heading-carried-state")).toBeInViewport();
  await expect(page.locator(".neighborhood-answer")).toHaveCount(0);
  await expect(page.locator("#case-carried-state .neighborhood-task")).toContainText("architecture/citation locator");
  const locate = page.locator("#case-carried-state .neighborhood-task a");
  await locate.focus();
  await page.keyboard.press("Enter");
  const record = page.locator(target("carried-state", atlasCases[1].id));
  await record.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(record).toContainText("Qualified connection");
  const source = record.locator(".atlas-evidence-list a").first();
  await source.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/atlas\/evidence\/#source-/);
});

test("expanded dates, diagrams and relationship evidence pass accessibility checks", async ({ page }) => {
  test.setTimeout(60_000);
  for (const mode of ["beginner", "expert"]) {
    await page.goto(`/atlas/cases/${mode}/`);
    await page.locator("details").evaluateAll((nodes) => nodes.forEach((node) => { (node as HTMLDetailsElement).open = true; }));
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations).toEqual([]);
  }
});

test("study pages and expanded evidence reflow at desktop, tablet and narrow mobile widths", async ({ page }) => {
  for (const mode of ["beginner", "expert"]) for (const width of [1440, 768, 640, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/atlas/cases/${mode}/`);
    await page.locator("details").evaluateAll((nodes) => nodes.forEach((node) => { (node as HTMLDetailsElement).open = true; }));
    const overflowing = await page.evaluate(() => [...document.querySelectorAll("main *, .site-header")].filter((node) => {
      const element = node as HTMLElement;
      return !(element instanceof SVGElement) && element.getClientRects().length > 0 && element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 2;
    }).map((node) => `${node.tagName}.${node.className}`).slice(0, 12));
    expect(overflowing, `${mode} at ${width}`).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const clippedLabels = await page.locator(".neighborhood-svg").evaluateAll((nodes) => nodes.flatMap((node) => {
      const svg = node as SVGSVGElement;
      return [...svg.querySelectorAll("text")].filter((text) => {
        const box = text.getBBox();
        return box.x < 0 || box.x + box.width > svg.viewBox.baseVal.width || box.y < 0 || box.y + box.height > svg.viewBox.baseVal.height;
      }).map((text) => text.textContent);
    }));
    expect(clippedLabels, `SVG labels at ${width}`).toEqual([]);
    if (width <= 768) await expect(page.locator(".neighborhood-diagram").first()).toBeHidden();
  }
});

test("graphics-hidden, forced-color, reduced-motion and print states preserve the task evidence", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  await page.goto("/atlas/cases/expert/#case-documented-comparison");
  await page.addStyleTag({ content: "svg, .atlas-line { display: none !important; }" });
  const record = page.locator(target("documented-comparison", atlasCases[2].id));
  await record.locator("summary").click();
  await expect(record).toContainText("documented-influence");
  await expect(record).toContainText("Causal language prohibited");
  await expect(record).toContainText("article p. 9");
  await expect(record).toContainText("article p. 8");
  await page.emulateMedia({ media: "print", forcedColors: "none" });
  await page.goto("/atlas/cases/beginner/");
  await expect(page.locator("#case-parallel-development .neighborhood-answer .atlas-detail-body")).toBeVisible();
  await expect(page.locator(`${target("documented-comparison", atlasCases[2].id)} .atlas-evidence-list`)).toBeVisible();
});

test("catalogue links reach the corresponding study and its work return", async ({ page }) => {
  for (const mode of ["beginner", "expert"]) {
    await page.goto(`/atlas/${mode}/#inspection-cases`);
    await page.getByRole("link", { name: "Compare this local neighborhood" }).last().click();
    await expect(page).toHaveURL(new RegExp(`/atlas/cases/${mode}/#case-parallel-development$`));
    await expect(page.locator("#heading-parallel-development")).toBeInViewport();
    await page.locator("#case-parallel-development .neighborhood-return").getByRole("link", { name: "Return to this work in the catalogue" }).click();
    await expect(page).toHaveURL(new RegExp(`/atlas/${mode}/#work-${atlasCases[3].workId}$`));
  }
});
