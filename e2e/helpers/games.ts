// One winning (or at least finishing) play-through per chapter game, driven like a player would.
// Each game uses one input style; the spec runs them on desktop Chromium in English.
import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { dayNumber, secretFor } from "../../src/components/early/vector-game";

export type Input = "mouse" | "keyboard" | "touch";
export type Driver = {
  page: Page;
  input: Input;
  /** Presses a control the way this game's player does: click, tap, or focus and Enter. */
  act: (target: Locator) => Promise<void>;
  /** Advances the fake clock (only for games with `clock: true`). */
  tick: (ms: number) => Promise<void>;
};
export type Game = {
  input: Input;
  /** Install page.clock and pause it once the page has hydrated; time moves only through `tick`. */
  clock?: boolean;
  /** Fixed calendar date for date-based puzzles (timers keep running). */
  date?: string;
  reducedMotion?: boolean;
  /** Status after Play again when it deliberately differs from the first load (default: the same as the first load). */
  replayStatus?: RegExp;
  play: (d: Driver) => Promise<void>;
};

export const CLOCK_START = new Date("2026-11-11T09:00:00");
const button = (page: Page, name: string | RegExp) => page.locator("#play").getByRole("button", { name, exact: typeof name === "string" });
const primary = (page: Page, scope: string) => page.locator(`${scope} .game-btn.is-primary`);
async function keyRange(d: Driver, selector: string, steps: number) {
  const slider = d.page.locator(selector);
  await slider.focus();
  for (let i = 0; i < Math.abs(steps); i++) await slider.press(steps > 0 ? "ArrowRight" : "ArrowLeft");
}
async function setRange(page: Page, selector: string, value: number) {
  await page.locator(selector).evaluate((input: HTMLInputElement, v) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, String(v));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

export const games: Record<string, Game> = {
  "next-letter": {
    input: "keyboard",
    async play({ page }) {
      await page.locator(".markov-key").first().focus();
      // A fixed, lopsided pattern: the predictor needs 30 presses either way.
      for (let i = 0; i < 30; i++) await page.keyboard.press(i % 3 === 0 ? "ArrowRight" : "a");
    },
  },
  "zero-counts": {
    input: "touch",
    async play({ page, act }) {
      const order = async (drinks: string[]) => {
        for (const drink of drinks) await act(page.locator(".zero-menu button", { hasText: drink }));
        await act(button(page, /Serve/));
      };
      await order(["tea", "coffee", "tea"]);
      await order(["juice", "tea", "tea"]);
      await order(["tea", "juice", "tea"]);
      await order(["water", "coffee", "tea"]);
      await order(["milk", "milk", "juice"]);
      await act(page.locator(".zero-rescue .game-choices button").nth(1));
    },
  },
  eliza: {
    input: "keyboard",
    async play({ page }) {
      const input = page.locator("#eliza-input");
      for (const message of ["I feel angry at you.", "Pizza and chips.", "Hello", "Hello"]) {
        if (await page.locator(".result-card").count()) break;
        await input.focus();
        await page.keyboard.type(message);
        await page.keyboard.press("Enter");
      }
    },
  },
  speech: {
    input: "keyboard",
    async play({ page, act }) {
      for (let round = 0; round < 5; round++) {
        await act(page.locator(".speech-game .game-choices button").first());
        await act(page.locator(".speech-reveal .game-btn"));
      }
    },
  },
  elman: {
    input: "keyboard",
    reducedMotion: true,
    async play({ page, act }) {
      for (let round = 0; round < 3; round++) {
        await act(button(page, "One more"));
        await act(button(page, /^Lock in/));
        await act(page.locator(".elman-game > .game-btn"));
      }
    },
  },
  lstm: {
    input: "keyboard",
    clock: true,
    async play({ page, act, tick }) {
      for (let vault = 0; vault < 3; vault++) {
        await act(button(page, /Start vault/));
        await tick(50);
        for (let step = 0; step < 200; step++) {
          const state = await page.evaluate(() => {
            const incoming = document.querySelector(".vault-incoming")?.className ?? "";
            const gates = [...document.querySelectorAll<HTMLButtonElement>(".vault-gate")];
            return { incoming, keep: gates[0]!.getAttribute("aria-pressed"), write: gates[1]!.getAttribute("aria-pressed"), bell: !gates[2]!.disabled };
          });
          if (state.bell) { await page.keyboard.press("r"); break; }
          // Write each code in, forget only when a new code replaces the old one.
          const keep = !state.incoming.includes("is-new-code"), write = /is-code|is-new-code/.test(state.incoming);
          if (String(keep) !== state.keep) await page.keyboard.press("k");
          if (String(write) !== state.write) await page.keyboard.press("w");
          await tick(300);
        }
        await tick(50);
        await act(page.locator(".vault-game > .game-btn"));
        await tick(50);
      }
    },
  },
  "neural-language-model": {
    input: "touch",
    async play({ page, act }) {
      const plan = [["dog", "horse"], ["bike"], ["cat", "dog", "bike"], ["cat", "horse", "bike"], ["dog", "horse", "car"], ["cat", "dog", "bike"]];
      for (const words of plan) {
        for (const word of words) await act(page.locator(`button.nlm-card:has(.nlm-word:text-is("${word}"))`));
        await act(button(page, "Teach it"));
        await act(button(page, /^(Next lesson|See my score)$/));
      }
    },
  },
  "rnn-language-model": {
    input: "touch",
    async play({ page, act }) {
      for (const words of [["river", "the"], ["loan", "to", "the"], ["river", "we", "walked", "to", "the"]]) {
        for (const word of words) await act(page.locator(".rnn-tiles button", { hasText: new RegExp(`^${word}$`) }));
        await act(primary(page, ".rnn-actions"));
        await act(primary(page, ".rnn-actions"));
      }
    },
  },
  "word-vectors": {
    input: "keyboard",
    date: "2026-11-01T12:00:00",
    replayStatus: /^Practice word · 0 guesses$/,
    async play({ page, act }) {
      const field = page.locator("#vector-guess");
      await expect(field).toBeEnabled({ timeout: 10_000 });
      for (const word of ["water", "cats", "music"]) { await field.focus(); await page.keyboard.type(word); await page.keyboard.press("Enter"); }
      await act(button(page, /Hint/));
      await field.focus();
      await page.keyboard.type(secretFor(dayNumber(new Date("2026-11-01T12:00:00"))));
      await page.keyboard.press("Enter");
    },
  },
  graves: {
    input: "mouse",
    replayStatus: /^Line 0 \/ 8$/, // keeps the trained bot and starts a fresh set of lines
    async play({ page, act }) {
      await act(button(page, "Train my bot"));
      await setRange(page, "#graves-temperature", 0.6);
      for (let i = 0; i < 8 && !(await page.locator(".result-card").count()); i++) {
        const finish = button(page, "Finish with my best line");
        await act((await finish.count()) ? finish : button(page, "Write a line"));
      }
    },
  },
  "sequence-to-sequence": {
    input: "mouse",
    async play({ page, act }) {
      for (const facts of [["fox", "at night", "red"], ["grey", "swims", "today"], ["small", "brown", "dog"]]) {
        for (const fact of facts) await act(page.locator(".s2s-facts button", { hasText: new RegExp(`^${fact}$`) }));
        await act(page.locator(".s2s-actions .game-btn"));
        await act(page.locator(".s2s-actions .game-btn"));
      }
    },
  },
  attention: {
    input: "touch",
    async play({ page, act }) {
      const rounds = [[[0, 0], [2, 1], [1, 2]], [[0, 0], [1, 1], [2, 2], [3, 3], [6, 4], [5, 5], [4, 6]], [[0, 0], [2, 1], [3, 2], [2, 3], [4, 4], [4, 5]]];
      for (const links of rounds) {
        for (const [english, french] of links) {
          await act(page.locator(".att-column").nth(0).locator("button").nth(english!));
          await act(page.locator(".att-column").nth(1).locator("button").nth(french!));
        }
        await act(primary(page, ".att-actions"));
        await act(primary(page, ".att-actions"));
      }
    },
  },
  tokens: {
    input: "keyboard",
    async play({ page, act }) {
      await expect(page.locator(".tok-loading")).toHaveCount(0, { timeout: 10_000 });
      const type = async (field: Locator, text: string) => { await field.focus(); await page.keyboard.type(text); };
      await type(page.locator("#tok-name-input"), "Ada Lovelace");
      await type(page.getByLabel("A long word"), "international");
      for (const word of ["phytohemagglutinin", "strawberry"]) {
        const field = page.getByLabel("A real English word");
        await field.fill("");
        await type(field, word);
        await act(page.locator(".tok-row button"));
      }
      await act(page.locator(".tok-choices button").nth(1));
      await act(page.locator(".tok-choices button").nth(2));
      await act(page.locator(".tok-finish"));
    },
  },
  "drop-recurrence": {
    input: "mouse",
    clock: true,
    async play({ page, act, tick }) {
      for (const bet of [2, 2, 1, 1]) {
        await act(page.locator(".race-bets button").nth(bet));
        await tick(2_000);
        await act(page.locator(".race-actions .game-btn"));
        await tick(50);
      }
    },
  },
  transformer: {
    input: "keyboard",
    async play(d) {
      const { page, act } = d;
      await act(page.getByRole("button", { name: "The, word 1" })); await act(button(page, "Hide future words")); await act(button(page, "Next puzzle"));
      await act(page.getByRole("button", { name: "on, word 4" })); await keyRange(d, "#query-direction", -3); await act(button(page, "Next puzzle"));
      await keyRange(d, "#query-direction", 3); await act(button(page, "Hide future words")); await act(button(page, "Next puzzle"));
      await act(page.getByRole("button", { name: "on, word 4" })); await act(button(page, "Hide future words")); await keyRange(d, "#query-direction", 3); await act(button(page, "Next puzzle"));
      await act(page.getByRole("button", { name: "the, word 5" })); await act(button(page, "Hide future words")); await keyRange(d, "#query-direction", 2); await act(button(page, "See your result"));
    },
  },
  pretraining: {
    input: "mouse",
    async play({ page, act }) {
      for (const word of ["splendid", "delightful", "dreadful"]) await act(button(page, word));
    },
  },
  bert: {
    input: "touch",
    async play({ page, act }) {
      const left = () => act(button(page, /Reveal a left clue/)), right = () => act(button(page, /Reveal a right clue/));
      await left(); await right(); await act(button(page, "plane")); await act(button(page, "Next round"));
      await right(); await act(button(page, "socks")); await act(button(page, "Next round"));
      await right(); await act(button(page, "giraffe")); await act(button(page, "Next round"));
      await left(); await right(); await act(button(page, "fish")); await act(button(page, "Next round"));
      await right(); await right(); await act(button(page, "clock")); await act(button(page, "See your result"));
    },
  },
  "gpt-2": {
    input: "touch",
    async play({ page, act }) {
      const card = (code: string) => act(page.locator(".g2-deck button").filter({ has: page.locator(`code:text-is("${code}")`) }));
      await card("Please"); await card("Then"); await act(button(page, "Next hole"));
      await card("TL;DR:"); await act(button(page, "Next hole"));
      await card("cat = chat"); await card("="); await act(button(page, "Next hole"));
      await card("Who?"); await card("A:"); await act(button(page, "See your scorecard"));
    },
  },
  "scaling-laws": {
    input: "keyboard",
    async play(d) {
      const { page, act } = d;
      for (const [i, steps] of [28, 44, 50].entries()) {
        await keyRange(d, "#model-size", steps);
        await act(button(page, "Drop my guess"));
        await act(button(page, i < 2 ? "Next budget" : "See your result"));
      }
    },
  },
  retrieval: {
    input: "mouse",
    async play({ page, act }) {
      // Poison: one web page now answers the question word for word, with the wrong time.
      await page.locator("#rag-passage-c").fill("Moss Museum opens at 09:00. When does it open?");
      await expect(page.getByTestId("retrieval-answer")).toHaveText("Moss Museum opens at 09:00.");
      await act(button(page, "Lock in the trick"));
      // Fix: the official notice outranks the poisoned page.
      await page.locator("#rag-passage-a").fill("When does Moss Museum open? Moss Museum opens at 10:00.");
      await expect(page.getByTestId("retrieval-answer")).toHaveText("Moss Museum opens at 10:00.");
      await act(button(page, "Lock in the fix"));
    },
  },
  "gpt-3": {
    input: "mouse",
    async play({ page, act }) {
      await act(button(page, "moon sun")); await act(button(page, "Next puzzle"));
      await act(button(page, "Show another example")); await act(button(page, "red red")); await act(button(page, "Next puzzle"));
      await act(button(page, "blue green red")); await act(button(page, "Next puzzle"));
      await act(button(page, "Show another example")); await act(button(page, "green blue red")); await act(button(page, "Next puzzle"));
      await act(button(page, "Show another example")); await act(button(page, "Show another example")); await act(button(page, "two one three")); await act(button(page, "See your result"));
    },
  },
  "mixture-of-experts": {
    input: "keyboard",
    clock: true,
    async play({ page, act, tick }) {
      await act(button(page, "Start routing"));
      for (let step = 0; step < 120 && !(await page.locator(".result-card").count()); step++) {
        const expert = await page.evaluate(() => {
          const front = document.querySelector(".moe-token.is-front");
          if (!front || front.classList.contains("is-empty")) return -1;
          const kind = Number([...front.classList].find((c) => c.startsWith("kind-"))!.slice(5));
          const full = [...document.querySelectorAll(".moe-expert")].map((e) => e.classList.contains("is-full"));
          return full[kind] ? full.findIndex((f) => !f) : kind;
        });
        if (expert >= 0) await page.keyboard.press(String(expert + 1));
        await tick(300);
      }
    },
  },
  "human-feedback": {
    input: "touch",
    async play({ page, act }) {
      const answers = page.locator(".hf-pair").nth(0).locator(".hf-answer");
      await act(answers.first());
      await act(page.locator(".hf-pair").nth(1).locator(".hf-answer").first());
      await act(button(page, "Now fix the judge"));
      // Truth over style: the true answer against a fluent false one.
      for (const text of ["Earth turns, so our side", "It doesn’t really.", "Ice is less dense", "Air molecules scatter"]) {
        await act(page.locator(".hf-answer", { hasText: text }));
      }
      await act(button(page, "Test the judge"));
    },
  },
  "chain-of-thought": {
    input: "touch",
    async play({ page, act }) {
      await act(page.locator(".cot-start button"));
      const wrongStep: [string, number][] = [["notebooks", 1], ["train", 2], ["stickers", 2], ["flour", 1], ["shirt", 2]];
      for (let i = 0; i < 5; i++) {
        const question = (await page.locator(".cot-question").textContent()) ?? "";
        const step = wrongStep.find(([word]) => question.includes(word))?.[1] ?? 1;
        await act(page.locator(".cot-step").nth(step));
        await act(page.locator(".cot-verdict button"));
      }
    },
  },
  chinchilla: {
    input: "mouse",
    async play({ page, act }) {
      for (const size of [9.45, 10.72, 10.86]) {
        await setRange(page, "#chin-size", size);
        await act(primary(page, ".chin-actions"));
        await act(page.locator(".chin-reveal button"));
      }
    },
  },
  "tools-and-agents": {
    input: "mouse",
    async play({ page, act }) {
      for (const tool of [0, 1, 2]) {
        await act(page.locator(".agent-tools button").nth(tool));
        await act(page.locator(".agent-options button").first());
      }
      await act(page.locator(".agent-tools button").nth(3));
      await act(page.locator(".agent-options button").first());
    },
  },
  chatgpt: {
    input: "keyboard",
    async play({ page, act }) {
      await act(button(page, "4 messages"));
      // Small talk first, so the name and the Oslo change are the last things it reads.
      for (const move of ["Ask what to pack", "Ask about rain", "Plan a trip to Kyoto", "Say your name", "Change it to Oslo"]) await act(button(page, move));
    },
  },
  "open-models": {
    input: "mouse",
    async play({ page, act }) {
      await act(page.locator(".om-presets button").nth(1));
      await act(page.locator(".om-bits button").first());
      for (const model of [12, 10, 9]) await act(page.locator(".om-models button").nth(model));
    },
  },
  "gpt-4": {
    input: "touch",
    async play({ page, act }) {
      for (const [tile, answer] of [[2, "Lighthouse"], [2, "Snowman"], [8, "Hot-air balloon"]] as const) {
        await act(page.getByRole("button", { name: `Reveal tile ${tile}` }));
        await act(page.locator(".vision-side .game-choices button", { hasText: answer }));
        await act(button(page, /^(Next picture|See your score)$/));
      }
    },
  },
  dpo: {
    input: "touch",
    async play({ page, act }) {
      for (let round = 0; round < 10; round++) {
        // Prefer the answer that is neither vague nor in pirate voice.
        const best = await page.evaluate(() => {
          const cards = [...document.querySelectorAll(".dpo-answer")];
          const vague = /depends|lots of ways|big topic/;
          const score = (card: Element) => (vague.test(card.textContent ?? "") ? 0 : 2) + (card.querySelector("em") ? 0 : 1);
          return cards.indexOf(cards.slice().sort((a, b) => score(b) - score(a))[0]!);
        });
        await act(page.locator(".dpo-answer").nth(best));
      }
    },
  },
  reasoning: {
    input: "touch",
    async play({ page, act }) {
      const op = (label: string) => act(page.locator(".rs-ops button", { hasText: label }).first());
      await act(page.locator(".rs-intro button"));
      const plans = [["+3", "×2"], ["+4", "×3", "−2"], ["×2", "+5", "+5", "×2"]];
      for (const [i, plan] of plans.entries()) {
        if (i === 2) { await op("−3"); await act(page.locator(".rs-ops button").last()); } // a wrong step, then undo
        for (const label of plan) await op(label);
        await act(page.locator(".rs-reveal button"));
      }
    },
  },
  now: {
    input: "mouse",
    async play({ page, act }) {
      const ranges = page.locator(".now-range input");
      await ranges.nth(0).fill("3");
      await ranges.nth(1).fill("4");
      await act(page.locator(".now-tool input"));
      await act(page.locator(".now-send .game-btn.is-primary"));
    },
  },
};
