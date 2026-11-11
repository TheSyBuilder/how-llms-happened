import { expect, test as base, type Page } from "@playwright/test";
import { chapterMeta } from "../../src/lib/chapter-meta";

export { chapterMeta };
export const slugs = chapterMeta.map((meta) => meta.slug);
export const locales = ["en", "zh", "ar"] as const;
export type Locale = (typeof locales)[number];
export const SITE_ORIGIN = "https://thesybuilder.github.io";
// Set for the base-path run (see playwright.config.ts); empty for the normal run.
export const siteBase = (process.env.SITE_BASE ?? "").replace(/\/$/, "");

/** Site path for a locale, without the base path: "/", "/zh/", "/ar/chapters/bert/". */
export function localePath(locale: Locale, path = "/") {
  return locale === "en" ? path : `/${locale}${path}`;
}
export const chapterPath = (slug: string, locale: Locale = "en") => localePath(locale, `/chapters/${slug}/`);
/** What page.goto needs: the site path with the base path in front. */
export const at = (path: string) => `${siteBase}${path}`;

// A small seeded generator so games that shuffle or pick a world play the same every run.
function seededRandom() {
  let seed = 0x2f6b1d3;
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  Math.random = random;
  // Speech games and the first-look reader speak aloud; record the calls instead.
  const spoken: string[] = [];
  class Utterance { text: string; lang = ""; rate = 1; constructor(text: string) { this.text = text; } }
  Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: Utterance });
  Object.defineProperty(window, "speechSynthesis", {
    configurable: true,
    value: {
      speaking: false, pending: false, paused: false,
      speak: (u: Utterance) => { spoken.push(u.text); }, cancel() {}, pause() {}, resume() {},
      getVoices: () => [], addEventListener() {}, removeEventListener() {},
    },
  });
  (window as unknown as { __spoken: string[] }).__spoken = spoken;
}

type Fixtures = { errors: string[] };
/** `page` with a seeded Math.random and a stubbed speechSynthesis; `errors` collects console errors and page errors. */
export const test = base.extend<Fixtures>({
  errors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
    await use(errors);
  },
  page: async ({ page }, use) => {
    await page.addInitScript(seededRandom);
    await use(page);
  },
});
export { expect };

/** Waits until every eagerly loaded Astro island has hydrated (client:visible ones wait for the viewport). */
export async function hydrated(page: Page) {
  await expect(page.locator('astro-island[ssr]:not([client="visible"])')).toHaveCount(0, { timeout: 10_000 });
}

export async function openChapter(page: Page, slug: string, { locale = "en" as Locale, hash = "" } = {}) {
  await page.goto(at(chapterPath(slug, locale) + hash));
  await hydrated(page);
}

export async function noHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "page scrolls sideways").toBeLessThanOrEqual(0);
}
