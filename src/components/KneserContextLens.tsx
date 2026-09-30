import { useMemo, useState } from "preact/hooks";

import {
  calculateKneserState,
  type KneserCandidateResult,
  type KneserFixture,
  type KneserScenario,
  type KneserState,
} from "../lib/kneser-ney-engine.ts";
import type { Mode } from "../lib/site-data.ts";

type Prediction = "first" | "second" | "same";

type Props = {
  fixture: KneserFixture;
  mode: Mode;
};

function formatProbability(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 3, minimumFractionDigits: 0 });
}

function formatPercent(value: number): string {
  return `${(value * 100).toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
}

function selectScenario(scenarios: KneserScenario[], id: string): KneserScenario {
  const scenario = scenarios.find((item) => item.id === id);
  if (scenario === undefined) throw new Error(`Unknown Kneser–Ney scenario ${id}.`);
  return scenario;
}

function selectState(states: KneserState[], id: string): KneserState {
  const state = states.find((item) => item.id === id);
  if (state === undefined) throw new Error(`Unknown Kneser–Ney state ${id}.`);
  return state;
}

function higherCandidate(candidates: KneserCandidateResult[], key: "ordinaryProbability" | "distinctContextProbability"): string {
  const [first, second] = candidates;
  if (first === undefined || second === undefined) return "unavailable";
  if (Math.abs(first[key] - second[key]) <= 1e-9) return "tie";
  return first[key] > second[key] ? first.label : second.label;
}

export default function KneserContextLens({ fixture, mode }: Props) {
  const scenarios = useMemo(
    () => fixture.scenarios.filter((scenario) => scenario.modes.includes(mode)),
    [fixture, mode],
  );
  const defaultScenario = scenarios[0];
  if (defaultScenario === undefined) throw new Error(`No ${mode} Kneser–Ney scenario is available.`);

  const [scenarioId] = useState(defaultScenario.id);
  const scenario = selectScenario(scenarios, scenarioId);
  const defaultState = scenario.states[0];
  const controlledAfterState = scenario.states[1];
  if (defaultState === undefined || controlledAfterState === undefined) {
    throw new Error(`Kneser–Ney scenario ${scenario.id} needs a default and controlled after-state.`);
  }
  const [stateId, setStateId] = useState(defaultState.id);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [feedback, setFeedback] = useState("");
  const [showComparison, setShowComparison] = useState(false);
  const state = selectState(scenario.states, stateId);
  const stateIndex = scenario.states.findIndex((item) => item.id === state.id);
  const result = calculateKneserState(state);
  const defaultResult = calculateKneserState(defaultState);
  const afterResult = calculateKneserState(controlledAfterState);
  const ordinaryLeader = higherCandidate(result.candidates, "ordinaryProbability");
  const contextLeader = higherCandidate(result.candidates, "distinctContextProbability");
  const [firstCandidate, secondCandidate] = result.candidates;
  const defaultFocus = defaultResult.candidates.find((candidate) => candidate.label === scenario.focusWord);
  const afterFocus = afterResult.candidates.find((candidate) => candidate.label === scenario.focusWord);
  const focusResult = result.candidates.find((candidate) => candidate.label === scenario.focusWord);
  if (firstCandidate === undefined || secondCandidate === undefined || defaultFocus === undefined || afterFocus === undefined || focusResult === undefined) {
    throw new Error(`Kneser–Ney scenario ${scenario.id} is missing its comparison candidates or focus word.`);
  }
  const predictionOptions: Array<{ value: Prediction; label: string }> = [
    { value: "first", label: firstCandidate.label },
    { value: "second", label: secondCandidate.label },
    { value: "same", label: "They receive the same fallback weight" },
  ];
  const correctPrediction: Prediction = contextLeader === "tie"
    ? "same"
    : contextLeader === firstCandidate.label ? "first" : "second";

  const updateState = (nextIndex: number, direction: "existing" | "new") => {
    const next = scenario.states[nextIndex];
    if (next === undefined) return;
    setStateId(next.id);
    setPrediction(null);
    setShowComparison(false);
    setFeedback(
      direction === "new"
        ? `One ${scenario.focusWord} occurrence moved to a new predecessor. Its raw count remains ${focusResult.rawCount}; N₊ is now ${calculateKneserState(next).candidates.find((candidate) => candidate.label === scenario.focusWord)?.distinctContextCount}.`
        : `One ${scenario.focusWord} occurrence returned to an existing predecessor. Its raw count remains ${focusResult.rawCount}; N₊ is now ${calculateKneserState(next).candidates.find((candidate) => candidate.label === scenario.focusWord)?.distinctContextCount}.`,
    );
  };

  const checkPrediction = (event: Event) => {
    event.preventDefault();
    if (prediction === null) {
      setFeedback("Choose a prediction before checking it.");
      return;
    }
    const correct = prediction === correctPrediction;
    const leaderText = contextLeader === "tie"
      ? "the two candidates tie"
      : `${contextLeader} receives more distinct-context fallback weight`;
    setFeedback(
      correct
        ? `Correct. ${leaderText}; raw frequency does not choose this fallback ranking.`
        : `Not quite. ${leaderText} because N₊ counts represented predecessor contexts, not repeated tokens within one row.`,
    );
  };

  const reset = () => {
    setStateId(defaultState.id);
    setPrediction(null);
    setShowComparison(false);
    setFeedback("Workbench reset to the concentrated authored state.");
  };

  return (
    <section class={`mass-ledger kneser-lens mass-ledger--${mode}`} data-state={state.id} aria-labelledby="kneser-lens-title">
      <header class="ledger-header">
        <div>
          <p class="kicker">{fixture.label} · Kneser–Ney 1995</p>
          <h2 id="kneser-lens-title">Hold frequency still. Change coverage.</h2>
        </div>
        <p class="ledger-folio">Fixture 03 · no paper corpus reproduced</p>
      </header>

      <form class="ledger-controls" onSubmit={checkPrediction}>
        <div class="coverage-invariant">
          <span>Controlled variable</span>
          <strong>{scenario.focusWord} = {focusResult.rawCount} tokens in every state</strong>
        </div>
        <fieldset>
          <legend>Predict before checking</legend>
          <p class="prediction-question">{scenario.prompt}</p>
          {predictionOptions.map((option) => (
            <label class="radio-choice">
              <input
                type="radio"
                name="kneser-prediction"
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
          <button
            class="button button--quiet"
            type="button"
            disabled={stateIndex <= 0}
            onClick={() => updateState(stateIndex - 1, "existing")}
          >
            Move to existing context
          </button>
          <button
            class="button button--quiet"
            type="button"
            disabled={stateIndex >= scenario.states.length - 1}
            onClick={() => updateState(stateIndex + 1, "new")}
          >
            Move to new context
          </button>
          <button class="button button--quiet" type="button" onClick={reset}>Reset</button>
          <button
            class="button button--quiet"
            type="button"
            disabled={state.id === defaultState.id}
            onClick={() => setShowComparison((value) => !value)}
          >
            {showComparison ? "Hide before state" : "Compare before"}
          </button>
        </div>
        <p class="ledger-live" role="status" aria-live="polite">{feedback}</p>
      </form>

      <div class="scenario-register coverage-register">
        <dl>
          <div><dt>State</dt><dd>{state.label}</dd></div>
          <div><dt>Raw-frequency leader</dt><dd>{ordinaryLeader}</dd></div>
          <div><dt>Context-coverage leader</dt><dd>{contextLeader}</dd></div>
          <div><dt>Historical branch</dt><dd>1995 hard backoff</dd></div>
        </dl>
        <p>{state.description}</p>
      </div>

      <div class="coverage-map" aria-label="Occurrence rows grouped by continuation and predecessor context">
        {result.candidates.map((candidate) => (
          <section class="coverage-candidate" aria-labelledby={`coverage-${candidate.label}`}>
            <header>
              <h3 id={`coverage-${candidate.label}`}>{candidate.label}</h3>
              <span>{candidate.rawCount} tokens · {candidate.distinctContextCount} contexts</span>
            </header>
            <ol>
              {candidate.contexts.map((context, contextIndex) => (
                <li>
                  <span class="context-label">{context.predecessor}</span>
                  <span class="occurrence-stack">
                    {Array.from({ length: context.count }, (_, occurrenceIndex) => {
                      const canMoveNew = candidate.label === scenario.focusWord
                        && contextIndex === 0
                        && occurrenceIndex === context.count - 1
                        && stateIndex < scenario.states.length - 1;
                      const canMoveExisting = candidate.label === scenario.focusWord
                        && contextIndex === candidate.contexts.length - 1
                        && occurrenceIndex === 0
                        && stateIndex > 0;
                      const occurrenceLabel = `${candidate.label}, ${context.predecessor}, occurrence ${occurrenceIndex + 1} of ${context.count}`;
                      if (canMoveNew) {
                        return <button type="button" class="occurrence-tile occurrence-tile--action" aria-label={`${occurrenceLabel}; move to a new predecessor context`} onClick={() => updateState(stateIndex + 1, "new")}></button>;
                      }
                      if (canMoveExisting) {
                        return <button type="button" class="occurrence-tile occurrence-tile--action" aria-label={`${occurrenceLabel}; move back to an existing predecessor context`} onClick={() => updateState(stateIndex - 1, "existing")}></button>;
                      }
                      return <span class="occurrence-tile" aria-hidden="true"></span>;
                    })}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <div class="ledger-table-wrap coverage-summary" tabIndex={0} aria-label="Scrollable context-coverage comparison table">
        <table>
          <caption>Frequency and fallback evidence in the active synthetic state</caption>
          <thead>
            <tr>
              <th scope="col">Continuation</th>
              <th scope="col">Raw tokens</th>
              <th scope="col">Ordinary p</th>
              <th scope="col">N₊ contexts</th>
              <th scope="col">β from N₊</th>
              {mode === "expert" && <th scope="col">N₁ contexts</th>}
              {mode === "expert" && <th scope="col">β from N₁</th>}
            </tr>
          </thead>
          <tbody>
            {result.candidates.map((candidate) => (
              <tr>
                <th scope="row">{candidate.label}</th>
                <td><strong>{candidate.rawCount}</strong></td>
                <td>{formatProbability(candidate.ordinaryProbability)}</td>
                <td><strong>{candidate.distinctContextCount}</strong></td>
                <td>{formatProbability(candidate.distinctContextProbability)}</td>
                {mode === "expert" && <td>{candidate.singletonContextCount}</td>}
                {mode === "expert" && <td>{formatProbability(candidate.singletonContextProbability)}</td>}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              <td>{result.totalTokens}</td>
              <td>1</td>
              <td>{result.totalDistinctContexts}</td>
              <td>1</td>
              {mode === "expert" && <td>{result.totalSingletonContexts}</td>}
              {mode === "expert" && <td>1</td>}
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="fallback-allocation" aria-label="Fallback allocation separated from reserve size">
        <div>
          <p class="account-label">Reserve size</p>
          <strong>Not set by this lens</strong>
          <p>Seen-event discounting determines how much probability is available for zero-count events.</p>
        </div>
        <div>
          <p class="account-label">Fallback allocation · β from N₊</p>
          <div class="allocation-bar" role="img" aria-label={result.candidates.map((candidate) => `${candidate.label} ${formatPercent(candidate.distinctContextProbability)}`).join(" and ")}>
            {result.candidates.map((candidate, index) => (
              <span class={index === 0 ? "allocation-focus" : "allocation-peer"} style={{ width: formatPercent(candidate.distinctContextProbability) }}>
                {formatPercent(candidate.distinctContextProbability)}
              </span>
            ))}
          </div>
          <p>The 1995 β distribution divides whatever reserve the hard-backoff branch supplies.</p>
        </div>
      </div>

      {mode === "expert" && (
        <div class="calculation-trace" aria-label="Kneser–Ney calculation trace">
          <h3>Calculation trace</h3>
          <dl>
            {result.candidates.map((candidate) => (
              <div>
                <dt>{candidate.label} · distinct contexts</dt>
                <dd>N₊ = {candidate.distinctContextCount}; β₊ = {candidate.distinctContextCount}/{result.totalDistinctContexts} = {formatProbability(candidate.distinctContextProbability)}</dd>
              </div>
            ))}
            {result.candidates.map((candidate) => (
              <div>
                <dt>{candidate.label} · singleton contexts</dt>
                <dd>N₁ = {candidate.singletonContextCount}; β₁ = {candidate.singletonContextCount}/{result.totalSingletonContexts} = {formatProbability(candidate.singletonContextProbability)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {showComparison && state.id !== defaultState.id && (
        <div class="comparison-register">
          <h3>Before state pinned</h3>
          <table>
            <caption>Raw count stays fixed while context evidence changes</caption>
            <thead><tr><th scope="col">Measure</th><th scope="col">Before</th><th scope="col">Current</th></tr></thead>
            <tbody>
              <tr><th scope="row">{scenario.focusWord} raw tokens</th><td>{defaultFocus.rawCount}</td><td>{focusResult.rawCount}</td></tr>
              <tr><th scope="row">{scenario.focusWord} N₊</th><td>{defaultFocus.distinctContextCount}</td><td>{focusResult.distinctContextCount}</td></tr>
              <tr><th scope="row">{scenario.focusWord} β from N₊</th><td>{formatProbability(defaultFocus.distinctContextProbability)}</td><td>{formatProbability(focusResult.distinctContextProbability)}</td></tr>
              {mode === "expert" && <tr><th scope="row">{scenario.focusWord} β from N₁</th><td>{formatProbability(defaultFocus.singletonContextProbability)}</td><td>{formatProbability(focusResult.singletonContextProbability)}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <details class="static-pair">
        <summary>Static before-and-after audit</summary>
        <div class="ledger-table-wrap">
          <table>
            <caption>One controlled move, available without the occurrence graphic</caption>
            <thead><tr><th scope="col">State</th><th scope="col">{scenario.focusWord} tokens</th><th scope="col">{scenario.focusWord} N₊</th><th scope="col">{scenario.focusWord} β from N₊</th></tr></thead>
            <tbody>
              <tr><th scope="row">Before · concentrated</th><td>{defaultFocus.rawCount}</td><td>{defaultFocus.distinctContextCount}</td><td>{formatProbability(defaultFocus.distinctContextProbability)}</td></tr>
              <tr><th scope="row">After · one new context</th><td>{afterFocus.rawCount}</td><td>{afterFocus.distinctContextCount}</td><td>{formatProbability(afterFocus.distinctContextProbability)}</td></tr>
            </tbody>
          </table>
        </div>
      </details>

      <details class="checkpoint">
        <summary>Did the move create more reserve—or change its destination?</summary>
        <p>It changed the destination rule. The raw count stayed fixed, while one new predecessor raised dollars' distinct-context count. Seen-event discounting determines reserve size; β decides how that reserve is divided among zero-count continuations.</p>
      </details>
    </section>
  );
}
