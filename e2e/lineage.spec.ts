import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { CLOCK_START, games, type Driver, type Input } from "./helpers/games";
import {
  at, chapterMeta, chapterPath, expect, hydrated, localePath, locales, noHorizontalOverflow, openChapter, siteBase, SITE_ORIGIN, slugs, test, type Locale,
} from "./helpers/site";

const normalRun = !siteBase;
const href = (path: string) => `${siteBase}${path}`;

// ---------------------------------------------------------------------------------------------
// 1. Smoke: every chapter in every language.
// ---------------------------------------------------------------------------------------------
test.describe("chapter smoke", () => {
  test.skip(!normalRun, "base-path run");
  for (const locale of locales) {
    for (const [index, slug] of slugs.entries()) {
      test(`${locale} ${slug} opens on its game @smoke`, async ({ page, errors }, info) => {
        await openChapter(page, slug, { locale });
        const article = page.locator(".chapter-page");
        await expect(article, "no hash opens the Play view").toHaveAttribute("data-view", "play");
        await expect(page.locator("#play")).toBeVisible();
        await expect(page.locator("#play .goal-bar").first()).toBeVisible();
        await expect(page.locator("#play .goal-bar .goal-text").first()).not.toBeEmpty();
        await expect(page.locator(".chapter-end"), "share box").toBeVisible();

        // Dock: chronological, no Previous on the first chapter, and the last Next goes home.
        const dock = page.locator(".game-dock");
        const previous = slugs[index - 1], next = slugs[index + 1];
        if (previous) await expect(dock.locator(".dock-previous")).toHaveAttribute("href", href(`${chapterPath(previous, locale)}#play`));
        else await expect(dock.locator(".dock-previous")).toHaveCount(0);
        await expect(dock.locator(".dock-next")).toHaveAttribute("href", href(next ? `${chapterPath(next, locale)}#play` : localePath(locale)));

        const image = await page.locator('meta[property="og:image"]').getAttribute("content");
        expect(image).toBe(`${SITE_ORIGIN}${siteBase}/og/${slug}.png`);
        await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", image!);
        if (locale === "en") expect((await page.request.get(at(`/og/${slug}.png`))).status()).toBe(200);

        if (info.project.name === "mobile-chromium") await noHorizontalOverflow(page);
        expect(errors).toEqual([]);
      });
    }
  }

  test("the dock walks every chapter in order and ends at home", async ({ page }) => {
    test.slow();
    await openChapter(page, slugs[0]!);
    for (const slug of slugs.slice(1)) {
      await page.locator(".game-dock .dock-next").click();
      await expect(page).toHaveURL(`${chapterPath(slug)}#play`);
    }
    await page.locator(".game-dock .dock-next").click();
    await expect(page).toHaveURL("/");
    await page.goBack();
    await page.locator(".game-dock .dock-previous").click();
    await expect(page).toHaveURL(`${chapterPath(slugs.at(-2)!)}#play`);
  });
});

// ---------------------------------------------------------------------------------------------
// 2. One full play-through per game, ending on the ResultCard, then Play again.
// ---------------------------------------------------------------------------------------------
const playable = Object.keys(games);
test("every chapter has a play-through", () => {
  test.skip(!normalRun, "base-path run");
  expect([...playable].sort()).toEqual([...slugs].sort());
});

function driver(page: Page, input: Input, clock: boolean): Driver {
  const act = async (target: Locator) => {
    if (input === "mouse") return target.click();
    if (input === "touch") return target.tap();
    await expect(target).toBeEnabled();
    // Games move focus in a requestAnimationFrame after each step; let that land first so Enter goes where we aim.
    if (!clock) await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
    await target.focus();
    await expect(target).toBeFocused();
    await page.keyboard.press("Enter");
  };
  const tick = async (ms: number) => { if (clock) await page.clock.runFor(ms); else await page.waitForTimeout(ms); };
  return { page, input, act, tick };
}

