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
  const scores = keys.map((k, i) =>
    causal && i > position
      ? -Infinity
      : (q[0] * k[0] + q[1] * k[1]) / Math.sqrt(2),
  );
  const peak = Math.max(...scores);
  const exp = scores.map((score) => Math.exp(score - peak));
  const sum = exp.reduce((a, b) => a + b, 0);
  const weights = exp.map((value) => value / sum);
  return {
    weights,
    mixture: weights.reduce((sum, weight, i) => sum + weight * values[i]!, 0),
  };
}

export default function AttentionToy() {
  const [direction, setDirection] = useState(80);
  const [position, setPosition] = useState(2);
  const [causal, setCausal] = useState(false);
  const { weights, mixture } = attend(direction, position, causal);
  const winner = words[weights.indexOf(Math.max(...weights))];
  return (
    <div class="attention-toy">
      <div class="toy-topline">
        <span class="eyebrow">A tiny attention playground</span>
        <span class="toy-label">Toy · hand-chosen numbers</span>
      </div>
      <p>Pick the word doing the looking. Then change what it looks for.</p>
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
        <strong>“{winner}” gets the biggest share.</strong>
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
      <p class="toy-footnote">
        This toy illustrates one attention head. Real queries, keys, and values
        are learned vectors; this slider’s directions and value numbers are
        chosen just to make the mechanism visible.
      </p>
    </div>
  );
}
