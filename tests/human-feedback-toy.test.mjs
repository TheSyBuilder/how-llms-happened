import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "./helpers/component-require.mjs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/components/HumanFeedbackToy.tsx", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, jsxImportSource: "preact" },
});
const base = createRequire(import.meta.url);
const stub = id => id.endsWith(".css") ? {} : id.includes("/game/") ? { default: () => null } : id.endsWith("/lib/progress") ? { markPlayed() {} } : base(id);
const compiled = {};
new Function("require", "exports", outputText)(stub, compiled);
const { candidates, comparisons, deck, testSet, learnPreferences, fitJudge, difference, rewardScore, testJudge, testScore, judgeStars, feedbackResult } = compiled;
const train = picks => fitJudge(picks.map(([card, choice]) => difference(deck[card], choice)));

test("two clicks teach a style judge that rates the Moon answer exactly as high as the truth", () => {
  assert.deepEqual(learnPreferences([null, null]), [0, 0, 0]);
  for (const choices of [["a", "a"], ["b", "b"], ["a", "b"], ["b", "a"], ["a", null]]) {
    const weights = learnPreferences(choices);
    assert.equal(weights[2], 0, "truth never varies in the rain pairs");
    assert.equal(rewardScore(weights, candidates[0].features), rewardScore(weights, candidates[2].features));
  }
  const weights = learnPreferences(["a", "a"]);
  assert.ok(weights[0] > 0 && weights[1] > 0);
  for (const pair of comparisons) assert.ok(rewardScore(weights, pair.a.features) > rewardScore(weights, pair.b.features));
  assert.equal(testScore(weights), 3);
});

test("refitting from zero means the same picks always give the same judge", () => {
  const picks = [[0, "a"], [5, "a"], [6, "a"], [7, "a"]];
  assert.deepEqual(train(picks), train(picks));
  const positive = learnPreferences(["a", "a"]), reversed = learnPreferences(["b", "b"]);
  for (let i = 0; i < 3; i++) assert.ok(Math.abs(positive[i] + reversed[i]) < 1e-12);
});

test("confounded comparisons teach style along with truth and fail the hard test pairs", () => {
  const confounded = train([[0, "a"], [1, "a"], [2, "a"], [3, "a"]]);
  assert.ok(confounded[0] > 0 && confounded[1] > 0 && confounded[2] > 0);
  const verdicts = testJudge(confounded);
  assert.equal(verdicts[5], "wrong", "the plain false answer beats the long technical truth");
  assert.ok(testScore(confounded) < 8);
});

test("pairs where truth and style disagree, mixed with plain ones, can earn a perfect score", () => {
  const perfect = train([[0, "a"], [1, "a"], [2, "a"], [5, "a"]]);
  assert.ok(perfect[2] > perfect[0] + perfect[1]);
  assert.deepEqual(testJudge(perfect), Array(8).fill("right"));
  // Over-correcting teaches the judge to dislike clear writing and costs the style test pairs.
  const overCorrected = train([[4, "a"], [5, "a"], [6, "a"], [7, "a"]]);
  assert.ok(overCorrected[0] <= 0 && overCorrected[1] <= 0);
  assert.ok(testScore(overCorrected) < 8);
  // Teaching the lie as the better answer turns the judge against the truth.
  assert.ok(train([[4, "b"], [5, "b"], [6, "b"], [7, "b"]])[2] < 0);
});

test("the test set, stars and share result", () => {
  for (const pair of [...deck, ...testSet]) assert.ok(pair.a.text && pair.b.text && pair.prompt);
  assert.deepEqual([0, 4, 5, 6, 7, 8].map(judgeStars), [0, 0, 1, 1, 2, 3]);
  const result = feedbackResult(8, 3);
  assert.equal(result.headline, "My judge picked right 8 / 8 times.");
  assert.equal(result.stars, 3);
  assert.deepEqual(result.score, { value: 8, max: 8, label: "Hidden test" });
  assert.match(result.shareText, /8\/8/);
});
