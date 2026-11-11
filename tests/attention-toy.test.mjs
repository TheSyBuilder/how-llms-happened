import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "./helpers/component-require.mjs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(
  new URL("../src/components/AttentionToy.tsx", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
    jsxImportSource: "preact",
  },
});
const compiled = {};
const base = createRequire(import.meta.url);
// The game kit and stylesheets are browser-only; the pure puzzle logic does not need them.
new Function("require", "exports", outputText)(
  (id) => /\.css$|\/game\/|\/lib\/progress$/.test(id) ? {} : base(id),
  compiled,
);
const { attend, puzzles, fewestMoves, bestMoves, isSolved, puzzleStars, attentionStars, attentionHeadline, attentionShare, DIAL_STEP } = compiled;

test("changing the query changes the strongest read and the mixed output", () => {
  const actions = attend(0, 2, false);
  const things = attend(100, 2, false);
  assert.equal(actions.weights.indexOf(Math.max(...actions.weights)), 2);
  assert.equal(things.weights.indexOf(Math.max(...things.weights)), 1);
  assert.ok(things.mixture > actions.mixture);
});

test("masking removes future information and renormalizes the visible read", () => {
  for (const position of [0, 2, 5]) {
    const { weights, mixture } = attend(80, position, true);
    assert.ok(weights.slice(position + 1).every((weight) => weight === 0));
    assert.ok(Math.abs(weights.reduce((a, b) => a + b, 0) - 1) < 1e-12);
    assert.ok(mixture >= 0 && mixture <= 1);
  }
  assert.deepEqual(attend(80, 0, true).weights, [1, 0, 0, 0, 0, 0]);
  assert.equal(attend(80, 0, true).mixture, 0);
});

test("the last position's causal read equals an unmasked read", () => {
  assert.deepEqual(attend(35, 5, true), attend(35, 5, false));
});

test("the summary keeps every tied winner, including equal visible matches", () => {
  assert.deepEqual(attend(50, 2, false).strongestPositions, [1, 2]);
  assert.deepEqual(attend(0, 1, true).strongestPositions, [0, 1]);
  assert.deepEqual(attend(80, 0, true).strongestPositions, [0]);
});

test("word contributions explain the read and exclude hidden values", () => {
  const open = attend(100, 2, false);
  assert.equal(open.contributions[1], open.weights[1]);
  assert.equal(open.contributions[5], open.weights[5]);
  assert.equal(open.contributions[2], 0);
  assert.equal(open.mixture, open.contributions[1] + open.contributions[5]);
  const masked = attend(100, 2, true);
  assert.equal(masked.contributions[5], 0);
  assert.equal(masked.mixture, masked.contributions[1]);
  // Hiding a word excludes its match; it does not change its key or query.
  assert.deepEqual(masked.matches, open.matches);
  assert.deepEqual(masked.query, [1, 0]);
});

test("every puzzle starts unsolved, is solvable on the dial, and has a known fewest-moves answer", () => {
  assert.equal(puzzles.length, 5);
  assert.deepEqual(bestMoves, [2, 4, 4, 5, 4]);
  for (const puzzle of puzzles) {
    assert.equal(isSolved(puzzle, puzzle.start), false);
    assert.equal(puzzle.start.direction % DIAL_STEP, 0);
    assert.equal(fewestMoves(puzzle), bestMoves[puzzles.indexOf(puzzle)]);
  }
});

test("puzzle goals follow the attention read, including the causal mask", () => {
  const [future, onSat, satCat, readOn, theCat] = puzzles;
  assert.ok(isSolved(future, { position: 0, direction: 60, causal: true }));
  assert.ok(!isSolved(future, { position: 0, direction: 60, causal: false }));
  assert.ok(isSolved(onSat, { position: 3, direction: 40, causal: false }));
  assert.ok(!isSolved(onSat, { position: 3, direction: 60, causal: false }));
  // 60% on "cat" needs both a things-seeking query and the mask; neither alone is enough.
  assert.ok(isSolved(satCat, { position: 2, direction: 100, causal: true }));
  assert.ok(!isSolved(satCat, { position: 2, direction: 100, causal: false }));
  assert.ok(!isSolved(satCat, { position: 2, direction: 80, causal: true }));
  assert.ok(isSolved(readOn, { position: 3, direction: 80, causal: false }));
  assert.ok(!isSolved(readOn, { position: 3, direction: 80, causal: true }));
  assert.ok(isSolved(theCat, { position: 4, direction: 100, causal: true }));
  assert.ok(!isSolved(theCat, { position: 4, direction: 100, causal: false }));
});

test("stars reward the fewest moves and a skip caps the run", () => {
  assert.equal(puzzleStars(4, 4), 3);
  assert.equal(puzzleStars(6, 4), 2);
  assert.equal(puzzleStars(7, 4), 1);
  assert.equal(puzzleStars(null, 4), 0);
  const perfect = bestMoves.map((best) => ({ moves: best, best }));
  assert.equal(attentionStars(perfect), 3);
  assert.equal(attentionStars(perfect.map((r, i) => i < 2 ? { ...r, moves: r.best + 1 } : r)), 3);
  assert.equal(attentionStars(perfect.map((r) => ({ ...r, moves: r.best + 1 }))), 2);
  assert.equal(attentionStars(perfect.map((r) => ({ ...r, moves: r.best + 2 }))), 1);
  assert.equal(attentionStars(perfect.map((r, i) => i === 0 ? { ...r, moves: null } : r)), 1);
  assert.equal(attentionStars(perfect.map((r) => ({ ...r, moves: null }))), 0);
  assert.equal(attentionHeadline(perfect), "All 5 attention puzzles in 19 moves, the fewest possible.");
  assert.equal(attentionHeadline(perfect.map((r) => ({ ...r, moves: r.best + 1 }))), "5 attention puzzles in 24 moves, 5 over the best.");
  assert.match(attentionShare(perfect), /in 19 moves\. The fewest possible is 19\./);
});
