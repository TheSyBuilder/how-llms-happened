import { useState } from "preact/hooks";

type Features = readonly [number, number];
type Answer = { text: string; features: Features; note: string };
export type Choice = "a" | "b" | null;
export const comparisons: { title: string; a: Answer; b: Answer }[] = [
  {
    title: "1 · Which length works better?",
    a: { text: "Cloud drops get heavy and fall as rain.", features: [1, 1], note: "Short · everyday words" },
    b: { text: "Cloud drops get so heavy that the air can no longer hold them up, and then they fall to the ground as rain.", features: [0, 1], note: "Long · everyday words" },
  },
  {
    title: "2 · Which wording works better?",
    a: { text: "Cloud drops get heavy and fall as rain.", features: [1, 1], note: "Short · everyday words" },
    b: { text: "Rain is liquid precipitation from atmospheric condensation.", features: [1, 0], note: "Short · technical words" },
  },
];
export const candidates: Answer[] = [
  { text: "Snow is frozen water falling as flakes.", features: [1, 1], note: "Short · everyday words" },
  { text: "Snow consists of ice crystals aggregated into flakes that precipitate from atmospheric clouds.", features: [0, 0], note: "Long · technical words" },
  { text: "Snow is tiny pieces of the Moon falling down.", features: [1, 1], note: "Deliberately false · same features as A" },
];
export const rewardScore = (weights: Features, features: Features) => weights[0] * features[0] + weights[1] * features[1];

export function learnPreferences(choices: Choice[]): [number, number] {
  const weights: [number, number] = [0, 0];
  const labelled = comparisons.flatMap((pair, i) => {
    const choice = choices[i];
    if (!choice) return [];
    const winner = pair[choice].features;
    const loser = pair[choice === "a" ? "b" : "a"].features;
    return [[winner[0] - loser[0], winner[1] - loser[1]] as Features];
  });
  if (labelled.length === 0) return weights;
  // Fit a tiny pairwise logistic scorer from scratch whenever a choice changes.
  for (let step = 0; step < 100; step++) {
    const gradient: [number, number] = [0, 0];
    for (const difference of labelled) {
      const error = 1 / (1 + Math.exp(rewardScore(weights, difference)));
      for (const j of [0, 1] as const) gradient[j] += error * difference[j] / labelled.length;
    }
    for (const j of [0, 1] as const) weights[j] += 0.2 * (gradient[j] - 0.1 * weights[j]);
  }
  return weights;
}

export function responseProbabilities(weights: Features, strength: number) {
  const logits = candidates.map(answer => strength * rewardScore(weights, answer.features));
  const max = Math.max(...logits);
  const masses = logits.map(value => Math.exp(value - max));
  const total = masses.reduce((sum, value) => sum + value, 0);
  return masses.map(value => value / total);
}

export default function HumanFeedbackToy() {
  const [choices, setChoices] = useState<Choice[]>([null, null]);
  const [strength, setStrength] = useState(2);
  const weights = learnPreferences(choices);
  const probabilities = responseProbabilities(weights, strength);
  const count = choices.filter(Boolean).length;
  const signed = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
  return <div class="feedback-toy">
    <div class="toy-topline"><strong>Be the comparison teacher.</strong><span class="toy-label">Toy · invented answers</span></div>
    <p>Prompt: “Explain rain to a child.” Pick one answer in each pair; change your mind anytime.</p>
    <div class="feedback-workbench">
    <div class="feedback-learning" role="status" aria-atomic="true">
      <strong>Your learned scorer</strong>
      <p>{count}/2 comparisons · how much each trait counts</p>
      <div class="feedback-weights"><span>Short answers <output data-testid="short-weight">{signed(weights[0])}</output></span><span>Everyday words <output data-testid="everyday-weight">{signed(weights[1])}</output></span></div>
    </div>
    <div class="feedback-comparisons">{comparisons.map((pair, i) => <fieldset class="feedback-pair" key={i}>
      <legend>{pair.title}</legend>
      <div class="feedback-options">{(["a", "b"] as const).map(key => <label key={key}>
        <span class="feedback-choice"><input type="radio" name={`feedback-pair-${i}`} checked={choices[i] === key} onChange={() => setChoices(current => current.map((choice, j) => j === i ? key : choice))} /><strong>Prefer {key.toUpperCase()}</strong></span>
        <span>{pair[key].text}</span><small>{pair[key].note}</small>
      </label>)}</div>
    </fieldset>)}</div>
    </div>
    <div class="feedback-sampler">
      <h3>Now let a sampler follow that score.</h3>
      <p>New prompt: “Explain snow to a child.” The sampler chooses among these fixed answers; each starts equally likely.</p>
      <div class="toy-controls">
        <label for="reward-strength">Chase the score <output for="reward-strength">{strength}</output></label>
        <input id="reward-strength" type="range" min="0" max="5" step="1" value={strength} aria-valuetext={`${strength}: ${strength === 0 ? "ignore scores" : "favour higher scores"}`} onInput={event => setStrength(Number(event.currentTarget.value))} />
        <div class="range-ends"><span>0 · ignore it</span><span>5 · chase it</span></div>
      </div>
      <ol class="feedback-candidates" aria-label="Toy answer selection probabilities">{candidates.map((answer, i) => <li key={i}>
        <div class="feedback-candidate-heading"><strong>{String.fromCharCode(65 + i)}</strong><span>Score {rewardScore(weights, answer.features).toFixed(2)}</span><output data-testid={`feedback-probability-${i}`} aria-label={`Answer ${String.fromCharCode(65 + i)} selection probability`}>{(100 * probabilities[i]!).toFixed(1)}%</output></div>
        <p>{answer.text}</p><small>{answer.note}</small>
        <div class="feedback-track" aria-hidden="true"><span style={{ width: `${100 * probabilities[i]!}%` }} /></div>
      </li>)}</ol>
    </div>
    <p class="feedback-catch">A and C always tie. This scorer sees style, not truth. Chasing its score cannot fix that.</p>
    <button class="another-continuation" onClick={() => { setChoices([null, null]); setStrength(2); }}>Reset comparisons</button>
    <p class="toy-footnote">Two hand-labelled traits, a learned scorer, and three fixed answers. Bars show selection chances, not correctness. Only the scorer is trained here.</p>
  </div>;
}
