import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/components/NeuralLanguageToy.tsx', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, jsxImportSource: 'preact' } });
const toy = {};
new Function('require', 'exports', outputText)(createRequire(import.meta.url), toy);
const { freshLanguageModel, sleepChance, teachNextWord, placeDog, lessonLimit } = toy;

test('learning transfers to an unobserved context without adding its counts or changing its vector', () => {
  const before = freshLanguageModel();
  const after = teachNextWord(before, 'cat');
  assert.equal(sleepChance(before, 'dog'), .5);
  assert.ok(sleepChance(after, 'cat') > sleepChance(after, 'dog'));
  assert.ok(sleepChance(after, 'dog') > .5);
  assert.equal(sleepChance(after, 'car'), .5);
  assert.deepEqual(after.counts, { cat: [1, 0], dog: [0, 0], car: [0, 0] });
  assert.deepEqual(after.vectors.dog, before.vectors.dog);
  assert.deepEqual(before, freshLanguageModel());
});

test('prediction training updates both the observed vector and shared weights and lowers its loss', () => {
  const once = teachNextWord(freshLanguageModel(), 'cat');
  const twice = teachNextWord(once, 'cat');
  assert.notDeepEqual(twice.vectors.cat, once.vectors.cat);
  assert.notDeepEqual(twice.weights, once.weights);
  assert.ok(-Math.log(sleepChance(twice, 'cat')) < -Math.log(sleepChance(once, 'cat')));
  assert.deepEqual(twice.vectors.car, once.vectors.car);
});

test('changing an untaught representation changes transfer but never adds training evidence', () => {
  let model = freshLanguageModel();
  for (let i = 0; i < 4; i++) model = teachNextWord(teachNextWord(model, 'cat'), 'car');
  const nearCat = placeDog(model, 0), nearCar = placeDog(model, 100);
  assert.ok(sleepChance(nearCat, 'dog') > .5);
  assert.ok(sleepChance(nearCar, 'dog') < .5);
  assert.deepEqual(nearCar.weights, model.weights);
  assert.deepEqual(nearCar.counts, model.counts);
  assert.equal(nearCar.steps, model.steps);
  assert.deepEqual(placeDog(model, -10).vectors.dog, [1, 0]);
  assert.deepEqual(placeDog(model, 110).vectors.dog, [0, 1]);
});

test('opposing lessons remain finite through the full session and stop at its limit', () => {
  for (const sequence of [['cat'], ['car'], ['cat', 'car']]) {
    let model = freshLanguageModel();
    for (let i = 0; i < lessonLimit; i++) {
      model = teachNextWord(model, sequence[i % sequence.length]);
      for (const word of ['cat', 'dog', 'car']) assert.ok(sleepChance(model, word) > 0 && sleepChance(model, word) < 1);
    }
    assert.equal(model.steps, lessonLimit);
    assert.equal(teachNextWord(model, 'cat'), model);
    assert.deepEqual(model.counts.dog, [0, 0]);
  }
});
