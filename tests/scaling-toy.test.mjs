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
new Function("require", "exports", outputText)(createRequire(import.meta.url), compiled);
const { scalingPoint, scalingCurve, trainingBudgets } = compiled;

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
