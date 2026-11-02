import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/components/RecurrenceToy.tsx', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, jsxImportSource: 'preact' },
});
const compiled = {};
new Function('require', 'exports', outputText)(createRequire(import.meta.url), compiled);
const { spreadSignal, signalRoutes } = compiled;
const positions = state => state.reached.flatMap((yes, i) => yes ? [i + 1] : []);

test('a new window reads the previous layer, not partially updated neighbours', () => {
  assert.deepEqual(positions(spreadSignal('local', 0)), [1]);
  assert.deepEqual(positions(spreadSignal('local', 1)), [1, 2]);
  assert.deepEqual(positions(spreadSignal('local', 2)), [1, 2, 3]);
  assert.deepEqual(positions(spreadSignal('dilated', 2)), [1, 2, 3, 4]);
  assert.deepEqual(positions(spreadSignal('dilated', 3)), [1, 2, 3, 4, 5, 6, 7, 8]);
});

test('arrival labels agree with the first path to the last word for each route', () => {
  for (const route of signalRoutes) {
    const arrival = Array.from({ length: 8 }, (_, hops) => spreadSignal(route.id, hops).reached[7]).indexOf(true);
    assert.equal(arrival, route.arrival);
    assert.deepEqual(positions(spreadSignal(route.id, 0)), [1]);
  }
});

test('serial and parallel updates have different connectivity despite equal local reach', () => {
  const serial = spreadSignal('recurrent', 2);
  const local = spreadSignal('local', 2);
  assert.deepEqual(serial.reached, local.reached);
  assert.equal(serial.edges.length, 1);
  assert.equal(new Set(local.edges.map(edge => edge.to)).size, 8);
  const direct = spreadSignal('attention', 1);
  assert.equal(direct.edges.length, 64);
  assert.equal(direct.edges.filter(edge => edge.carries).length, 8);
});

test('the widening schedule resets and boundary connections stay within the sentence', () => {
  const sixth = spreadSignal('dilated', 6);
  assert.ok(sixth.edges.some(edge => edge.from === 0 && edge.to === 1));
  for (const route of signalRoutes) for (let hops = 0; hops <= 7; hops++) {
    const state = spreadSignal(route.id, hops);
    assert.ok(state.edges.every(edge => edge.from >= 0 && edge.from < 8 && edge.to >= 0 && edge.to < 8));
    assert.ok(state.before.every((lit, i) => !lit || state.reached[i]));
  }
});
