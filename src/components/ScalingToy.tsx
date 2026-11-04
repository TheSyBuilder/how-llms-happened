import '../i18n/preact';
import { useState } from "preact/hooks";

export const trainingBudgets = [64, 256, 1024];
// Invented dimensionless scores, chosen only to illustrate competing resources.
export function scalingPoint(budget: number, step: number) {
  const model = 2 ** (step / 10);
  const text = budget / model;
  const loss = 1 + model ** -0.3 + text ** -0.7;
  return { model, text, loss };
}
export function scalingCurve(budget: number) {
  return Array.from({ length: 61 }, (_, step) => ({ step, ...scalingPoint(budget, step) }));
}

const x = (step: number) => 52 + step * 5.3;
const y = (loss: number) => 236 - (loss - 1) * 103;
const number = (value: number) => value.toFixed(1);

export default function ScalingToy() {
  const [budget, setBudget] = useState(256);
  const [step, setStep] = useState(30);
  const point = scalingPoint(budget, step);
  const curve = scalingCurve(budget);
  return (
    <div class="scaling-toy">
      <div class="toy-topline"><strong>Find the low point.</strong><span class="toy-label">Toy · invented curve</span></div>
      <p>Drag from a small model to a big one. Can you lower the score without increasing the budget?</p>
      <fieldset class="budget-picker">
        <legend>Training budget · toy units</legend>
        <div class="budget-options">{trainingBudgets.map((value) => <label><input type="radio" name="training-budget" value={value} checked={budget === value} onChange={() => setBudget(value)} />{value.toLocaleString("en-US")}</label>)}</div>
      </fieldset>
      <div class="toy-controls">
        <label for="model-size">Model size <output for="model-size">{number(point.model)} units</output></label>
        <input id="model-size" type="range" min="0" max="60" step="1" value={step} aria-describedby="scaling-help" aria-valuetext={`${number(point.model)} model units; ${number(point.text)} text units; toy loss ${point.loss.toFixed(2)}`} onInput={(event) => setStep(Number(event.currentTarget.value))} />
        <div class="range-ends"><span>1 · small model</span><span>64 · big model</span></div>
      </div>
      <figure class="scaling-chart">
        <svg viewBox="0 0 400 298" role="img" aria-labelledby="curve-title curve-description">
          <title id="curve-title">Toy loss across model sizes at a fixed budget</title>
          <desc id="curve-description">The dot marks {number(point.model)} model units and a toy loss of {point.loss.toFixed(2)}. Moving right buys a larger model but leaves less text. Lower scores are better. This is an invented curve, not paper results.</desc>
          <g class="scaling-grid">{[1, 2, 3].map((loss) => <path d={`M52 ${y(loss)}H370`} />)}</g>
          <g fill="currentColor" font-size="19"><text x="52" y="23">Toy loss ↓ lower is better</text>{[1, 2, 3].map((loss) => <text x="16" y={y(loss) + 6}>{loss}</text>)}</g>
          <path d="M52 37V236H370" fill="none" stroke="currentColor" />
          {trainingBudgets.filter(b=>b!==budget).map(b=><path d={scalingCurve(b).map((p,i)=>`${i===0?'M':'L'}${x(p.step)},${y(p.loss)}`).join(' ')} fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="4 5" opacity=".45"/>)}
          <path data-testid="scaling-curve" d={curve.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.step)},${y(p.loss)}`).join(" ")} fill="none" stroke="var(--deep)" stroke-width="3" />
          <path class="scaling-guide" d={`M${x(step)} ${y(point.loss)}V236`} />
          <circle class="scaling-dot" cx={x(step)} cy={y(point.loss)} r="7" fill="var(--accent)" stroke="currentColor" stroke-width="2" />
          <g fill="currentColor" text-anchor="middle" font-size="19">{[0, 20, 40, 60].map((s) => <text x={x(s)} y="263">{2 ** (s / 10)}</text>)}<text x="210" y="291">Model units · equal ratios</text></g>
        </svg>
      </figure>
      <div class="scaling-readout" aria-live="polite" aria-atomic="true">
        <div><span>Model units</span><output data-testid="model-units">{number(point.model)}</output></div>
        <div><span>Text units</span><output data-testid="text-units">{number(point.text)}</output></div>
        <div><span>Toy loss ↓</span><output data-testid="scaling-loss">{point.loss.toFixed(2)}</output></div>
      </div>
      <p id="scaling-help">Solid: selected budget. Dashed: the other budgets. Budget = model × text. More budget moves the whole curve; a bigger model alone moves you along it.</p>
      <details class="toy-method"><summary>About this toy</summary><p class="toy-footnote">No model is trained here. The 61 curve points use an invented formula in arbitrary units, not Kaplan’s fitted laws or a prediction of real performance.</p></details>
    </div>
  );
}
