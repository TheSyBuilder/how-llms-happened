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
new Function("require", "exports", outputText)(
  createRequire(import.meta.url),
  compiled,
);
const { attend } = compiled;

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
