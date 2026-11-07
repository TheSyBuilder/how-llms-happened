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
new Function("require", "exports", outputText)(createRequire(import.meta.url), compiled);
const { countCompletions, compareContexts } = compiled;
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

test("changing a right clue leaves the left-only guesses fixed while changing the combined guess", () => {
  const sky = compareContexts("metal", "sky");
  const lake = compareContexts("metal", "lake");
  assert.deepEqual(sky.left, lake.left);
  assert.equal(sky.both.predictions.find(entry => entry.word === "plane").probability, 1);
  assert.equal(lake.both.predictions.find(entry => entry.word === "boat").probability, 1);
  assert.deepEqual(compareContexts("hungry", "sky").right, sky.right);
});

test("the comparison keeps ambiguity when both clues still allow two answers", () => {
  const views = compareContexts("little", "sky");
  assert.equal(views.left.matches.length, 4);
  assert.equal(views.right.matches.length, 4);
  assert.equal(views.both.matches.length, 2);
  assert.deepEqual(views.both.predictions.filter(entry => entry.probability > 0).map(entry => [entry.word, entry.probability]), [["bird", 0.5], ["plane", 0.5]]);
});
