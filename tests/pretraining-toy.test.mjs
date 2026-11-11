import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "./helpers/component-require.mjs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/components/PretrainingToy.tsx", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, jsxImportSource: "preact" },
});
const compiled = {};
const base = createRequire(import.meta.url);
// The game kit and stylesheets are browser-only; the learners do not need them.
new Function("require", "exports", outputText)((id) => /\.css$|\/game\/|\/lib\/progress$/.test(id) ? {} : base(id), compiled);
const { learnReviews, learnFromLabels, reviews, defaultReadingEndings, words, misleadingEndings, allRight, verdict, labelsNeeded, pretrainingStars } = compiled;
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

test("a misleading reading clue transfers until a review label teaches that word directly", () => {
  const endings = [...defaultReadingEndings];
  endings[2] = "sigh"; // splendid now reads like the negative examples, but keeps its positive review label.
  const before = [...endings];
  assert.ok(probability(learnReviews(2, true, endings), "splendid") < 0.1);
  assert.ok(probability(learnReviews(6, true, endings), "splendid") > 0.9);
  assert.deepEqual(learnReviews(2, false, endings), learnReviews(2, false));
  assert.ok(learnReviews(0, true, endings).predictions.every((entry) => entry.positive === 0.5));
  assert.deepEqual(endings, before, "training must not mutate the reader's sentence edits");
  assert.equal(defaultReadingEndings[2], "smile", "restoring the default must recover the original reading");
  assert.ok(probability(learnReviews(2, true), "splendid") > 0.9);
});

test("with one misleading sentence, the misled word plus one label per group teaches the reader every review", () => {
  for (let misled = 0; misled < 8; misled++) {
    const endings = misleadingEndings(misled);
    assert.equal(endings.filter((ending, i) => ending !== defaultReadingEndings[i]).length, 1);
    const word = words[misled];
    const positive = words.find((w, i) => i !== misled && reviews.find((r) => r.word === w).positive);
    const negative = words.find((w, i) => i !== misled && !reviews.find((r) => r.word === w).positive);
    assert.ok(allRight(learnFromLabels([word, positive, negative], true, endings)), word);
    // The reader carries the misleading clue: without its label, the misled word is confidently wrong.
    const reader = learnFromLabels([positive, negative], true, endings);
    assert.equal(verdict(word, reader.predictions[misled].positive), "wrong");
    assert.ok(allRight(learnFromLabels(words, true, endings)));
    // From scratch nothing transfers: every review needs its own label, whatever the order.
    assert.equal(labelsNeeded([], false, endings), 8);
    assert.equal(labelsNeeded([word, positive, negative], false, endings), 8);
  }
});

test("labels in click order match the fixed-order trainer and never count as right without teaching", () => {
  assert.deepEqual(learnFromLabels(reviews.slice(0, 4).map((r) => r.word), true), learnReviews(4, true));
  assert.ok(!allRight(learnFromLabels([], true)));
  assert.equal(verdict("splendid", 0.5), "unsure");
  assert.equal(verdict("splendid", 0.85), "right");
  assert.equal(verdict("awful", 0.85), "wrong");
});

test("stars reward the fewest labels", () => {
  assert.deepEqual([2, 3, 4, 5, 6, 7, 8].map(pretrainingStars), [3, 3, 2, 1, 1, 0, 0]);
});
