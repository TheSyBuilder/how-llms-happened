import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/components/PretrainingToy.tsx", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, jsxImportSource: "preact" },
});
const compiled = {};
new Function("require", "exports", outputText)(createRequire(import.meta.url), compiled);
const { learnReviews, reviews } = compiled;
const probability = (learner, word) => learner.predictions.find((entry) => entry.word === word).positive;

test("reading alone does not assign review labels", () => {
  for (const readFirst of [false, true]) {
    assert.ok(learnReviews(0, readFirst).predictions.every((entry) => entry.positive === 0.5));
  }
});

test("two labels transfer to unlabelled words only after reading", () => {
  const scratch = learnReviews(2, false);
  const pretrained = learnReviews(2, true);
  for (const [word, positive] of [["splendid", true], ["awful", false]]) {
    assert.ok(probability(scratch, word) > 0.4 && probability(scratch, word) < 0.6);
    assert.ok(positive ? probability(pretrained, word) > 0.9 : probability(pretrained, word) < 0.1);
    const index = pretrained.predictions.findIndex((entry) => entry.word === word);
    assert.equal(pretrained.embeddings[index], pretrained.afterReading[index]);
  }
  assert.notEqual(pretrained.embeddings[0], pretrained.afterReading[0], "fine-tuning updates the shared representation of labelled words");
});

test("both learners can learn the full labelled set without leaking between runs", () => {
  for (const readFirst of [false, true]) {
    const all = learnReviews(8, readFirst);
    for (const review of reviews) {
      assert.ok(review.positive ? probability(all, review.word) > 0.9 : probability(all, review.word) < 0.1);
    }
    assert.deepEqual(learnReviews(2, readFirst), learnReviews(2, readFirst));
    assert.ok(learnReviews(0, readFirst).predictions.every((entry) => entry.positive === 0.5));
  }
});
