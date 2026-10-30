import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";
function load(name) {
  const source = readFileSync(new URL(`../src/components/${name}.tsx`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, jsxImportSource: "preact" } });
  const exports = {};
  new Function("require", "exports", outputText)(createRequire(import.meta.url), exports);
  return exports;
}
const { conversation, contextAnswer } = load("ConversationToy");
const { initialShapes, countVisibleCircles } = load("VisionToy");
test("the latest explicit user correction wins within the retained conversation", () => {
  assert.equal(contextAnswer(conversation("Kyoto", true), 4).answer, "We’re visiting Oslo.");
  assert.equal(contextAnswer(conversation("Lima", false), 4).answer, "We’re visiting Lima.");
  assert.equal(contextAnswer(conversation("Paris", true), 2).answer, "We’re visiting Oslo.");
});
test("removing context removes the answer rather than using hidden conversation state", () => {
  for (const count of [0, 1]) assert.equal(contextAnswer(conversation("Kyoto", true), count).answer, "Which city did you mean?");
  assert.equal(contextAnswer(conversation("Kyoto", false), 2).answer, "Which city did you mean?");
  assert.equal(contextAnswer(conversation("Kyoto", false), 4).answer, "We’re visiting Kyoto.");
});
test("assistant statements do not overwrite the toy user's explicit destination", () => {
  assert.equal(contextAnswer([{role:"You",text:"",destination:"Paris"},{role:"Assistant",text:"",destination:"Lima"}], 2).answer, "We’re visiting Paris.");
});
test("image input changes missing evidence into an exact count", () => {
  assert.deepEqual(countVisibleCircles(initialShapes, false, 3), {min:0,max:9,visible:0});
  assert.deepEqual(countVisibleCircles(initialShapes, true, 3), {min:4,max:4,visible:9});
  assert.equal(countVisibleCircles(initialShapes.map((v,i)=>i===0?!v:v), true, 3).min, 3);
});
test("hidden shapes cannot influence the reported range", () => {
  const before = countVisibleCircles(initialShapes, true, 1);
  assert.deepEqual(before, {min:2,max:8,visible:3});
  assert.deepEqual(countVisibleCircles(initialShapes.map((v,i)=>i>=3?!v:v), true, 1), before);
});
test("all-circle and no-circle pictures reach exact counts only when fully visible", () => {
  for (const value of [false,true]) {
    const shapes=Array(9).fill(value);
    assert.equal(countVisibleCircles(shapes,true,3).min, value?9:0);
    for (const rows of [1,2]) { const result=countVisibleCircles(shapes,true,rows); assert.equal(result.max-result.min,9-3*rows); }
  }
});
