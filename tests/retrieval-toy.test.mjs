import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "./helpers/component-require.mjs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/components/RetrievalToy.tsx", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, jsxImportSource: "preact" },
});
const base = createRequire(import.meta.url);
// Styles and the game kit are browser-only; the logic under test never calls them.
const stub = id => id.endsWith(".css") ? {} : id.includes("/game/") ? { default: () => null } : id.endsWith("/lib/progress") ? { markPlayed() {} } : base(id);
const compiled = {};
new Function("require", "exports", outputText)(stub, compiled);
const { library, retrieve, readOpeningTime, rankPassages, parseTime, askLibrary, canEdit, changedPages, poisonStars, retrievalResult } = compiled;
const withText = (changes) => library.map(p => ({ ...p, text: changes[p.id] ?? p.text }));

test("opening times parse H:MM, HH:MM, dotted times and am/pm; ambiguous or impossible times do not", () => {
  const cases = { "9:00": "09:00", "09:30": "09:30", "10.30": "10:30", "9:30 am": "09:30", "9am": "09:00", "9 AM": "09:00", "12pm": "12:00", "12 am": "00:00", "7:15 pm": "19:15", "23:59": "23:59" };
  for (const [raw, time] of Object.entries(cases)) assert.equal(parseTime(raw), time, raw);
  for (const raw of ["9", "25:00", "12:99", "13pm", "0am", "noon", "", "9:5"]) assert.equal(parseTime(raw), null, raw);
  for (const [text, time] of [["Moss Museum opens at 9:00.", "09:00"], ["Moss Museum opens at 10.30.", "10:30"], ["Moss Museum opens at 9 a.m. Free entry.", "09:00"], ["Moss Museum opens at 9:30 am", "09:30"]]) {
    assert.deepEqual(readOpeningTime("Moss Museum", [{ id: "a", text }]), { status: "answer", time, evidence: [{ id: "a", time }] }, text);
  }
  assert.equal(readOpeningTime("Moss Museum", [{ id: "a", text: "Moss Museum opens at 10am." }, { id: "b", text: "Moss Museum opens at 10:00." }]).status, "answer");
});

test("the untouched library answers correctly from the FAQ and the official notice", () => {
  assert.deepEqual(rankPassages("When does Moss Museum open?", library).map(p => [p.id, p.score]), [["b", 5], ["a", 2], ["d", 2], ["e", 1], ["c", 0]]);
  const { found, result, verdict } = askLibrary(library);
  assert.deepEqual(found.map(p => p.id), ["b", "a"]);
  assert.equal(result.time, "10:00");
  assert.equal(verdict, "correct");
  assert.equal(library[0].text, "Moss Museum opens at 10:00.");
});

test("a planted page must out-match the notice to fool the reader; a tie keeps the earlier letter", () => {
  assert.equal(askLibrary(withText({ d: "Moss Museum opens at 9:00." })).verdict, "correct");
  assert.equal(askLibrary(withText({ d: "Moss Museum opens at 9:00.", e: "Moss Museum opens at 9:00." })).verdict, "correct");
  const fooled = askLibrary(withText({ d: "When does Moss Museum open? Moss Museum opens at 7:00." }));
  assert.equal(fooled.verdict, "fooled");
  assert.equal(fooled.result.time, "07:00");
  assert.deepEqual(fooled.found.map(p => p.id), ["b", "d"]);
  // Out-matching the notice without a readable time hides the answer rather than replacing it.
  assert.equal(askLibrary(withText({ c: "When does Moss Museum open? It opens at noon." })).verdict, "missing");
});

test("reading conflicting or missing evidence declines instead of guessing", () => {
  assert.equal(askLibrary(withText({ b: "When does Moss Museum open? Moss Museum opens at 7:00." })).verdict, "conflict");
  assert.equal(askLibrary(withText({ d: "When does Moss Museum open? It is lovely.", e: "When does Moss Museum open? Ask inside." })).verdict, "missing");
  for (const text of ["", "Moss Museum opens at 25:00.", "Fern Cafe opens at 08:00.", "Moss Museum has a fern garden."]) assert.equal(readOpeningTime("Moss Museum", [{ id: "a", text }]).status, "missing");
  for (const search of ["", "   ", "?!"]) assert.deepEqual(retrieve(search, library, 2), []);
});

test("the fix works by making the official notice retrievable again", () => {
  const poisoned = { d: "When does Moss Museum open? Moss Museum opens at 7:00." };
  assert.equal(askLibrary(withText({ ...poisoned, a: "When does Moss Museum open? Moss Museum opens at 10:00." })).verdict, "correct");
  assert.equal(askLibrary(withText({ ...poisoned, b: "When does Moss Museum open? Moss Museum opens at 10:00." })).verdict, "conflict");
  const both = { d: poisoned.d, e: "When does Moss Museum open? Moss Museum opens at 6am." };
  assert.equal(askLibrary(withText({ ...both, a: "When does Moss Museum open? Moss Museum opens at 10 am." })).verdict, "correct");
});

test("edit rules, counts, stars and the share result", () => {
  const [a, , c] = library;
  assert.equal(canEdit("poison", a), false);
  assert.equal(canEdit("poison", c), true);
  assert.equal(canEdit("fix", a), true);
  assert.equal(canEdit("fix", c), false);
  assert.equal(canEdit("done", c), false);
  const edited = withText({ c: "x", d: "y", a: "z" });
  assert.equal(changedPages(edited, "web"), 2);
  assert.equal(changedPages(edited, "museum"), 1);
  assert.deepEqual([0, 1, 2, 3, 4].map(poisonStars), [0, 3, 2, 1, 1]);
  const one = retrievalResult(1, 1, "07:00");
  assert.equal(one.headline, "I fooled RAG in 1 edit.");
  assert.equal(one.stars, 3);
  assert.match(one.detail, /07:00/);
  assert.equal(retrievalResult(2, 2, "06:00").headline, "I fooled RAG in 2 edits.");
});
