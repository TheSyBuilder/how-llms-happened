import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from './helpers/component-require.mjs';
import test from 'node:test';
import ts from 'typescript';

const { outputText } = ts.transpileModule(readFileSync(new URL('../src/components/NowToy.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, jsxImportSource: 'preact' },
});
const base = createRequire(import.meta.url);
const stub = id => id.endsWith('.css') ? {} : id.includes('/game/') ? { default: () => null } : id.endsWith('/lib/progress') ? { markPlayed() {} } : base(id);
const api = {};
new Function('require', 'exports', outputText)(stub, api);
const { planDelivery, runCost, cheapestRun, nowStars, pickWorld, worlds, nowResult, WALLET } = api;

test('extra effort and tools cannot recover notes excluded from the input', () => {
  for (const notes of [1, 2]) for (const lookup of [false, true]) for (const budget of [1, 4]) {
    const plan = planDelivery({ notes, budget, lookup, closed: ['gate'] });
    assert.equal(plan.state, 'missing');
    assert.equal(plan.chosen, undefined);
    assert.equal(plan.checks.length, 0);
    assert.ok(!plan.received.includes('Deliver to Pine Studio.'));
  }
});

test('stale evidence can accept a route that fails; extra attempts stop at the same mistaken choice', () => {
  for (const closed of [['gate'], ['gate', 'dock']]) for (const budget of [1, 2, 3, 4]) {
    const plan = planDelivery({ notes: 3, budget, lookup: false, closed });
    assert.equal(plan.state, 'blocked');
    assert.equal(plan.chosen.id, 'gate');
    assert.equal(plan.checks.length, 1);
    assert.equal(plan.title, 'Old map. Closed Gate.');
  }
});

test('fresh evidence rejects the closed gate and enough search finds the detour', () => {
  for (const budget of [1, 2]) {
    const plan = planDelivery({ notes: 3, budget, lookup: true, closed: ['gate'] });
    assert.equal(plan.state, 'budget');
    assert.equal(plan.checks[0].reason, 'Gate is closed');
  }
  const plan = planDelivery({ notes: 3, budget: 3, lookup: true, closed: ['gate', 'dock'] });
  assert.equal(plan.state, 'delivered');
  assert.equal(plan.chosen.id, 'market');
  assert.equal(plan.chosen.minutes, 6);
  for (const closed of [['market'], ['dock']]) for (const lookup of [false, true]) {
    const open = planDelivery({ notes: 3, budget: 1, lookup, closed });
    assert.equal(open.state, 'delivered');
    assert.equal(open.chosen.minutes, 4);
  }
});

test('costs: the tool is worth paying for only when the old map is wrong', () => {
  assert.equal(runCost({ notes: 3, budget: 1, lookup: false }), 4);
  assert.equal(runCost({ notes: 3, budget: 3, lookup: true }), 8);
  assert.deepEqual(worlds.map(cheapestRun), [8, 8, 4, 4]);
  for (const world of worlds) assert.ok(cheapestRun(world) < WALLET);
  assert.equal(worlds.filter(w => w.includes('gate')).length, worlds.length / 2);
});

test('worlds are picked at random from the list, and stars reward the cheapest delivery', () => {
  assert.deepEqual(pickWorld(() => 0), worlds[0]);
  assert.deepEqual(pickWorld(() => 0.99), worlds.at(-1));
  assert.deepEqual([[4, 4, true], [8, 4, true], [9, 4, true], [8, 8, true], [24, 8, false]].map(([s, c, d]) => nowStars(s, c, d)), [3, 2, 1, 3, 0]);
  const best = nowResult(4, 4, true, 1);
  assert.equal(best.headline, 'Delivered for 4 credits, the cheapest possible.');
  assert.equal(best.stars, 3);
  assert.match(best.shareText, /3\/3 stars/);
  assert.equal(nowResult(21, 8, false, 4).stars, 0);
});
