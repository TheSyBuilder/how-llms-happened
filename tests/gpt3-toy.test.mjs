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
new Function("require", "exports", outputText)(createRequire(import.meta.url), compiled);
const { patternRules, promptExamples, fittingRules, mismatchingRows } = compiled;

test("an ambiguous example leaves multiple continuations until a distinguishing pair arrives", () => {
  for (const set of ["swap", "first"]) {
    assert.equal(fittingRules(promptExamples(set, 0)).length, 4);
    assert.equal(fittingRules(promptExamples(set, 1)).length, 4);
    for (const count of [2, 3]) {
      const rules = fittingRules(promptExamples(set, count));
      assert.deepEqual(rules.map(rule => rule.id), [set]);
      assert.deepEqual(rules[0].apply(["blue", "gold"]), set === "swap" ? ["gold", "blue"] : ["blue", "blue"]);
    }
  }
});

test("switching or removing demonstrations changes the answer without changing the rule bank", () => {
  const snapshot = patternRules.map(rule => ({ id: rule.id, output: rule.apply(["blue", "gold"]) }));
  for (const set of ["first", "swap", "first"]) fittingRules(promptExamples(set, 3));
  assert.equal(fittingRules([]).length, 4);
  assert.deepEqual(patternRules.map(rule => ({ id: rule.id, output: rule.apply(["blue", "gold"]) })), snapshot);
});

test("contradictory demonstrations leave no valid rule rather than inventing an answer", () => {
  for (const set of ["swap", "first"]) {
    assert.equal(fittingRules(promptExamples(set, 3, true)).length, 0);
    assert.equal(fittingRules(promptExamples(set, 2, true)).length, 1);
  }
});

test("one distinguishing example can specify any of the four rules", () => {
  for (const rule of patternRules) {
    const input = ["red", "blue"];
    assert.deepEqual(fittingRules([{ input, output: rule.apply(input) }]).map(fit => fit.id), [rule.id]);
  }
  assert.equal(fittingRules([{ input: ["red", "red"], output: ["red", "red"] }]).length, 4);
  assert.equal(fittingRules([{ input: ["red", "blue"], output: ["gold", "gold"] }]).length, 0);
});

test("disagreement rows identify conflicting evidence without changing the examples", () => {
  const examples = promptExamples("swap", 3, true);
  examples[0] = { input: ["red", "blue"], output: ["red", "red"] };
  const snapshot = structuredClone(examples);
  assert.deepEqual(mismatchingRows(patternRules.find(rule => rule.id === "swap"), examples), [1, 3]);
  assert.deepEqual(mismatchingRows(patternRules.find(rule => rule.id === "first"), examples), [2, 3]);
  assert.deepEqual(mismatchingRows(patternRules[0], []), []);
  assert.deepEqual(examples, snapshot);
});
