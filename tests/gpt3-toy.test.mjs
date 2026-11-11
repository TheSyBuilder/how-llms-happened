import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "./helpers/component-require.mjs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/components/Gpt3Toy.tsx", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, jsxImportSource: "preact" },
});
const compiled = {};
const base = createRequire(import.meta.url);
// The game kit and stylesheets are browser-only; the rule filter does not need them.
new Function("require", "exports", outputText)((id) => /\.css$|\/game\/|\/lib\/progress$/.test(id) ? {} : base(id), compiled);
const { pairRules, tripleRules, fittingRules, mismatchingRows, puzzles, answerOf, choicesFor, filterNeeds, puzzlePoints, maxPoints, gpt3Stars, longestStreak } = compiled;
const ex = (input, output) => ({ input: input.split(" "), output: output.split(" ") });

test("an ambiguous example leaves several rules until a distinguishing one arrives", () => {
  assert.equal(fittingRules([ex("red red", "red red")]).length, 4);
  assert.deepEqual(fittingRules([ex("red red", "red red"), ex("red blue", "blue red")]).map((r) => r.id), ["swap"]);
  assert.equal(fittingRules([], tripleRules).length, 6);
  assert.deepEqual(fittingRules([ex("a a b", "a b a")], tripleRules).map((r) => r.id), ["rotate", "swapBack"]);
});

test("contradictory or impossible examples leave no rule rather than inventing one", () => {
  assert.equal(fittingRules([ex("red blue", "blue red"), ex("red blue", "red blue")]).length, 0);
  assert.equal(fittingRules([ex("red blue", "gold gold")]).length, 0);
  const examples = [ex("red blue", "red red"), ex("gold red", "red gold")];
  const snapshot = structuredClone(examples);
  assert.deepEqual(mismatchingRows(pairRules.find((r) => r.id === "swap"), examples), [1]);
  assert.deepEqual(mismatchingRows(pairRules[0], []), []);
  assert.deepEqual(examples, snapshot);
});

test("each puzzle's examples obey its rule, and the filter needs every example it is shown", () => {
  assert.equal(puzzles.length, 5);
  assert.deepEqual(puzzles.map(filterNeeds), [2, 2, 2, 3, 3]);
  for (const puzzle of puzzles) {
    const rule = puzzle.bank.find((r) => r.id === puzzle.rule);
    assert.deepEqual(mismatchingRows(rule, puzzle.examples), []);
    assert.equal(puzzle.examples.length, filterNeeds(puzzle));
    assert.ok(choicesFor(puzzle).includes(answerOf(puzzle)));
    // One example never settles it: there is always a chance to beat the filter.
    assert.ok(new Set(fittingRules(puzzle.examples.slice(0, 1), puzzle.bank).map((r) => r.apply(puzzle.query).join(" "))).size > 1);
  }
  assert.equal(maxPoints, 12);
});

test("answering earlier scores more, a tie scores 1, and streaks count consecutive right answers", () => {
  assert.equal(puzzlePoints(1, 3, true), 3);
  assert.equal(puzzlePoints(2, 3, true), 2);
  assert.equal(puzzlePoints(3, 3, true), 1);
  assert.equal(puzzlePoints(1, 3, false), 0);
  assert.deepEqual([12, 8, 7, 5, 4, 2, 1].map(gpt3Stars), [3, 3, 2, 2, 1, 1, 0]);
  assert.equal(longestStreak([true, true, false, true]), 2);
  assert.equal(longestStreak([]), 0);
});
