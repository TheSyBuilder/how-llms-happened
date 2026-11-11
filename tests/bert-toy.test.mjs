import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "./helpers/component-require.mjs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/components/BertToy.tsx", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, jsxImportSource: "preact" },
});
const compiled = {};
const base = createRequire(import.meta.url);
// The game kit and stylesheets are browser-only; the clue logic does not need them.
new Function("require", "exports", outputText)((id) => /\.css$|\/game\/|\/lib\/progress$/.test(id) ? {} : base(id), compiled);
const { countCompletions, rounds, nearestFirst, stillFits, readers, pointsFor, fewestClues, maxPoints, bertStars } = compiled;
const possible = (left, right) => countCompletions(left, right).predictions.filter((entry) => entry.count > 0).map((entry) => entry.word);

test("left and right clues jointly distinguish words that either side leaves ambiguous", () => {
  assert.deepEqual(possible("metal", null), ["plane", "boat"]);
  assert.deepEqual(possible(null, "sky"), ["bird", "plane"]);
  assert.deepEqual(possible("metal", "sky"), ["plane"]);
  assert.deepEqual(possible("metal", "lake"), ["boat"]);
  assert.deepEqual(possible("hungry", "lake"), ["fish"]);
});

test("hiding context restores ambiguity, including with both little and sky visible", () => {
  assert.deepEqual(possible("little", "sky"), ["bird", "plane"]);
  const noClues = countCompletions(null, null);
  assert.equal(noClues.matches.length, 8);
  assert.ok(noClues.predictions.every((entry) => entry.probability === 0.25));
});

test("all supported clue choices have matches and conserve the displayed shares", () => {
  for (const left of [null, "little", "metal", "hungry"]) {
    for (const right of [null, "sky", "lake"]) {
      const result = countCompletions(left, right);
      assert.ok(result.matches.length > 0);
      assert.equal(result.predictions.reduce((sum, entry) => sum + entry.count, 0), result.matches.length);
      assert.equal(result.predictions.reduce((sum, entry) => sum + entry.probability, 0), 1);
    }
  }
});

test("every round ends on its answer, and the left side alone usually leaves doubt", () => {
  assert.equal(rounds.length, 5);
  for (const round of rounds) {
    assert.equal(round.choices.length, 4);
    assert.ok(round.choices.includes(round.answer));
    assert.deepEqual(readers(round).bothWays, [round.answer]);
    for (const clue of [...round.left, ...round.right]) if (clue.fits) assert.ok(clue.fits.includes(round.answer));
  }
  assert.deepEqual(rounds.map((round) => readers(round).leftOnly.length), [2, 4, 4, 2, 1]);
  assert.deepEqual(rounds.map(fewestClues), [2, 1, 1, 2, 2]);
  assert.equal(maxPoints, 12);
});

test("clues reveal nearest the gap first and combine across sides", () => {
  const [metal, socks] = rounds;
  assert.equal(nearestFirst(rounds[4], "left")[0].text, "old");
  assert.deepEqual(stillFits(metal, [metal.left[0]]), ["plane", "boat"]);
  assert.deepEqual(stillFits(metal, [metal.right[0]]), ["bird", "plane"]);
  assert.deepEqual(stillFits(metal, [metal.left[0], metal.right[0]]), ["plane"]);
  assert.deepEqual(readers(socks).leftOnly, socks.choices);
  assert.deepEqual(stillFits(socks, [socks.right[0]]), ["socks"]);
});

test("fewer clues score more, a wrong guess scores nothing, and three stars need near-perfect reads", () => {
  assert.deepEqual([1, 2, 3, 4].map((n) => pointsFor(n, true)), [3, 2, 1, 1]);
  assert.equal(pointsFor(1, false), 0);
  assert.deepEqual([12, 11, 10, 8, 7, 4, 3].map(bertStars), [3, 3, 2, 2, 1, 1, 0]);
});
