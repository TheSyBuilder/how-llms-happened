import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from './helpers/component-require.mjs';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/components/RecurrenceToy.tsx', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, jsxImportSource: 'preact' },
});
const base = createRequire(import.meta.url);
const require = id => id.endsWith('.css') || id.includes('/game/') || id.endsWith('/progress') ? {} : base(id);
const compiled = {};
new Function('require', 'exports', outputText)(require, compiled);
const { plan, finishTick, reachAt, winners, raceLengths, raceStars, readsPerTick, ticksPerStep } = compiled;

test('step counts follow each wiring: a chain of hops, widening layers, one all-pairs read', () => {
  assert.deepEqual(plan('chain', 8), { steps: 7, reads: 2 });
  assert.deepEqual(plan('conv', 8), { steps: 3, reads: 24 });
  assert.deepEqual(plan('attention', 8), { steps: 1, reads: 64 });
  // Spacing cycles 1, 2, 4, 8, 16, then starts again.
  assert.equal(plan('conv', 32).steps, 5);
  assert.equal(plan('conv', 64).steps, 11);
});

test('a step needing more reads than the chip offers takes several ticks', () => {
  assert.equal(readsPerTick, 128);
  assert.equal(ticksPerStep('attention', 64), 32);
  assert.equal(ticksPerStep('conv', 64), 2);
  assert.equal(ticksPerStep('chain', 64), 1);
  assert.deepEqual(raceLengths.map(n => finishTick('attention', n)), [1, 2, 8, 32]);
  assert.deepEqual(raceLengths.map(n => finishTick('conv', n)), [3, 4, 5, 22]);
  assert.deepEqual(raceLengths.map(n => finishTick('chain', n)), [7, 15, 31, 63]);
});

test('attention wins the short races and the widening stack wins the long ones', () => {
  assert.deepEqual(raceLengths.map(n => winners(n)), [['attention'], ['attention'], ['conv'], ['conv']]);
});

test('reach grows only when a step completes and arrives exactly at the finish tick', () => {
  for (const n of raceLengths) for (const wiring of ['chain', 'conv', 'attention']) {
    const finish = finishTick(wiring, n);
    assert.equal(reachAt(wiring, n, 0), 1);
    assert.ok(reachAt(wiring, n, finish - 1) < n);
    assert.equal(reachAt(wiring, n, finish), n);
    for (let t = 1; t <= finish; t++) assert.ok(reachAt(wiring, n, t) >= reachAt(wiring, n, t - 1));
  }
  assert.equal(reachAt('attention', 64, 31), 1);
  assert.equal(reachAt('conv', 8, 1), 2);
  assert.equal(reachAt('conv', 8, 2), 4);
});

test('stars need every bet right for three', () => {
  assert.deepEqual([4, 3, 2, 1, 0].map(raceStars), [3, 2, 1, 0, 0]);
});
