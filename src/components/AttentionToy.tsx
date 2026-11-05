import '../i18n/preact';
import { useState } from "preact/hooks";

// Deliberately hand-chosen vectors: this is a toy, not a trained language model.
const words = ["The", "cat", "sat", "on", "the", "mat"];
const keys: readonly (readonly [number, number])[] = [
  [0, 0],
  [2, 0],
  [0, 2],
  [0, 1],
  [0, 0],
  [1, 0],
];
const values = [0, 1, 0, 0, 0, 1];

export function attend(direction: number, position: number, causal: boolean) {
  const q: [number, number] = [direction / 100, 1 - direction / 100];
  const matches = keys.map(k => (q[0] * k[0] + q[1] * k[1]) / Math.sqrt(2));
  const scores = matches.map((match, i) => causal && i > position ? -Infinity : match);
  const peak = Math.max(...scores);
  const exp = scores.map((score) => Math.exp(score - peak));
  const sum = exp.reduce((a, b) => a + b, 0);
  const weights = exp.map((value) => value / sum);
  const contributions = weights.map((weight, i) => weight * values[i]!);
  const largest = Math.max(...weights);
  return {
    query: q,
    matches,
    weights,
    contributions,
    strongestPositions: weights.flatMap((weight, i) => Math.abs(weight - largest) < 1e-12 ? [i] : []),
    mixture: contributions.reduce((sum, contribution) => sum + contribution, 0),
  };
}

export default function AttentionToy() {
  const [direction, setDirection] = useState(80);
  const [position, setPosition] = useState(2);
  const [causal, setCausal] = useState(false);
  const [inspected, setInspected] = useState(1);
  const { query, matches, weights, contributions, strongestPositions, mixture } = attend(direction, position, causal);
  const winner = words[strongestPositions[0]!];
  const hidden = causal && inspected > position;
  return (
    <div class="attention-toy">
      <div class="toy-topline">
        <span class="eyebrow">A tiny attention playground</span>
        <span class="toy-label">Toy · hand-chosen numbers</span>
      </div>
      <p>Pick where the query sits, then steer it toward actions or things. This toy keeps the query direction when you pick another word.</p>
      <fieldset class="token-picker">
        <legend>1. Which word is looking?</legend>
        <div class="tokens">
          {words.map((word, i) => (
            <button
              type="button"
              aria-pressed={position === i}
              aria-label={`${word}, word ${i + 1}`}
              onClick={() => setPosition(i)}
            >
              {word}
              <span>{i + 1}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <div class="toy-controls">
        <label for="query-direction">
          2. What is it looking for?{" "}
          <output for="query-direction">
            {direction < 50 ? "Actions" : "Things"}
          </output>
        </label>
        <input
          id="query-direction"
          type="range"
          min="0"
          max="100"
          value={direction}
          onInput={(event) => setDirection(Number(event.currentTarget.value))}
          aria-valuetext={`${100 - direction}% actions, ${direction}% things`}
        />
        <div class="range-ends">
          <span>More like “sat”</span>
          <span>More like “cat”</span>
        </div>
        <label class="mask-toggle">
          <input
            type="checkbox"
            checked={causal}
            onChange={(event) => setCausal(event.currentTarget.checked)}
          />{" "}
          Hide future words <span>(causal mask)</span>
        </label>
      </div>
      <svg
        class="attention-arcs"
        viewBox="0 0 600 110"
        role="img"
        aria-label={`Attention from word ${position + 1}, ${words[position]}. Thicker lines carry more weight.`}
      >
        {weights.map(
          (weight, i) =>
            weight > 0 && (
              <path
                d={`M ${50 + position * 100} 8 Q ${50 + i * 100} 20 ${50 + i * 100} 100`}
                fill="none"
                stroke="currentColor"
                stroke-width={1 + weight * 15}
                opacity={0.2 + weight * 0.8}
              />
            ),
        )}
      </svg>
      <div class="weight-grid" aria-label="Attention weights">
        {words.map((word, i) => (
          <div
            class={
              causal && i > position ? "weight-cell is-masked" : "weight-cell"
            }
          >
            <span>{word}</span>
            <div class="weight-track">
              <span style={{ height: `${weights[i]! * 100}%` }} />
            </div>
            <output aria-label={`Weight for word ${i + 1}`}>
              {causal && i > position
                ? "Hidden"
                : `${(weights[i]! * 100).toFixed(1)}%`}
            </output>
          </div>
        ))}
      </div>
      <div class="toy-result" role="status" aria-live="polite">
        <strong data-testid="attention-winner">
          {strongestPositions.length === 1
            ? `“${winner}” gets the biggest share.`
            : `${strongestPositions.length} words tie for the biggest share.`}
        </strong>
        <p>
          The read mixes value numbers: cat and mat carry 1; the others carry 0.
          Its output is{" "}
          <output data-testid="mixture">{mixture.toFixed(3)}</output>. Change
          the weights and you change the mixture.
        </p>
        {causal && (
          <p>
            Words after “{words[position]}” get zero weight. The visible weights
            add up to 100% again.
          </p>
        )}
      </div>
      <details class="toy-method attention-inspector">
        <summary>Follow the numbers</summary>
        <label class="attention-inspect-label" for="inspect-word">
          Follow one word
          <select id="inspect-word" value={inspected} onChange={event => setInspected(Number(event.currentTarget.value))}>
            {words.map((word, i) => <option value={i}>{`${word}, word ${i + 1}`}</option>)}
          </select>
        </label>
        <ol class="attention-read-steps">
          <li>
            <h4>1. Match query to key</h4>
            <div>
              <div class="attention-vectors">
                <span>Query <output dir="ltr">[{query.map(n => n.toFixed(2)).join(", ")}]</output></span>
                <span>Key <output dir="ltr">[{keys[inspected]!.join(", ")}]</output></span>
              </div>
              <p class="attention-arithmetic" dir="ltr">
                ({query[0].toFixed(2)} × {keys[inspected]![0]} + {query[1].toFixed(2)} × {keys[inspected]![1]}) / √2 = <output data-testid="inspected-match">{matches[inspected]!.toFixed(3)}</output>
              </p>
            </div>
          </li>
          <li>
            <h4>2. Give it a share</h4>
            <div>
              <output class="attention-step-number" data-testid="inspected-weight">{(weights[inspected]! * 100).toFixed(1)}%</output>
              <p>{hidden ? "This word is hidden. Its match is excluded before shares are calculated." : "Softmax compares all allowed matches and makes their shares add up to 100%."}</p>
            </div>
          </li>
          <li>
            <h4>3. Mix the values</h4>
            <div>
              <p>Share × value = contribution</p>
              <p class="attention-arithmetic" dir="ltr">{weights[inspected]!.toFixed(3)} × {values[inspected]} = <output data-testid="inspected-contribution">{contributions[inspected]!.toFixed(3)}</output></p>
              <p>Add every word’s contribution to get the read.</p>
              <div class="attention-contributions" dir="ltr">
                {words.map((word, i) => <span><b>{word}</b><output>{contributions[i]!.toFixed(3)}</output></span>)}
              </div>
              <p class="attention-total">Read <output data-testid="inspected-total">{mixture.toFixed(3)}</output></p>
              <p class="toy-footnote">Displayed numbers are rounded.</p>
            </div>
          </li>
        </ol>
      </details>
      <details class="toy-method"><summary>About this toy</summary><p class="toy-footnote">
        This toy illustrates one attention head. Real queries, keys, and values
        are learned vectors; this slider’s directions and value numbers are
        chosen just to make the mechanism visible.
      </p></details>
    </div>
  );
}
