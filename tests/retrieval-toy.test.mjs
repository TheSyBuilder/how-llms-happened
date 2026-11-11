import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "./helpers/component-require.mjs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/components/RetrievalToy.tsx", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, jsxImportSource: "preact" },
});
const compiled = {};
new Function("require", "exports", outputText)(createRequire(import.meta.url), compiled);
const { library, retrieve, readOpeningTime, rankPassages } = compiled;

test("library edits change the sourced answer; a new question retrieves a different notice", () => {
  const edited = library.map(p => ({ ...p, text: p.id === "a" ? "Moss Museum opens at 12:00." : p.text }));
  const read = (subject, passages) => readOpeningTime(subject, retrieve(subject, passages, 1));
  assert.equal(read("Moss Museum", library).time, "10:00");
  assert.equal(read("Moss Museum", edited).time, "12:00");
  assert.equal(read("Fern Cafe", edited).time, "08:00");
  assert.deepEqual(read("Fern Cafe", edited).evidence, [{ id: "b", time: "08:00" }]);
  assert.equal(library[0].text, "Moss Museum opens at 10:00.");
});

test("excluded, irrelevant, empty, or unparseable evidence cannot supply an opening time", () => {
  const excluded = library.map(p => ({ ...p, enabled: p.id !== "a" }));
  const found = retrieve("Moss Museum", excluded, 2);
  assert.deepEqual(found.map(p => p.id), ["c"]);
  assert.equal(readOpeningTime("Moss Museum", found).status, "missing");
  for (const text of ["", "Moss Museum opens at 25:00.", "Moss Museum opens at 12:99.", "Fern Cafe opens at 08:00.", "Moss Museum has a fern garden."]) {
    const result = readOpeningTime("Moss Museum", [{ id: "a", text }]);
    assert.equal(result.status, "missing");
    assert.equal(result.time, null);
  }
  assert.deepEqual(retrieve("Unknown Place", library, 2), []);
  assert.deepEqual(retrieve("Moss Museum", library.map(p => ({ ...p, enabled: false })), 2), []);
});

test("reading more passages reveals conflicting times instead of silently choosing one", () => {
  const conflicting = library.map(p => ({ ...p, text: p.id === "c" ? "Moss Museum opens at 03:00." : p.text }));
  assert.deepEqual(retrieve("Moss Museum", conflicting, 2).map(p => p.id), ["a", "c"]);
  assert.equal(readOpeningTime("Moss Museum", retrieve("Moss Museum", conflicting, 1)).time, "10:00");
  const conflict = readOpeningTime("Moss Museum", retrieve("Moss Museum", conflicting, 2));
  assert.equal(conflict.status, "conflict");
  assert.equal(conflict.time, null);
  assert.deepEqual(conflict.evidence, [{ id: "a", time: "10:00" }, { id: "c", time: "03:00" }]);
  conflicting[2].text = "moss museum opens at 10:00.";
  assert.equal(readOpeningTime("Moss Museum", retrieve("Moss Museum", conflicting, 2)).status, "answer");
});

test("a changed search can hide an available answer without changing the question", () => {
  const one = retrieve("fern", library, 1);
  const two = retrieve("fern", library, 2);
  assert.deepEqual(one.map(p => p.id), ["b"]);
  assert.deepEqual(two.map(p => p.id), ["b", "c"]);
  assert.equal(readOpeningTime("Moss Museum", two).status, "missing");
  assert.equal(readOpeningTime("Fern Cafe", one).time, "08:00");
  assert.equal(readOpeningTime("Moss Museum", retrieve("Moss Museum", library, 1)).time, "10:00");
});

test("repetition cannot boost a notice and an excluded high match cannot reach the reader", () => {
  const edited = library.map(p => ({ ...p,
    enabled: p.id !== "a",
    text: p.id === "c" ? "Moss moss moss museum museum has a garden." : p.text,
  }));
  assert.deepEqual(rankPassages("MOSS, museum museum!", edited).map(p => [p.id, p.score]), [["c", 2], ["b", 0], ["a", 2]]);
  assert.deepEqual(retrieve("MOSS, museum museum!", edited, 2).map(p => p.id), ["c"]);
  for (const search of ["", "   ", "?!"]) {
    assert.deepEqual(retrieve(search, library, 2), []);
    assert.ok(rankPassages(search, library).every(p => p.score === 0));
  }
});