for (const input of ["mouse", "keyboard", "touch"] as const) {
  test.describe(`play-through by ${input}`, () => {
    test.skip(!normalRun, "base-path run");
    test.use({ hasTouch: input === "touch" });
    for (const slug of playable.filter((s) => games[s]!.input === input)) {
      const game = games[slug]!;
      test(`${slug} plays to its result and replays`, async ({ page, errors }, info) => {
        test.skip(info.project.name !== "chromium", "desktop only");
        if (game.reducedMotion) await page.emulateMedia({ reducedMotion: "reduce" });
        if (game.clock) await page.clock.install({ time: CLOCK_START });
        if (game.date) await page.clock.setFixedTime(new Date(game.date));
        await openChapter(page, slug, { hash: "#play" });
        if (game.clock) await page.clock.pauseAt(new Date(CLOCK_START.getTime() + 60_000));
        const d = driver(page, input, !!game.clock);
        const status = page.locator("#play .goal-bar .goal-status").first();
        const before = await status.textContent();

        await game.play(d);
        if (game.clock) await d.tick(200);

        const card = page.locator("#play .result-card");
        await expect(card).toBeVisible();
        const headline = card.locator(".result-headline");
        await expect(headline).not.toBeEmpty();
        await expect(headline, "the result takes focus").toBeFocused();
        const share = new URL((await card.getByRole("link", { name: "Share on X" }).getAttribute("href"))!);
        expect(share.origin + share.pathname).toBe("https://x.com/intent/post");
        expect(share.searchParams.get("url")).toContain(`/chapters/${slug}/`);
        const next = slugs[slugs.indexOf(slug) + 1];
        if (next) await expect(card.locator(".result-next")).toHaveAttribute("href", `/chapters/${next}/#play`);
        else await expect(card.locator(".result-next")).toHaveCount(0);
        expect(await page.evaluate((s) => JSON.parse(localStorage.getItem("lineage-progress-v1") ?? "{}")[s], slug)).toMatchObject({ completed: true });

        await d.act(card.getByRole("button", { name: "Play again" }));
        if (game.clock) await d.tick(200);
        await expect(card).toHaveCount(0);
        await expect(page.locator("#play .goal-bar").first()).toBeVisible();
        await expect(status).toHaveText(game.replayStatus ?? before ?? "");
        expect(errors).toEqual([]);
      });
    }
  });
}

// ---------------------------------------------------------------------------------------------
// 3. Home page.
// ---------------------------------------------------------------------------------------------
test.describe("home", () => {
  test.skip(!normalRun, "base-path run");

  test("the GPT-2 hero challenge plays two rounds", async ({ page, errors }) => {
    await page.goto("/");
    await hydrated(page);
    const hero = page.locator(".g2c");
    const status = hero.locator(".goal-status");
    await expect(status).toHaveText(/^Round 1 \/ \d+$/);
    for (const round of [1, 2]) {
      await hero.locator(".g2c-choice").first().click();
      await expect(hero.locator(".g2c-verdict")).toBeVisible();
      await expect(hero.locator(".g2c-choice").first()).toBeDisabled();
      await hero.locator(".g2c-next").click();
      await expect(status).toHaveText(new RegExp(`^Round ${round + 1} / \\d+$`));
    }
    await expect(hero.locator(".g2c-score")).toHaveText(/^You [0-2] · GPT-2 [0-2]$/);
    expect(errors).toEqual([]);
  });

  test("the era spine has one stop per chapter, in order", async ({ page }) => {
    await page.goto("/");
    const stops = page.locator(".spine-stop");
    await expect(stops).toHaveCount(slugs.length);
    expect(await stops.evaluateAll((nodes) => nodes.map((n) => (n as HTMLElement).dataset.progress))).toEqual(slugs);
    expect(await stops.locator("a").evaluateAll((links) => links.map((a) => a.getAttribute("href")))).toEqual(slugs.map((s) => `/chapters/${s}/#play`));
    await expect(page.locator(".game-card")).toHaveCount(slugs.length);
    await expect(page.locator(".spine-era")).toHaveCount(new Set(chapterMeta.map((m) => m.era)).size);
  });

  test("finishing a game marks its card, its stop and the counter", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-progress-count]")).toContainText(`0 / ${slugs.length}`);
    await openChapter(page, "pretraining");
    await games.pretraining!.play(driver(page, "mouse", false));
    await expect(page.locator("#play .result-card")).toBeVisible();
    await page.goto("/");
    for (let load = 0; load < 2; load++) {
      const card = page.locator('.game-card[data-progress="pretraining"]'), stop = page.locator('.spine-stop[data-progress="pretraining"]');
      await expect(card).toHaveClass(/\bis-done\b/);
      await expect(card.locator(".game-card-check")).toBeVisible();
      await expect(stop).toHaveClass(/\bis-done\b/);
      await expect(stop.locator(".stop-check")).toBeVisible();
      await expect(page.locator(".game-card.is-done")).toHaveCount(1);
      await expect(page.locator("[data-progress-count]")).toContainText(`1 / ${slugs.length}`);
      await page.reload();
    }
  });

  test("blocked localStorage still renders and plays the home page", async ({ page, errors }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new DOMException("blocked", "SecurityError"); } });
    });
    await page.goto("/");
    await hydrated(page);
    await expect(page.locator(".game-card")).toHaveCount(slugs.length);
    await expect(page.locator("[data-progress-count]")).toContainText(`0 / ${slugs.length}`);
    await page.locator(".g2c .g2c-choice").first().click();
    await expect(page.locator(".g2c .g2c-verdict")).toBeVisible();
    await page.locator("[data-theme-toggle]").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", /dark|light/);
    expect(errors).toEqual([]);
  });

  test("Cmd/Ctrl+K opens the explorer, filters, and closes with focus returned", async ({ page }) => {
    await page.goto("/");
    await hydrated(page);
    const dialog = page.locator("dialog.experiment-switcher");
    const search = dialog.getByRole("searchbox");
    const rows = dialog.locator("li[data-search]");
    const start = page.locator(".home-actions a.game-btn");
    await start.focus();
    await page.keyboard.press("ControlOrMeta+k");
    await expect(dialog).toBeVisible();
    await expect(search).toBeFocused();
    await expect(rows.locator("visible=true")).toHaveCount(slugs.length);
    await search.fill("bert");
    await expect(rows.locator("visible=true")).toHaveCount(1);
    await expect(rows.locator("visible=true").locator("a.switcher-game")).toHaveAttribute("href", "/chapters/bert/#play");
    await search.fill("zzzz-nothing");
    await expect(rows.locator("visible=true")).toHaveCount(0);
    await expect(dialog.locator(".switcher-empty")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(start).toBeFocused();

    // The header button opens it too, starts unfiltered, and gets focus back.
    const opener = page.locator(".site-header [data-open-explorer]");
    await opener.click();
    await expect(dialog).toBeVisible();
    await expect(search).toHaveValue("");
    await expect(rows.locator("visible=true")).toHaveCount(slugs.length);
    await dialog.locator(".close-switcher").click();
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test("the theme toggle persists across reloads", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    const html = page.locator("html"), toggle = page.locator("[data-theme-toggle]");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    const lightPaper = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await toggle.click();
    await expect(html).toHaveAttribute("data-theme", "dark");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(html).toHaveAttribute("data-theme", "dark");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe(lightPaper);
    // A chapter page reads the same choice.
    await openChapter(page, "bert");
    await expect(html).toHaveAttribute("data-theme", "dark");
    await toggle.click();
    await page.reload();
    await expect(html).toHaveAttribute("data-theme", "light");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
  });
});

