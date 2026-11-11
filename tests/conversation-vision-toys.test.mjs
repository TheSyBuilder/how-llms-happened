import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "./helpers/component-require.mjs";
import test from "node:test";
import ts from "typescript";
const base = createRequire(import.meta.url);
// Styles and the game kit are browser-only; the logic under test never calls them.
const stub = id => id.endsWith(".css") ? {} : id.includes("/game/") ? { default: () => null } : id.endsWith("/lib/progress") ? { markPlayed() {} } : base(id);
function load(name) {
  const source = readFileSync(new URL(`../src/components/${name}.tsx`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, jsxImportSource: "preact" } });
  const exports = {};
  new Function("require", "exports", outputText)(stub, exports);
  return exports;
}
const chatApi = load("ConversationToy");
const { chat, finalAnswer, smallestWindow, windowStars, chatResult, recall, messages, reply } = chatApi;
const best = ["trip", "pack", "rain", "name", "correction"];
const worst = ["name", "trip", "correction", "pack", "rain"];

test("the latest user correction wins while it is inside the window", () => {
  const turns = chat(worst, "Ada", 10);
  assert.equal(turns.length, 10);
  assert.deepEqual(recall(turns), { name: "Ada", destination: "Oslo" });
  assert.equal(finalAnswer(turns, 10, "Ada").text, "You’re Ada, and we’re going to Oslo.");
  assert.equal(finalAnswer(turns, 10, "Ada").remembered, true);
});

test("a small window forgets early facts, and a forgotten correction leaves the old plan", () => {
  const turns = chat(["name", "trip", "pack", "correction", "rain"], "Ada", 4);
  const final = finalAnswer(turns, 4, "Ada");
  assert.equal(final.remembered, false);
  assert.equal(final.text, "We’re going to Oslo. Sorry, what’s your name?");
  const stale = chat(["name", "trip", "rain", "correction", "pack"], "Ada", 10);
  assert.equal(finalAnswer(stale.slice(0, 6), 6, "Ada").text, "You’re Ada, and we’re going to Kyoto.");
  assert.equal(finalAnswer([], 4, "Ada").text, "Sorry, I don’t know your name or where we’re going.");
});

test("replies are written from the window and never carry the facts forward themselves", () => {
  const forgetful = chat(["trip", "name", "correction", "rain", "pack"], "Ada", 4);
  assert.equal(forgetful.at(-1).text, "Warm layers and a rain jacket.");
  assert.equal(chat(["trip", "name", "pack", "rain", "correction"], "Ada", 4)[5].text, "Light layers and comfy shoes.");
  assert.equal(chat(["trip", "name", "rain", "pack", "correction"], "Ada", 4)[7].text, "Pack for where? I’ve lost track.");
  assert.equal(reply("rain", []), "Where is “there”? I’ve lost track.");
  for (const turn of chat(worst, "Ada", 10)) if (turn.role === "Assistant") assert.ok(!/Ada|Oslo|Kyoto/.test(turn.text));
});

test("saying both facts last fits in the smallest window; saying them first needs the whole chat", () => {
  assert.equal(smallestWindow(chat(best, "Ada", 10), "Ada"), 4);
  assert.equal(smallestWindow(chat(worst, "Ada", 10), "Ada"), 10);
  assert.equal(finalAnswer(chat(best, "Ada", 4), 4, "Ada").remembered, true);
  assert.equal(smallestWindow(chat(["trip", "correction", "pack", "rain"], "Ada", 10), "Ada"), null);
});

test("stars reward the smallest window that still remembers; plurals read correctly", () => {
  assert.deepEqual([[4, true], [6, true], [8, true], [10, true], [4, false]].map(([s, r]) => windowStars(s, r)), [3, 2, 1, 1, 0]);
  assert.equal(messages(1), "1 message");
  assert.equal(messages(4), "4 messages");
  const win = chatResult(4, true, 4);
  assert.equal(win.headline, "It remembered both with a 4-message window.");
  assert.equal(win.stars, 3);
  assert.equal(chatResult(4, false, 6).stars, 0);
});

const vision = load("VisionToy");
const { pictures, pictureScore, textModelGuess, visionStars, visionResult, TILES } = vision;

test("each picture has nine described tiles, four choices and one right answer", () => {
  assert.equal(pictures.length, 3);
  for (const picture of pictures) {
    assert.equal(picture.tiles.length, TILES);
    assert.equal(picture.choices.length, 4);
    assert.ok(picture.choices.includes(picture.answer));
  }
});

test("fewer tiles earn more points; a wrong guess or no tiles earns none", () => {
  assert.equal(pictureScore(1, true), 8);
  assert.equal(pictureScore(3, true), 6);
  assert.equal(pictureScore(9, true), 0);
  assert.equal(pictureScore(2, false), 0);
  assert.equal(pictureScore(0, true), 0);
});

test("the text-only model guesses from the caption and is right only once", () => {
  const guesses = pictures.map(textModelGuess);
  assert.deepEqual(guesses.map((g, i) => g === pictures[i].answer), [false, true, false]);
  for (const picture of pictures) assert.equal(textModelGuess(picture), textModelGuess({ ...picture, tiles: [] }), "pixels never reach it");
});

test("stars and the share result", () => {
  assert.deepEqual([0, 7, 8, 17, 18, 21, 22, 24].map(visionStars), [0, 0, 1, 1, 2, 2, 3, 3]);
  const result = visionResult(22, 3, 5, 1);
  assert.equal(result.stars, 3);
  assert.match(result.headline, /3 \/ 3/);
  assert.match(result.shareText, /1\/3/);
});
