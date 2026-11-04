import '../i18n/preact';
import { useState } from "preact/hooks";

type Pair = readonly [string, string];
export type Example = { input: Pair; output: Pair };
export const patternRules = [
  { id: "keep", label: "Keep the order", apply: ([a, b]: Pair): Pair => [a, b] },
  { id: "swap", label: "Swap the pair", apply: ([a, b]: Pair): Pair => [b, a] },
  { id: "first", label: "Repeat the first", apply: ([a]: Pair): Pair => [a, a] },
  { id: "last", label: "Repeat the last", apply: ([, b]: Pair): Pair => [b, b] },
];
export function promptExamples(set: "swap" | "first", count: number, conflict = false): Example[] {
  const inputs: Pair[] = [["red", "red"], ["red", "blue"], ["gold", "red"]];
  const rule = patternRules.find(rule => rule.id === set)!;
  return inputs.slice(0, count).map((input, i) => ({
    input,
    output: conflict && i === 2 ? input : rule.apply(input),
  }));
}
export function fittingRules(examples: Example[]) {
  return patternRules.filter(rule => examples.every(example =>
    rule.apply(example.input).every((word, i) => word === example.output[i]),
  ));
}
const pairText = (pair: Pair) => pair.join(" ");
const query: Pair = ["blue", "gold"];

export default function Gpt3Toy() {
  const [count, setCount] = useState(1);
  const [set, setSet] = useState<"swap" | "first">("swap");
  const [conflict, setConflict] = useState(false);
  const examples = promptExamples(set, count, conflict);
  const fits = fittingRules(examples);
  const mode = count === 0 ? "No examples" : count === 1 ? "One-shot" : "Few-shot";
  const answer = fits.length === 1 ? pairText(fits[0]!.apply(query)) : fits.length === 0 ? "No rule fits" : "Several answers fit";
  return (
    <div class="gpt3-toy">
      <div class="toy-topline"><strong>Teach by showing.</strong><span class="toy-label">Toy · four fixed rules</span></div>
      <p>Add examples, then switch sets. Watch the answer change while the rule bank stays fixed.</p>
      <fieldset class="example-picker">
        <legend>Demonstrations to show</legend>
        <div class="example-options">{(["swap", "first"] as const).map((value, i) => <label><input type="radio" name="example-set" value={value} checked={set === value} onChange={() => setSet(value)} />Set {i === 0 ? "A" : "B"}</label>)}</div>
      </fieldset>
      <div class="toy-controls">
        <label for="example-count">Examples in the prompt <output for="example-count">{count} · {mode}</output></label>
        <input id="example-count" type="range" min="0" max="3" step="1" value={count} aria-describedby="examples-help" aria-valuetext={`${count} examples; ${mode}; ${fits.length} rules fit`} onInput={event => setCount(Number(event.currentTarget.value))} />
        <div class="range-ends"><span>0 · no examples</span><span>3 · few-shot</span></div>
      </div>
      <div class="pattern-prompt" aria-label="Toy prompt">
        <p class="pattern-label">Continue the pattern</p>
        <ol aria-label="Examples in this prompt">{examples.map((example, i) => <li class={conflict && i === 2 ? "conflicting-example" : ""}><code>{pairText(example.input)} <span aria-hidden="true">→</span><span class="screen-reader-only">becomes</span> <strong>{pairText(example.output)}</strong></code></li>)}</ol>
        {count === 0 && <p class="empty-prompt">No demonstrations yet.</p>}
        <p class="pattern-query"><code>{pairText(query)} → <strong>?</strong></code></p>
      </div>
      <label class="pattern-conflict"><input type="checkbox" checked={conflict} onChange={event => { setConflict(event.currentTarget.checked); if (event.currentTarget.checked) setCount(3); }} />Give example 3 a conflicting answer</label>
      <div class="pattern-results" aria-live="polite" aria-atomic="true">
        <div class="pattern-answer"><span>Continuation</span><output data-testid="pattern-answer">{answer}</output><p data-testid="pattern-explanation">{fits.length === 0 ? "The examples disagree. None of these four rules can explain them all." : fits.length === 1 ? "One rule fits every example. It also gives an answer for this new pair." : count === 0 ? "Without examples, all four rules are possible." : "“red red” looks the same under all four rules. Add a different pair to tell them apart."}</p></div>
        <p class="pattern-label">Fixed rule bank · <output data-testid="fitting-count">{fits.length} of 4 fit</output></p>
        <ul class="pattern-rules">{patternRules.map(rule => {
          const fitsPrompt = fits.includes(rule);
          return <li class={fitsPrompt ? "rule-fits" : "rule-out"} data-testid={`rule-${rule.id}`}><span><strong>{rule.label}</strong><small>{fitsPrompt ? "Fits prompt" : "Ruled out"}</small></span><code>{pairText(rule.apply(query))}</code></li>;
        })}</ul>
      </div>
      <p id="examples-help">One example can leave the task ambiguous. Two different pairs reveal it here. A conflicting example can break it.</p>
      <details class="toy-method"><summary>About this toy</summary><p class="toy-footnote">This is a rule filter, not GPT-3. It has no neural network or training. Real models predict text rather than crossing rules off a list.</p></details>
    </div>
  );
}
