import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "./helpers/component-require.mjs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/components/Gpt2Toy.tsx", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, jsxImportSource: "preact" },
});
const compiled = {};
const base = createRequire(import.meta.url);
// The game kit and stylesheets are browser-only; the cue lookup does not need them.
new Function("require", "exports", outputText)((id) => /\.css$|\/game\/|\/lib\/progress$/.test(id) ? {} : base(id), compiled);
const { readCue, holes, totalPar, golfStars, holeName, EXAMPLE, continuations } = compiled;

// Breadth-first search over card sequences from a hole's deck: the fewest cards that make the toy do the task.
function fewestCards(hole) {
  let frontier = [[]];
  for (let depth = 1; depth <= hole.deck.length; depth++) {
    frontier = frontier.flatMap((cards) => hole.deck.filter((card) => !cards.includes(card)).map((card) => [...cards, card]));
    if (frontier.some((cards) => readCue(cards) === hole.target)) return depth;
  }
  return Infinity;
}

test("the cue at the end of the prompt chooses the kind of continuation", () => {
  assert.equal(readCue([]), null);
  assert.equal(readCue(["TL;DR:"]), "summary");
  assert.equal(readCue(["Then"]), "story");
  assert.equal(readCue(["Then", "TL;DR:"]), "summary");
  assert.equal(readCue(["TL;DR:", "Then"]), "story");
  assert.equal(readCue(["Who?", "A:"]), "who");
  assert.equal(readCue(["Who?", "What?", "A:"]), "what");
  assert.equal(readCue(["A:"]), null);
});

test("translation needs an example pair, as in the GPT-2 report's prompts, and instructions alone do nothing", () => {
  assert.equal(readCue(["="]), null);
  assert.equal(readCue([EXAMPLE, "="]), "french");
  assert.equal(readCue(["=", EXAMPLE]), null);
  for (const cards of [["Summarise", "this:"], ["Please", "continue"], ["Translate", "into", "French:"], ["Answer"]]) assert.equal(readCue(cards), null);
});

test("every hole's par is the fewest cards that work, and every deck can reach its task", () => {
  assert.deepEqual(holes.map((hole) => hole.target), ["story", "summary", "french", "who"]);
  for (const hole of holes) {
    assert.equal(fewestCards(hole), hole.par, hole.task);
    assert.ok(continuations[hole.target]);
  }
  assert.equal(totalPar, 6);
});

test("stars and hole names follow strokes against par", () => {
  assert.deepEqual([6, 7, 9, 10, 14, 15].map(golfStars), [3, 2, 2, 1, 1, 0]);
  assert.equal(holeName(1, 1), "Par");
  assert.equal(holeName(2, 1), "Bogey");
  assert.equal(holeName(4, 2), "Double bogey");
  assert.equal(holeName(6, 2), "4 over par");
});
