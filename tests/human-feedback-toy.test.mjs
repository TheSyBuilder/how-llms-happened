import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/components/HumanFeedbackToy.tsx", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, jsxImportSource: "preact" },
});
const compiled = {};
new Function("require", "exports", outputText)(createRequire(import.meta.url), compiled);
const { candidates, comparisons, learnPreferences, rewardScore, responseProbabilities } = compiled;

test("comparisons teach a preference that transfers to a new prompt", () => {
  assert.deepEqual(learnPreferences([null, null]), [0, 0]);
  assert.deepEqual(responseProbabilities([0, 0], 5), [1 / 3, 1 / 3, 1 / 3]);
  const weights = learnPreferences(["a", "a"]);
  assert.ok(weights[0] > 0 && weights[1] > 0);
  for (const pair of comparisons) {
    assert.ok(rewardScore(weights, pair.a.features) > rewardScore(weights, pair.b.features));
  }
  assert.ok(responseProbabilities(weights, 2)[0] > 1 / 3);
  assert.ok(responseProbabilities(weights, 5)[0] > responseProbabilities(weights, 2)[0]);
  assert.deepEqual(responseProbabilities(weights, 0), [1 / 3, 1 / 3, 1 / 3]);
});

test("reversing choices reverses the learned taste; replacing a choice refits without accumulating clicks", () => {
  const positive = learnPreferences(["a", "a"]);
  const reversed = learnPreferences(["b", "b"]);
  for (let i = 0; i < 2; i++) assert.ok(Math.abs(positive[i] + reversed[i]) < 1e-12);
  assert.ok(responseProbabilities(reversed, 5)[1] > 0.99);
  const one = learnPreferences(["a", null]);
  assert.ok(one[0] > 0);
  assert.equal(one[1], 0);
  learnPreferences(["b", "b"]);
  assert.deepEqual(learnPreferences(["a", "a"]), positive);
  assert.deepEqual(learnPreferences([null, null]), [0, 0]);
});

test("the style-only proxy cannot distinguish a false answer with the same features", () => {
  for (const choices of [[null, null], ["a", "a"], ["b", "b"], ["a", "b"], ["b", "a"]]) {
    const weights = learnPreferences(choices);
    assert.equal(rewardScore(weights, candidates[0].features), rewardScore(weights, candidates[2].features));
    for (let strength = 0; strength <= 5; strength++) {
      const probabilities = responseProbabilities(weights, strength);
      assert.equal(probabilities[0], probabilities[2]);
      assert.ok(probabilities.every(p => p >= 0 && p <= 1 && Number.isFinite(p)));
      assert.ok(Math.abs(probabilities.reduce((sum, p) => sum + p, 0) - 1) < 1e-12);
    }
  }
});
