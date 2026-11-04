import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from './helpers/component-require.mjs';
import test from 'node:test';
import ts from 'typescript';

const { outputText } = ts.transpileModule(readFileSync(new URL('../src/components/NowToy.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, jsxImportSource: 'preact' },
});
const api = {};
new Function('require', 'exports', outputText)(createRequire(import.meta.url), api);
const { planDelivery } = api;

test('extra effort and tools cannot recover notes excluded from the input', () => {
  for (const notes of [1, 2]) for (const lookup of [false, true]) for (const budget of [1, 4]) {
    const plan = planDelivery({ notes, budget, lookup, closed: true });
    assert.equal(plan.state, 'missing');
    assert.equal(plan.chosen, undefined);
    assert.equal(plan.checks.length, 0);
    assert.ok(!plan.received.includes('Deliver to Pine Studio.'));
  }
});

test('stale evidence can accept a route that fails; extra attempts stop at the same mistaken choice', () => {
  for (const budget of [1, 2, 3, 4]) {
    const plan = planDelivery({ notes: 3, budget, lookup: false, closed: true });
    assert.equal(plan.state, 'blocked');
    assert.equal(plan.chosen.id, 'gate');
    assert.equal(plan.checks.length, 1);
    assert.equal(plan.checks[0].accepted, true);
  }
});

test('fresh evidence rejects the closed gate, enough search finds the detour, and an open gate needs less work', () => {
  for (const budget of [1, 2]) {
    const plan = planDelivery({ notes: 3, budget, lookup: true, closed: true });
    assert.equal(plan.state, 'budget');
    assert.equal(plan.checks[0].reason, 'Gate is closed');
    if (budget === 2) assert.equal(plan.checks[1].reason, 'Wrong destination');
  }
  for (const budget of [3, 4]) {
    const plan = planDelivery({ notes: 3, budget, lookup: true, closed: true });
    assert.equal(plan.state, 'delivered');
    assert.equal(plan.chosen.id, 'market');
    assert.equal(plan.chosen.minutes, 6);
    assert.equal(plan.checks.length, 3);
  }
  for (const lookup of [false, true]) {
    const plan = planDelivery({ notes: 3, budget: 4, lookup, closed: false });
    assert.equal(plan.state, 'delivered');
    assert.equal(plan.chosen.minutes, 4);
    assert.equal(plan.checks.length, 1);
  }
});
