import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "./helpers/component-require.mjs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/components/Gpt2Toy.tsx", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, jsxImportSource: "preact" },
});
const compiled = {};
new Function("require", "exports", outputText)(createRequire(import.meta.url), compiled);
const { matchContinuations, continuationSnippets, nextWordChoices } = compiled;

test("a prompt cue narrows the same frozen snippets to a task format", () => {
  const original = structuredClone(continuationSnippets);
  for (const [cue, format] of [["Then", "Story"], ["TL;DR:", "Summary"], ["Q: Who found the cat? A:", "Answer"]]) {
    const result = matchContinuations(cue);
    assert.equal(result.matches.length, 2);
    assert.ok(result.matches.every((entry) => entry.format === format));
    assert.equal(result.formats.find((entry) => entry.format === format).share, 1);
  }
  assert.deepEqual(continuationSnippets, original);
});

test("removing the cue admits every format; normalised cues still work", () => {
  const result = matchContinuations(" \n ");
  assert.equal(result.matches.length, 6);
  assert.ok(result.formats.every((entry) => entry.count === 2 && entry.share === 1 / 3));
  assert.equal(matchContinuations("  tl;dr:  ").matches.length, 2);
  assert.equal(matchContinuations("Q:  who found the cat?\n A:").matches.length, 2);
});

test("unfamiliar and partial cues produce no invented answer or invalid shares", () => {
  for (const cue of ["In a nutshell:", "Then write a summary", "TL;", "<script>"]) {
    const result = matchContinuations(cue);
    assert.deepEqual(result.matches, []);
    assert.ok(result.formats.every((entry) => entry.count === 0 && entry.share === 0));
  }
});

test("next words depend on both the cue and the words already written", () => {
  assert.deepEqual(nextWordChoices("", []).choices, [
    { word: "the", count: 1 }, { word: "Mira", count: 3 },
    { word: "A", count: 1 }, { word: "Mira.", count: 1 },
  ]);
  assert.deepEqual(nextWordChoices("", ["Mira"]).choices, [
    { word: "made", count: 1 }, { word: "took", count: 1 }, { word: "found", count: 1 },
  ]);
  assert.deepEqual(nextWordChoices("TL;DR:", ["Mira"]), { count: 1, choices: [{ word: "took", count: 1 }] });
  assert.deepEqual(nextWordChoices("Then", ["Mira"]), { count: 1, choices: [{ word: "made", count: 1 }] });
});

test("every builder path ends at a fixed snippet and impossible prefixes stay empty", () => {
  for (const snippet of continuationSnippets) {
    const words = snippet.text.split(" ");
    for (let index = 0; index < words.length; index++) {
      const step = nextWordChoices(snippet.cue, words.slice(0, index));
      assert.ok(step.choices.some(({ word }) => word === words[index]));
      assert.equal(step.choices.reduce((sum, choice) => sum + choice.count, 0), step.count);
    }
    assert.deepEqual(nextWordChoices(snippet.cue, words), { count: 1, choices: [] });
  }
  assert.deepEqual(nextWordChoices("In a nutshell:", []), { count: 0, choices: [] });
  assert.deepEqual(nextWordChoices("Then", ["Mira."]), { count: 0, choices: [] });
});
