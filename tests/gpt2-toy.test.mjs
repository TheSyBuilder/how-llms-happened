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
const { matchContinuations, continuationSnippets } = compiled;

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
