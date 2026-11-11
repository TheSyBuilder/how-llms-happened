import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from './helpers/component-require.mjs';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/components/RnnLanguageToy.tsx', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, jsxImportSource: 'preact' } });
const base = createRequire(import.meta.url);
const require = id => id.endsWith('.css') || id.includes('/game/') || id.endsWith('/progress') ? {} : base(id);
const toy = {};
new Function('require', 'exports', outputText)(require, toy);
const { readWord, waterChance, targets, judge, par, parTotal, rnnStars, ending } = toy;
const filler = n => Array(n).fill('we');
const build = (clue, after) => [clue, ...filler(after - 1), ending];

test('identical endings lose the topic in a fixed window but keep it in the running state', () => {
  const river = ['river', 'we', 'walked', 'to', 'the', 'bank'], loan = ['loan', ...river.slice(1)];
  assert.equal(waterChance(river, 3), .5);
  assert.equal(waterChance(loan, 3), .5);
  assert.ok(waterChance(river) > .5);
  assert.ok(waterChance(loan) < .5);
  const start = [.5, .5]; readWord(start, 'river'); assert.deepEqual(start, [.5, .5]);
});

test('extra neutral words weaken the running clue monotonically', () => {
  let previous = 1;
  for (let k = 0; k < 10; k++) { const p = waterChance(['river', ...filler(k)]); assert.ok(p > .5 && p < previous); previous = p; }
});

test('each target is beaten at par and not one word shorter', () => {
  for (const target of targets) {
    const atPar = build(target.clue, target.window);
    assert.equal(atPar.length, par(target));
    assert.ok(judge(atPar, target).beaten, `par ${target.window}`);
    const short = build(target.clue, target.window - 1);
    const verdict = judge(short, target);
    assert.equal(verdict.beaten, false);
    assert.ok(verdict.window > .55);
  }
});

test('the last target punishes waiting too long: one extra word and the RNN forgets', () => {
  const target = targets[2];
  const late = build(target.clue, target.window + 1);
  const verdict = judge(late, target);
  assert.ok(verdict.window < .55);
  assert.ok(verdict.rnn < target.need);
  assert.equal(verdict.beaten, false);
  // Words before the clue cost strokes but do not hurt the memory.
  assert.ok(judge(['we', 'walked', ...build(target.clue, target.window)], target).beaten);
});

test('the opposite clue inside the window does not count as beating it', () => {
  const target = targets[0];
  assert.equal(judge(['river', 'we', 'loan', ending], target).beaten, false);
});

test('strokes map to stars with par earning three', () => {
  assert.equal(parTotal, 13);
  assert.deepEqual([13, 14, 15, 16, 19, 20].map(rnnStars), [3, 2, 2, 1, 1, 0]);
});