// ---------------------------------------------------------------------------------------------
// 4. Chapter views and the language switch.
// ---------------------------------------------------------------------------------------------
test.describe("chapter views", () => {
  test.skip(!normalRun, "base-path run");
  const view = (page: Page) => page.locator(".chapter-page");

  test("#problem opens Story and #deeper opens Math & sources", async ({ page }) => {
    await openChapter(page, "retrieval", { hash: "#problem" });
    await expect(view(page)).toHaveAttribute("data-view", "story");
    await expect(page.locator("#problem")).toBeVisible();
    await expect(page.locator('[data-chapter-view="story"]')).toHaveAttribute("aria-current", "true");

    await openChapter(page, "retrieval", { hash: "#deeper" });
    await expect(view(page)).toHaveAttribute("data-view", "reference");
    await expect(page.locator("#deeper")).toBeVisible();
    await expect(page.locator("#play")).toBeHidden();
    await expect(page.locator('[data-chapter-view="reference"]')).toHaveAttribute("aria-current", "true");

    // The in-page nav switches views without a reload.
    await page.locator('[data-chapter-view="play"]').click();
    await expect(view(page)).toHaveAttribute("data-view", "play");
    await expect(page.locator("#play .goal-bar")).toBeVisible();
    await page.locator('[data-chapter-view="story"]').click();
    await expect(view(page)).toHaveAttribute("data-view", "story");
  });

  test("hashes inside the game do not change the view", async ({ page }) => {
    await openChapter(page, "retrieval");
    await expect(view(page)).toHaveAttribute("data-view", "play");
    // The evidence chips jump to a passage without touching the hash.
    await page.locator(".rag-chip").first().click();
    await expect(page.locator("#rag-passage-b")).toBeFocused();
    await expect(view(page)).toHaveAttribute("data-view", "play");
    await page.evaluate(() => { location.hash = "#rag-passage-a"; });
    await expect(page).toHaveURL(/#rag-passage-a$/);
    await expect(view(page)).toHaveAttribute("data-view", "play");
    await page.evaluate(() => { location.hash = "#no-such-anchor"; });
    await expect(view(page)).toHaveAttribute("data-view", "play");
    await expect(page.locator("#play .goal-bar")).toBeVisible();
    // An unknown hash keeps whichever view is open.
    await page.locator('[data-chapter-view="story"]').click();
    await expect(view(page)).toHaveAttribute("data-view", "story");
    await page.evaluate(() => { location.hash = "#no-such-anchor-either"; });
    await expect(view(page)).toHaveAttribute("data-view", "story");
  });

  test("the language switch keeps the chapter and the hash", async ({ page }) => {
    const language = (code: Locale) => page.locator(`.language-switch a[data-language="${code}"]`).locator("visible=true").first();
    await openChapter(page, "bert");
    await page.locator('[data-chapter-view="story"]').click();
    await expect(page).toHaveURL(/#problem$/);
    await language("zh").click();
    await expect(page).toHaveURL(`${chapterPath("bert", "zh")}#problem`);
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await expect(view(page)).toHaveAttribute("data-view", "story");
    await language("ar").click();
    await expect(page).toHaveURL(`${chapterPath("bert", "ar")}#problem`);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await page.locator('[data-chapter-view="reference"]').click();
    await language("en").click();
    await expect(page).toHaveURL(`${chapterPath("bert")}#deeper`);
    await expect(view(page)).toHaveAttribute("data-view", "reference");
  });
});

// ---------------------------------------------------------------------------------------------
// 5. Accessibility: no serious or critical WCAG 2 A/AA violations.
// ---------------------------------------------------------------------------------------------
test.describe("accessibility", () => {
  test.skip(!normalRun, "base-path run");
  const pages: [string, Locale, string][] = [
    ["home", "en", "/"], ["home", "ar", "/ar/"],
    ["next-letter", "en", chapterPath("next-letter")], ["gpt-2", "en", chapterPath("gpt-2")],
    ["bert", "zh", chapterPath("bert", "zh")], ["mixture-of-experts", "zh", chapterPath("mixture-of-experts", "zh")],
    ["retrieval", "ar", chapterPath("retrieval", "ar")], ["now", "ar", chapterPath("now", "ar")],
    ["eliza", "en", chapterPath("eliza")], ["mixture-of-experts", "en", chapterPath("mixture-of-experts")],
  ];
  const serious = async (page: Page, path: string, scheme: "light" | "dark") => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.goto(path);
    await hydrated(page);
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    return violations.filter((v) => v.impact === "serious" || v.impact === "critical")
      .flatMap((v) => v.nodes.map((n) => ({ rule: v.id, target: n.target.join(" "), text: `${v.id} (${v.impact}): ${n.target.join(" ")}` })));
  };
  for (const [name, locale, path] of pages) {
    for (const scheme of ["light", "dark"] as const) {
      test(`${locale} ${name} (${scheme}) has no serious axe violations`, async ({ page }) => {
        expect((await serious(page, path, scheme)).map((v) => v.text)).toEqual([]);
      });
    }
  }
});

// ---------------------------------------------------------------------------------------------
// 6. Base path: run with SITE_BASE set (see playwright.config.ts).
// ---------------------------------------------------------------------------------------------
test.describe("base path", () => {
  test.skip(normalRun, "needs SITE_BASE and a build made with it");
  for (const [name, path] of [["home", "/"], ["word-vectors chapter", chapterPath("word-vectors")], ["zh bert chapter", chapterPath("bert", "zh")]] as const) {
    test(`${name} loads under the base path with no 404s @base`, async ({ page, errors }) => {
      const failed: string[] = [];
      page.on("response", (response) => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`); });
      page.on("requestfailed", (request) => failed.push(`failed ${request.url()}`));
      await page.goto(at(path), { waitUntil: "networkidle" });
      await hydrated(page);
      await expect(page.locator(".goal-bar").first()).toBeVisible();
      const image = await page.locator('meta[property="og:image"]').getAttribute("content");
      expect(image).toMatch(new RegExp(`^${SITE_ORIGIN}${siteBase}/og/`));
      // Every same-site link carries the base path.
      const links = await page.locator("a[href^='/']").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
      expect(links.filter((link) => !link.startsWith(`${siteBase}/`))).toEqual([]);
      if (path.includes("word-vectors")) await expect(page.locator("#vector-guess")).toBeEnabled({ timeout: 10_000 });
      if (path !== "/") {
        await page.locator(".game-dock .dock-next").click();
        await expect(page).toHaveURL(new RegExp(`^[^#]*${siteBase}/`));
        await hydrated(page);
      }
      expect(failed).toEqual([]);
      expect(errors).toEqual([]);
    });
  }

  test("a finished game links on under the base path @base", async ({ page, errors }) => {
    await openChapter(page, "pretraining");
    await games.pretraining!.play(driver(page, "mouse", false));
    await expect(page.locator("#play .result-next")).toHaveAttribute("href", `${siteBase}/chapters/bert/#play`);
    const share = new URL((await page.locator("#play .result-card").getByRole("link", { name: "Share on X" }).getAttribute("href"))!);
    expect(share.searchParams.get("url")).toBe(`${new URL(page.url()).origin}${siteBase}/chapters/pretraining/#play`);
    await page.goto(at("/"));
    await expect(page.locator('.game-card[data-progress="pretraining"]')).toHaveClass(/\bis-done\b/);
    expect(errors).toEqual([]);
  });
});
