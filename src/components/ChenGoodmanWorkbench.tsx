import { useMemo, useState } from "preact/hooks";

import {
  calculateChenScenario,
  calculateFixedDiscounts,
  type ChenFixture,
  type ChenVariantId,
} from "../lib/chen-goodman-engine.ts";
import type { Mode } from "../lib/site-data.ts";

type Prediction = "D1" | "D2" | "D3+" | "zero";

type Props = {
  fixture: ChenFixture;
  mode: Mode;
};

const predictionOptions: Array<{ value: Prediction; label: string }> = [
  { value: "D1", label: "D₁ · count one" },
  { value: "D2", label: "D₂ · count two" },
  { value: "D3+", label: "D₃₊ · count three or more" },
  { value: "zero", label: "No discount · count zero" },
];

function formatProbability(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 4, minimumFractionDigits: 0 });
}

function formatPercent(value: number): string {
  return `${(value * 100).toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
}

function predictionLabel(value: Prediction): string {
  return predictionOptions.find((option) => option.value === value)?.label ?? value;
}

function displayTier(value: Prediction): string {
  if (value === "D1") return "D₁";
  if (value === "D2") return "D₂";
  if (value === "D3+") return "D₃₊";
  return "none";
}

export default function ChenGoodmanWorkbench({ fixture, mode }: Props) {
  const scenarios = useMemo(
    () => fixture.scenarios.filter((scenario) => scenario.modes.includes(mode)),
    [fixture, mode],
  );
  const scenario = scenarios[0];
  if (scenario === undefined) throw new Error(`No ${mode} Chen–Goodman scenario is available.`);
  const defaultFocus = scenario.continuations.find((item) => item.count === 1) ?? scenario.continuations[0];
  if (defaultFocus === undefined) throw new Error(`${scenario.id} has no continuation to inspect.`);

  const [variant, setVariant] = useState<ChenVariantId>("modified");
  const [focusLabel, setFocusLabel] = useState(defaultFocus.label);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [feedback, setFeedback] = useState("");
  const result = calculateChenScenario(scenario, variant);
  const singleResult = calculateChenScenario(scenario, "single");
  const modifiedResult = calculateChenScenario(scenario, "modified");
  const fixed = calculateFixedDiscounts(scenario.countOfCounts);
  const focus = result.continuations.find((item) => item.label === focusLabel);
  if (focus === undefined) throw new Error(`${scenario.id} is missing focus continuation ${focusLabel}.`);

  const updateFocus = (label: string) => {
    setFocusLabel(label);
    setPrediction(null);
    setFeedback(`${label} selected. Make a fresh tier prediction.`);
  };

  const updateVariant = (next: ChenVariantId) => {
    setVariant(next);
    setFeedback(next === "modified"
      ? "Three count tiers loaded. The continuation distribution still contributes to every row."
      : "One shared discount loaded. Interpolation remains on; only the discount rule changed.");
  };

  const checkPrediction = (event: Event) => {
    event.preventDefault();
    if (prediction === null) {
      setFeedback("Choose a discount tier before checking it.");
      return;
    }
    const correct = prediction === focus.tier;
    setFeedback(correct
      ? `Correct. ${focus.label} has count ${focus.count}, so it follows ${predictionLabel(focus.tier)} under the modified rule.`
      : `Not quite. ${focus.label} has count ${focus.count}, so it follows ${predictionLabel(focus.tier)} under the modified rule.`);
  };

  const reset = () => {
    setVariant("modified");
    setFocusLabel(defaultFocus.label);
    setPrediction(null);
    setFeedback("Workbench reset to the modified three-tier estimator.");
  };

  return (
    <section
      class={`mass-ledger chen-workbench mass-ledger--${mode}`}
      data-variant={variant}
      data-focus={focus.label}
      aria-labelledby="chen-workbench-title"
    >
      <header class="ledger-header">
        <div>
          <p class="kicker">{fixture.label} · Chen–Goodman 1998</p>
          <h2 id="chen-workbench-title">Separate the two levers</h2>
        </div>
        <p class="ledger-folio">Fixture 04 · no paper result reproduced</p>
      </header>

      <form class="ledger-controls" onSubmit={checkPrediction}>
        <div class="control-row">
          <label for="chen-focus">Inspect continuation</label>
          <select id="chen-focus" value={focus.label} onChange={(event) => updateFocus(event.currentTarget.value)}>
            {scenario.continuations.map((item) => (
              <option value={item.label}>{item.label} · count {item.count}</option>
            ))}
          </select>
          <p>{scenario.prompt} The history and lower-order distribution stay fixed.</p>
        </div>

        <fieldset>
          <legend>Predict the modified count branch</legend>
          {predictionOptions.map((option) => (
            <label class="radio-choice">
              <input
                type="radio"
                name="chen-prediction"
                value={option.value}
                checked={prediction === option.value}
                onChange={() => setPrediction(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend>Discount rule</legend>
          <label class="radio-choice">
            <input type="radio" name="chen-variant" checked={variant === "single"} onChange={() => updateVariant("single")} />
            <span>{mode === "beginner" ? "One shared discount for every seen count" : `Single-discount comparison · D = ${formatProbability(scenario.singleDiscount)}`}</span>
          </label>
          <label class="radio-choice">
            <input type="radio" name="chen-variant" checked={variant === "modified"} onChange={() => updateVariant("modified")} />
            <span>{mode === "beginner" ? "Three count tiers: one, two, and three-plus" : `Fixed modified discounts · D₁ = ${formatProbability(fixed.d1)}, D₂ = ${formatProbability(fixed.d2)}, D₃₊ = ${formatProbability(fixed.d3Plus)}`}</span>
          </label>
        </fieldset>

        <div class="control-actions">
          <button class="button" type="submit">Check tier</button>
          <button class="button button--quiet" type="button" onClick={reset}>Reset</button>
        </div>
        <p class="ledger-live" role="status" aria-live="polite">{feedback}</p>
      </form>

      <div class="scenario-register chen-register">
        <dl>
          <div><dt>History</dt><dd>“{scenario.history}”</dd></div>
          <div><dt>History count</dt><dd>{result.historyCount}</dd></div>
          <div><dt>Active rule</dt><dd>{variant === "modified" ? "D₁ / D₂ / D₃₊" : "one shared D"}</dd></div>
          <div><dt>Interpolation λ</dt><dd>{formatProbability(result.interpolationWeight)}</dd></div>
        </dl>
        <p>{scenario.description}</p>
      </div>

      <div class="two-lever-map" aria-label="Discounting and interpolation shown as separate estimator choices">
        <section>
          <p class="account-label">Lever 1 · how much mass is removed?</p>
          <h3>Choose discount by count</h3>
          <div class="mass-bar" role="img" aria-label={`${formatPercent(result.retainedMass)} retained higher-order mass and ${formatPercent(result.interpolationWeight)} removed for interpolation`}>
            <span class="mass-represented" style={{ width: formatPercent(result.retainedMass) }}></span>
            <span class="mass-unseen" style={{ width: formatPercent(result.interpolationWeight) }}></span>
          </div>
          <p>{formatPercent(result.interpolationWeight)} is removed from seen counts and becomes λ.</p>
        </section>
        <section>
          <p class="account-label">Lever 2 · where does λ go?</p>
          <h3>Add lower-order evidence to every row</h3>
          <div class="interpolation-routes" aria-hidden="true">
            {result.continuations.map((item) => <span class={item.count === 0 ? "route-unseen" : "route-seen"}></span>)}
          </div>
          <p>Unlike the 1995 hard-backoff gate, the lower-order term contributes to {result.continuations.length} of {result.continuations.length} continuations here.</p>
        </section>
      </div>

      <div class="ledger-table-wrap chen-estimator-table" tabIndex={0} aria-label="Scrollable interpolated-estimator table">
        <table>
          <caption>Both terms in the active interpolated estimate</caption>
          <thead>
            <tr>
              <th scope="col">Continuation</th>
              <th scope="col">Count</th>
              <th scope="col">Tier</th>
              {mode === "expert" && <th scope="col">Discount</th>}
              <th scope="col">Higher-order term</th>
              <th scope="col">λ × lower order</th>
              <th scope="col">Final p</th>
            </tr>
          </thead>
          <tbody>
            {result.continuations.map((item) => (
              <tr class={`${item.count === 0 ? "row-redistributed" : "row-observed"}${item.label === focus.label ? " row-active" : ""}`}>
                <th scope="row">{item.label}</th>
                <td>{item.count}</td>
                <td>{variant === "single" ? (item.count === 0 ? "none" : "shared D") : displayTier(item.tier)}</td>
                {mode === "expert" && <td>{formatProbability(item.discount)}</td>}
                <td>{formatProbability(item.higherOrderContribution)}</td>
                <td><strong>{formatProbability(item.lowerOrderContribution)}</strong></td>
                <td><strong>{formatProbability(item.finalProbability)}</strong></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={mode === "expert" ? 4 : 3}>Normalization total</th>
              <td>{formatProbability(result.retainedMass)}</td>
              <td>{formatProbability(result.lowerOrderMass)}</td>
              <td><strong>{formatProbability(result.total)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {mode === "expert" && (
        <div class="calculation-trace" aria-label="Chen and Goodman calculation trace">
          <h3>Fixed-discount reconstruction</h3>
          <dl>
            <div><dt>Order-wide count of counts</dt><dd>n₁={scenario.countOfCounts.n1}, n₂={scenario.countOfCounts.n2}, n₃={scenario.countOfCounts.n3}, n₄={scenario.countOfCounts.n4}</dd></div>
            <div><dt>Shared factor</dt><dd>Y = n₁/(n₁ + 2n₂) = {formatProbability(fixed.y)}</dd></div>
            <div><dt>Count one</dt><dd>D₁ = {formatProbability(fixed.d1)}</dd></div>
            <div><dt>Count two</dt><dd>D₂ = {formatProbability(fixed.d2)}</dd></div>
            <div><dt>Count three or more</dt><dd>D₃₊ = {formatProbability(fixed.d3Plus)}</dd></div>
            <div><dt>Mass identity</dt><dd>Σ retained + λΣ p lower = {formatProbability(result.retainedMass)} + {formatProbability(result.lowerOrderMass)} = {formatProbability(result.total)}</dd></div>
          </dl>
        </div>
      )}

      <div class="comparison-register">
        <h3>Hold interpolation fixed; change only the discount rule</h3>
        <table>
          <caption>Reviewed outputs for the two authored synthetic variants</caption>
          <thead><tr><th scope="col">Variant</th><th scope="col">Retained</th><th scope="col">λ</th><th scope="col">Total</th></tr></thead>
          <tbody>
            <tr><th scope="row">One shared D</th><td>{formatProbability(singleResult.retainedMass)}</td><td>{formatProbability(singleResult.interpolationWeight)}</td><td>{formatProbability(singleResult.total)}</td></tr>
            <tr><th scope="row">D₁ / D₂ / D₃₊</th><td>{formatProbability(modifiedResult.retainedMass)}</td><td>{formatProbability(modifiedResult.interpolationWeight)}</td><td>{formatProbability(modifiedResult.total)}</td></tr>
          </tbody>
        </table>
      </div>

      <details class="static-pair">
        <summary>Static hard-backoff versus interpolation audit</summary>
        <div class="ledger-table-wrap">
          <table>
            <caption>Which rows may receive the lower-order continuation signal?</caption>
            <thead><tr><th scope="col">Estimator branch</th><th scope="col">Seen count</th><th scope="col">Zero count</th></tr></thead>
            <tbody>
              <tr><th scope="row">1995 hard backoff</th><td>No lower-order term</td><td>Fallback term</td></tr>
              <tr><th scope="row">1998 interpolation</th><td>Higher + lower terms</td><td>Lower term</td></tr>
            </tbody>
          </table>
        </div>
      </details>

      <details class="checkpoint">
        <summary>Which lever makes lower-order evidence reach a seen phrase?</summary>
        <p>Interpolation does. Discount tiers change how much mass a seen count removes; they do not decide whether the lower-order continuation term reaches seen rows. In the report’s interpolated form, that term contributes to both seen and unseen continuations.</p>
      </details>
    </section>
  );
}
