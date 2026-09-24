import { useMemo, useState } from "preact/hooks";

import {
  calculateKatzScenario,
  type KatzFixture,
  type KatzScenario,
} from "../lib/katz-engine.ts";
import type { Mode } from "../lib/site-data.ts";

type Prediction = "zero-only" | "every" | "seen-only";

type Props = {
  fixture: KatzFixture;
  mode: Mode;
};

const predictionOptions: Array<{ value: Prediction; label: string }> = [
  { value: "zero-only", label: "Only continuations with a zero higher-order estimate" },
  { value: "every", label: "Every continuation, seen or unseen" },
  { value: "seen-only", label: "Only continuations already seen after this history" },
];

function formatProbability(value: number | null): string {
  if (value === null) return "not used";
  return value.toLocaleString("en-US", { maximumFractionDigits: 4, minimumFractionDigits: 0 });
}

function formatPercent(value: number): string {
  return `${(value * 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}

function selectScenario(scenarios: KatzScenario[], id: string): KatzScenario {
  const selected = scenarios.find((scenario) => scenario.id === id);
  if (selected === undefined) throw new Error(`Unknown Katz scenario ${id}.`);
  return selected;
}

export default function KatzMassLedger({ fixture, mode }: Props) {
  const scenarios = useMemo(
    () => fixture.scenarios.filter((scenario) => scenario.modes.includes(mode)),
    [fixture, mode],
  );
  const defaultScenario = scenarios[0];
  if (defaultScenario === undefined) throw new Error(`No ${mode} Katz scenario is available.`);

  const [scenarioId, setScenarioId] = useState(defaultScenario.id);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [feedback, setFeedback] = useState("");
  const [showComparison, setShowComparison] = useState(false);
  const scenario = selectScenario(scenarios, scenarioId);
  const result = calculateKatzScenario(scenario);
  const baselineResult = calculateKatzScenario(defaultScenario);
  const isDefault = scenario.id === defaultScenario.id;
  const branchLabel = result.branch === "observed-history"
    ? "observed history · zero-estimate gate"
    : "unseen history · direct lower-order recursion";

  const updateScenario = (id: string) => {
    const next = selectScenario(scenarios, id);
    setScenarioId(next.id);
    setPrediction(null);
    setShowComparison(false);
    setFeedback(`${next.label} loaded. Prediction reset.`);
  };

  const checkPrediction = (event: Event) => {
    event.preventDefault();
    if (prediction === null) {
      setFeedback("Choose a prediction before checking it.");
      return;
    }
    if (result.branch === "unseen-history") {
      setFeedback(
        "This history has zero count, so Katz drops its oldest word and uses the lower-order estimator directly; alpha is not computed for this branch.",
      );
      return;
    }
    setFeedback(
      prediction === "zero-only"
        ? `Correct. Only ${result.eligibleLabels.join(" and ")} have zero higher-order estimates, so only those rows receive lower-order probability.`
        : `Not quite. Katz keeps every nonzero discounted higher-order estimate and sends lower-order probability only to ${result.eligibleLabels.join(" and ")}.`,
    );
  };

  const reset = () => {
    setScenarioId(defaultScenario.id);
    setPrediction(null);
    setShowComparison(false);
    setFeedback("Workbench reset to the authored default.");
  };

  return (
    <section class={`mass-ledger katz-ledger mass-ledger--${mode}`} data-scenario={scenario.id} aria-labelledby="katz-ledger-title">
      <header class="ledger-header">
        <div>
          <p class="kicker">{fixture.label} · Katz 1987</p>
          <h2 id="katz-ledger-title">Trace the zero-estimate gate</h2>
        </div>
        <p class="ledger-folio">Fixture 02 · no paper result reproduced</p>
      </header>

      <form class="ledger-controls" onSubmit={checkPrediction}>
        <div class="control-row">
          <label for="katz-scenario">Count pattern</label>
          <select
            id="katz-scenario"
            value={scenario.id}
            onChange={(event) => updateScenario(event.currentTarget.value)}
          >
            {scenarios.map((item) => <option value={item.id}>{item.label}</option>)}
          </select>
          <p>{scenario.description}</p>
        </div>

        <fieldset>
          <legend>Predict before checking</legend>
          <p class="prediction-question">{scenario.prompt}</p>
          {predictionOptions.map((option) => (
            <label class="radio-choice">
              <input
                type="radio"
                name="katz-prediction"
                value={option.value}
                checked={prediction === option.value}
                onChange={() => setPrediction(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>

        <div class="control-actions">
          <button class="button" type="submit">Check prediction</button>
          <button class="button button--quiet" type="button" onClick={reset}>Reset</button>
          <button
            class="button button--quiet"
            type="button"
            disabled={isDefault}
            onClick={() => setShowComparison((value) => !value)}
          >
            {showComparison ? "Hide comparison" : "Compare with default"}
          </button>
        </div>
        <p class="ledger-live" role="status" aria-live="polite">{feedback}</p>
      </form>

      <div class="scenario-register">
        <dl>
          <div><dt>Active history</dt><dd>“{scenario.history}”</dd></div>
          <div><dt>History count</dt><dd>{scenario.historyCount}</dd></div>
          <div><dt>Cutoff k</dt><dd>{scenario.cutoffK}</dd></div>
          <div><dt>Active branch</dt><dd>{branchLabel}</dd></div>
        </dl>
      </div>

      <div class="ledger-table-wrap katz-count-table" tabindex={mode === "expert" ? 0 : undefined} aria-label={mode === "expert" ? "Scrollable expert count table" : undefined}>
        <table>
          <caption>
            {mode === "beginner"
              ? "Counts and the action taken for each candidate continuation"
              : "Reviewed counts, discounted counts, and lower-order probabilities"}
          </caption>
          <thead>
            {mode === "beginner" ? (
              <tr>
                <th scope="col">Continuation</th>
                <th scope="col">Count</th>
                <th scope="col">Katz action</th>
              </tr>
            ) : (
              <tr>
                <th scope="col">w</th>
                <th scope="col">r</th>
                <th scope="col">r′</th>
                <th scope="col">p lower</th>
                <th scope="col">Gate</th>
              </tr>
            )}
          </thead>
          <tbody>
            {result.continuations.map((item) => (
              mode === "beginner" ? (
                <tr class={item.gate === "keep" ? "row-observed" : "row-redistributed"}>
                  <th scope="row">{item.label}</th>
                  <td>{item.higherOrderCount}</td>
                  <td>{item.gate === "keep" ? "keep discounted estimate" : result.branch === "unseen-history" ? "drop history" : "back off from zero"}</td>
                </tr>
              ) : (
                <tr class={item.gate === "keep" ? "row-observed" : "row-redistributed"}>
                  <th scope="row">{item.label}</th>
                  <td>{item.higherOrderCount}</td>
                  <td>{formatProbability(item.discountedCount)}</td>
                  <td>{formatProbability(item.lowerOrderProbability)}</td>
                  <td>{item.gate}</td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>

      <div class="mass-transfer" aria-label="Probability mass before and after lower-order allocation">
        <div>
          <p class="account-label">1 · Discount and set aside</p>
          <div
            class="mass-bar"
            role="img"
            aria-label={result.branch === "observed-history"
              ? `${formatPercent(result.retainedMass)} retained higher-order mass and ${formatPercent(result.reservedMass ?? 0)} reserved mass`
              : "The current history is absent, so no history-specific retained or reserved mass is calculated"}
          >
            {result.branch === "observed-history" ? (
              <>
                <span class="mass-represented" style={{ width: formatPercent(result.retainedMass) }}></span>
                <span class="mass-unseen" style={{ width: formatPercent(result.reservedMass ?? 0) }}></span>
              </>
            ) : <span class="mass-empty" style={{ width: "100%" }}>history absent</span>}
          </div>
          <p class="mass-caption">
            {result.branch === "observed-history"
              ? `${formatPercent(result.reservedMass ?? 0)} becomes this history's β̃ reserve.`
              : "Equation (17) drops the oldest history word and uses the lower order directly."}
          </p>
        </div>
        <div>
          <p class="account-label">2 · Final normalized distribution</p>
          <div class="mass-bar" role="img" aria-label={`${formatPercent(result.retainedMass)} retained higher-order mass and ${formatPercent(1 - result.retainedMass)} lower-order contribution`}>
            {result.retainedMass > 0 && <span class="mass-represented" style={{ width: formatPercent(result.retainedMass) }}></span>}
            <span class="mass-redistributed" style={{ width: formatPercent(1 - result.retainedMass) }}></span>
          </div>
          <p class="mass-caption">Every destination is shown in the table; the total remains {formatProbability(result.total)}.</p>
        </div>
      </div>

      <div class="ledger-table-wrap final-probability-table" tabindex={mode === "expert" ? 0 : undefined} aria-label={mode === "expert" ? "Scrollable expert final-probability table" : undefined}>
        <table>
          <caption>Final conditional probabilities after the active Katz branch</caption>
          <thead>
            <tr>
              <th scope="col">Continuation</th>
              {mode === "expert" && <th scope="col">Higher-order estimate</th>}
              {mode === "expert" && <th scope="col">Lower-order contribution</th>}
              <th scope="col">Final probability</th>
            </tr>
          </thead>
          <tbody>
            {result.continuations.map((item) => (
              <tr>
                <th scope="row">{item.label}</th>
                {mode === "expert" && <td>{formatProbability(item.higherOrderEstimate)}</td>}
                {mode === "expert" && <td>{formatProbability(item.lowerOrderContribution)}</td>}
                <td><strong>{formatProbability(item.finalProbability)}</strong></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={mode === "expert" ? 3 : 1}>Normalization total</th>
              <td><strong>{formatProbability(result.total)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {mode === "expert" && (
        <div class="calculation-trace" aria-label="Katz calculation trace">
          <h3>Calculation trace</h3>
          {result.branch === "observed-history" ? (
            <dl>
              <div><dt>Retained mass</dt><dd>Σ p̃(w | h) = {formatProbability(result.retainedMass)}</dd></div>
              <div><dt>Reserved mass</dt><dd>β̃(h) = 1 − {formatProbability(result.retainedMass)} = {formatProbability(result.reservedMass)}</dd></div>
              <div><dt>Eligible set</dt><dd>{result.eligibleLabels.join(", ")}</dd></div>
              <div><dt>Eligible lower-order mass</dt><dd>Σ p lower = {formatProbability(result.eligibleLowerOrderMass)}</dd></div>
              <div><dt>Normalizer</dt><dd>α = {formatProbability(result.reservedMass)} / {formatProbability(result.eligibleLowerOrderMass)} = {formatProbability(result.alpha)}</dd></div>
            </dl>
          ) : (
            <p>c(h) = 0, so equation (17) uses the lower-order estimator directly. β̃ and α are not computed for this branch.</p>
          )}
        </div>
      )}

      {showComparison && !isDefault && (
        <div class="comparison-register">
          <h3>Compared with authored default</h3>
          <table>
            <caption>State change from {defaultScenario.label} to {scenario.label}</caption>
            <thead><tr><th scope="col">Term</th><th scope="col">Default</th><th scope="col">Current</th></tr></thead>
            <tbody>
              <tr><th scope="row">β̃</th><td>{formatProbability(baselineResult.reservedMass)}</td><td>{formatProbability(result.reservedMass)}</td></tr>
              <tr><th scope="row">Eligible lower-order mass</th><td>{formatProbability(baselineResult.eligibleLowerOrderMass)}</td><td>{formatProbability(result.eligibleLowerOrderMass)}</td></tr>
              <tr><th scope="row">α</th><td>{formatProbability(baselineResult.alpha)}</td><td>{formatProbability(result.alpha)}</td></tr>
            </tbody>
          </table>
        </div>
      )}

      <details class="checkpoint">
        <summary>Why does only the zero branch use lower-order probability?</summary>
        <p>Katz's combined estimator keeps a nonzero discounted higher-order estimate. The α-scaled lower-order term is activated only when that estimate is zero. This is hard backoff, not an all-event interpolation rule.</p>
      </details>
    </section>
  );
}
