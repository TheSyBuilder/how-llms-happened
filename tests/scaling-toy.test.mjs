import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "./helpers/component-require.mjs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/components/ScalingToy.tsx", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, jsxImportSource: "preact" },
});
const compiled = {};
const base = createRequire(import.meta.url);
// The game kit and stylesheets are browser-only; the curve and scoring do not need them.
new Function("require", "exports", outputText)((id) => /\.css$|\/game\/|\/lib\/progress$/.test(id) ? {} : base(id), compiled);
const { scalingPoint, scalingCurve, trainingBudgets, bestStep, guessPoints, offBy, scalingStars, START_STEP } = compiled;

test("buying a larger toy model reduces available text under the same budget", () => {
  for (const budget of trainingBudgets) {
    const points = scalingCurve(budget);
    assert.equal(points[0].model, 1);
    assert.equal(points.at(-1).model, 64);
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      assert.ok(Number.isFinite(point.loss) && point.text > 0);
      assert.ok(Math.abs(point.model * point.text - budget) < 1e-9);
      if (i > 0) {
        assert.ok(point.model > points[i - 1].model);
        assert.ok(point.text < points[i - 1].text);
      }
    }
  }
});

test("neither model-size extreme gives the lowest toy score", () => {
  const minima = trainingBudgets.map((budget) => {
    const points = scalingCurve(budget);
    const best = points.reduce((a, b) => a.loss < b.loss ? a : b);
    assert.ok(best.loss < points[0].loss);
    assert.ok(best.loss < points.at(-1).loss);
    return best;
  });
  for (let i = 1; i < minima.length; i++) {
    assert.ok(minima[i].model > minima[i - 1].model);
    assert.ok(minima[i].loss < minima[i - 1].loss);
  }
});

test("a bigger budget buys more text and a lower score at the same model size", () => {
  for (const step of [0, 30, 60]) {
    const small = scalingPoint(64, step);
    const large = scalingPoint(1024, step);
    assert.equal(small.model, large.model);
    assert.ok(large.text > small.text);
    assert.ok(large.loss < small.loss);
  }
});

test("the two toy penalties pull in opposite directions within a fixed budget", () => {
  for (const budget of trainingBudgets) {
    const points = scalingCurve(budget);
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      assert.ok(point.modelPenalty > 0 && point.modelPenalty <= 1);
      assert.ok(point.textPenalty > 0 && point.textPenalty <= 1);
      assert.equal(point.loss, 1 + point.modelPenalty + point.textPenalty);
      if (i > 0) {
        assert.ok(point.modelPenalty < points[i - 1].modelPenalty);
        assert.ok(point.textPenalty > points[i - 1].textPenalty);
      }
    }
  }
});

test("more budget relieves the text shortage while leaving model shortage unchanged", () => {
  for (const step of [0, 30, 60]) {
    const small = scalingPoint(64, step);
    const large = scalingPoint(1024, step);
    assert.equal(small.modelPenalty, large.modelPenalty);
    assert.ok(large.textPenalty < small.textPenalty);
  }
});

test("the hidden sweet spot moves to bigger models as the budget grows", () => {
  const best = trainingBudgets.map(bestStep);
  assert.deepEqual(best, [30, 44, 58]);
  for (const [i, budget] of trainingBudgets.entries()) {
    const curve = scalingCurve(budget);
    assert.ok(curve.every((p) => p.loss >= curve[best[i]].loss));
    assert.ok(Math.abs(best[i] - START_STEP) >= 20, "the slider never starts near the answer");
  }
  // Each 4x budget multiplies the best size by 2^(14/10), about 2.6x.
  assert.ok(Math.abs(offBy(best[1], best[0]) - 2.64) < 0.01);
});

test("guesses score by distance in doublings, and three stars need near misses on every budget", () => {
  assert.equal(guessPoints(30, 30), 100);
  assert.equal(guessPoints(40, 30), 50);
  assert.equal(guessPoints(20, 30), 50);
  assert.equal(guessPoints(50, 30), 0);
  assert.equal(guessPoints(0, 58), 0);
  assert.equal(offBy(40, 30), 2);
  assert.equal(offBy(30, 30), 1);
  assert.deepEqual([300, 220, 219, 160, 80, 79].map(scalingStars), [3, 3, 2, 2, 1, 0]);
});
