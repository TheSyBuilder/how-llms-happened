import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from './helpers/component-require.mjs';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/components/NeuralLanguageToy.tsx', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, jsxImportSource: 'preact' } });
const base = createRequire(import.meta.url);
// The game kit, progress store and stylesheet are not needed to test the model and scoring.
const require = id => id.endsWith('.css') || id.includes('/game/') || id.endsWith('/progress') ? {} : base(id);
const toy = {};
new Function('require', 'exports', outputText)(require, toy);
const { words, vectors, lessons, freshPredictor, satChance, teach, shiftsAfter, movers, scoreCalls, neuralStars, maxScore, shiftThreshold } = toy;
const dot = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0);

test('a lesson moves exactly the words that share a feature with the taught word', () => {
  let model = freshPredictor();
  for (const lesson of lessons) {
    const shifts = shiftsAfter(model, lesson);
    for (const word of words) {
      if (word === lesson.word) continue;
      const overlap = dot(vectors[word], vectors[lesson.word]);
      if (overlap === 0) assert.equal(shifts[word], 0);
      // Every non-zero shift clears the threshold comfortably, so no call is a coin flip.
      else assert.ok(Math.abs(shifts[word]) >= shiftThreshold + .5, `${lesson.word} → ${word}: ${shifts[word]}`);
    }
    model = teach(model, lesson);
  }
});

test('teaching cat helps dog without a lesson of its own, and a horse lesson can lower cat', () => {
  const start = freshPredictor();
  for (const word of words) assert.equal(satChance(start, word), .5);
  assert.deepEqual(movers(start, lessons[0]), ['dog', 'horse']);
  const afterCat = teach(start, lessons[0]);
  assert.ok(satChance(afterCat, 'dog') > .6);
  assert.equal(satChance(afterCat, 'car'), .5);
  const afterCar = teach(afterCat, lessons[1]);
  assert.ok(shiftsAfter(afterCar, lessons[2]).cat < -1);
  assert.deepEqual(start, freshPredictor());
});

test('a sat lesson lowers that word’s loss and a stopped lesson lowers its chance of sat', () => {
  const model = freshPredictor();
  assert.ok(satChance(teach(model, { word: 'cat', next: 'sat' }), 'cat') > .5);
  assert.ok(satChance(teach(model, { word: 'car', next: 'stopped' }), 'car') < .5);
  assert.equal(teach(model, lessons[0]).steps, 1);
});

test('calls score one point per other word and stars need near-perfect reading', () => {
  const model = freshPredictor();
  assert.equal(scoreCalls(model, lessons[0], ['dog', 'horse']), 4);
  assert.equal(scoreCalls(model, lessons[0], []), 2);
  assert.equal(scoreCalls(model, lessons[0], ['bike', 'car']), 0);
  assert.equal(maxScore, 24);
  let perfect = 0, m = freshPredictor();
  for (const lesson of lessons) { perfect += scoreCalls(m, lesson, movers(m, lesson)); m = teach(m, lesson); }
  assert.equal(perfect, maxScore);
  assert.deepEqual([24, 22, 21, 19, 18, 15, 14, 0].map(neuralStars), [3, 3, 2, 2, 1, 1, 0, 0]);
});
