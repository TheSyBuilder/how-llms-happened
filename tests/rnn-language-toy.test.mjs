import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from './helpers/component-require.mjs';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/components/RnnLanguageToy.tsx', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, jsxImportSource: 'preact' } });
const toy = {};
new Function('require', 'exports', outputText)(createRequire(import.meta.url), toy);
const { historyWords, predictHistory, readWord, windowSize } = toy;

test('identical endings lose the topic in a fixed window but retain it in recurrent predictions', () => {
  const river = historyWords('river', false), loan = historyWords('loan', false);
  assert.deepEqual(river.slice(-windowSize), loan.slice(-windowSize));
  assert.equal(predictHistory(river, river.length, true).water, .5);
  assert.equal(predictHistory(loan, loan.length, true).water, .5);
  assert.ok(predictHistory(river, river.length).water > .5);
  assert.ok(predictHistory(loan, loan.length).water < .5);
});

test('fixed window loses the cue at its edge while extra neutral words gradually weaken the state', () => {
  const words = historyWords('river', false);
  assert.ok(predictHistory(words, windowSize, true).water > .5);
  assert.equal(predictHistory(words, windowSize + 1, true).water, .5);
  let previous = 1;
  for (let count = 1; count <= words.length; count++) {
    const p = predictHistory(words, count).water;
    assert.ok(p > .5 && p < previous); previous = p;
  }
  const longer = historyWords('river', true);
  assert.ok(predictHistory(longer, longer.length).water < previous);
  assert.ok(predictHistory(longer, longer.length).water > .5);
});

test('prefix reads cannot see future clues and a cleared history has equal probabilities', () => {
  const words = ['we', 'walked', 'river'];
  assert.equal(predictHistory(words, 2).water, .5);
  assert.ok(predictHistory(words, 3).water > .5);
  assert.equal(predictHistory(words, 0).water, .5);
  assert.equal(predictHistory(words, -2).water, .5);
  assert.deepEqual(predictHistory(words, 100), predictHistory(words, words.length));
});

test('probabilities normalize, opposite clues mirror one another and reading leaves inputs unchanged', () => {
  const start = [.5, .5]; readWord(start, 'river'); assert.deepEqual(start, [.5, .5]);
  for (const long of [false, true]) {
    const river = historyWords('river', long), loan = historyWords('loan', long);
    for (let count = 0; count <= river.length; count++) {
      const a = predictHistory(river, count), b = predictHistory(loan, count);
      assert.ok(a.water > 0 && a.water < 1);
      assert.equal(a.water + a.money, 1);
      assert.ok(Math.abs(a.water - b.money) < 1e-12);
      for (const value of a.state) assert.ok(value > 0 && value < 1);
    }
  }
});
