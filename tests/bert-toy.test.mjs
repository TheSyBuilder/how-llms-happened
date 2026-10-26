import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/components/BertToy.tsx", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, jsxImportSource: "preact" },
});
const compiled = {};
new Function("require", "exports", outputText)(createRequire(import.meta.url), compiled);
const { countCompletions } = compiled;
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
