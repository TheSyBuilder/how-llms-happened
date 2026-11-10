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
export function mismatchingRows(rule: typeof patternRules[number], examples: Example[]) {
  return examples.flatMap((example, i) =>
    rule.apply(example.input).every((word, j) => word === example.output[j]) ? [] : [i + 1],
  );
}
export function fittingRules(examples: Example[]) {
  return patternRules.filter(rule => mismatchingRows(rule, examples).length === 0);
}
const pairText = (pair: Pair) => pair.join(" ");
const query: Pair = ["blue", "gold"];

export default function Gpt3Toy() {
  const [count, setCount] = useState(1);
  const [set, setSet] = useState<"swap" | "first">("swap");
  const [conflict, setConflict] = useState(false);
  const [useWritten, setUseWritten] = useState(false);
  const [written, setWritten] = useState<Example>({ input: ["red", "blue"], output: ["blue", "red"] });
  const examples = promptExamples(set, count, conflict);
  if (useWritten && count > 0) examples[0] = written;
  const fits = fittingRules(examples);
  const mode = count === 0 ? "No examples" : count === 1 ? "One-shot" : "Few-shot";
  const answer = fits.length === 1 ? pairText(fits[0]!.apply(query)) : fits.length === 0 ? "No rule fits" : "Several answers fit";
  return (
    <div class="gpt3-toy">
      <div class="toy-topline"><strong>Teach by showing.</strong><span class="toy-label">Toy · four fixed rules</span></div>
      <p>Change the examples. The four rules stay fixed.</p>
      <fieldset class="example-picker">
        <legend>Demonstrations to show</legend>
        <div class="example-options">{(["swap", "first"] as const).map((value, i) => <label key={value}><input type="radio" name="example-set" value={value} checked={set === value} onChange={() => setSet(value)} />Set {i === 0 ? "A" : "B"}</label>)}</div>
      </fieldset>
      <div class="toy-controls">
        <label for="example-count">Examples in the prompt <output for="example-count">{count} · {mode}</output></label>
        <input id="example-count" type="range" min="0" max="3" step="1" value={count} aria-describedby="examples-help" aria-valuetext={`${count} examples; ${mode}; ${fits.length} rules fit`} onInput={event => setCount(Number(event.currentTarget.value))} />
        <div class="range-ends"><span>0 · no examples</span><span>3 · few-shot</span></div>
      </div>
      <div class="pattern-prompt" aria-label="Toy prompt">
        <p class="pattern-label">Continue the pattern</p>
        <ol aria-label="Examples in this prompt">{examples.map((example, i) => <li key={i} class={conflict && i === 2 ? "conflicting-example" : ""}><span class="pattern-row-number" aria-hidden="true">{i + 1}</span><code dir="ltr">{pairText(example.input)} <span aria-hidden="true">→</span><span class="screen-reader-only">becomes</span> <strong>{pairText(example.output)}</strong></code>{useWritten && i === 0 && <span class="pattern-written-label">Yours</span>}</li>)}</ol>
        {count === 0 && <p class="empty-prompt">No demonstrations yet.</p>}
        <p class="pattern-query"><code dir="ltr">{pairText(query)} → <strong>?</strong></code></p>
      </div>
      <details class="pattern-editor">
        <summary>Can one example be enough?</summary>
        <p>Try two different input words. Change the answer to teach another rule.</p>
        <label class="pattern-conflict"><input type="checkbox" checked={useWritten} onChange={event => { setUseWritten(event.currentTarget.checked); if (event.currentTarget.checked && count === 0) setCount(1); }} />Replace row 1 with mine</label>
        <div class="pattern-word-fields">
          {(["input", "output"] as const).map(side => <fieldset disabled={!useWritten} key={side}>
            <legend>{side === "input" ? "Input words" : "Shown answer"}</legend>
            <div>{([0, 1] as const).map(position => <label key={position}>
              <span>{position === 0 ? "First word" : "Second word"}</span>
              <select aria-label={`${side === "input" ? "Input" : "Answer"} word ${position + 1}`} value={written[side][position]} onChange={event => {
                const pair: [string, string] = [...written[side]];
                pair[position] = event.currentTarget.value;
                setWritten({ ...written, [side]: pair });
              }}>{["red", "blue", "gold"].map(word => <option key={word} value={word}>{word}</option>)}</select>
            </label>)}</div>
          </fieldset>)}
        </div>
        <p class="pattern-editor-note" role="status" aria-atomic="true">{!useWritten ? "Untick to restore the original row." : count === 0 ? "Your row is hidden at zero examples. Add one to use it again." : <><code dir="ltr">{pairText(written.input)} → {pairText(written.output)}</code><output data-testid="written-fit-count">{`${fits.length} of 4 fit`}</output></>}</p>
      </details>
      <label class="pattern-conflict"><input type="checkbox" checked={conflict} onChange={event => { setConflict(event.currentTarget.checked); if (event.currentTarget.checked) setCount(3); }} />Give example 3 a conflicting answer</label>
      <div class="pattern-results" aria-live="polite" aria-atomic="true">
        <div class="pattern-answer"><span>Continuation</span><output data-testid="pattern-answer" dir={fits.length === 1 ? "ltr" : undefined}>{answer}</output><p data-testid="pattern-explanation">{fits.length === 0 ? "No rule in this bank explains every row. Check which rows disagree below." : fits.length === 1 ? "One rule fits every example and answers the new pair." : count === 0 ? "Without examples, all four rules are possible." : "A repeated word hides the difference. Try two different input words."}</p></div>
        <p class="pattern-label">Fixed rule bank · <output data-testid="fitting-count">{fits.length} of 4 fit</output></p>
        <ul class="pattern-rules">{patternRules.map(rule => {
          const misses = mismatchingRows(rule, examples);
          return <li key={rule.id} class={misses.length === 0 ? "rule-fits" : "rule-out"} data-testid={`rule-${rule.id}`}><span><strong>{rule.label}</strong><small>{misses.length === 0 ? "Fits prompt" : <><span>{misses.length === 1 ? "Disagrees with row" : "Disagrees with rows"}</span>{" "}<bdi dir="ltr">{misses.join(", ")}</bdi></>}</small></span><code dir="ltr">{pairText(rule.apply(query))}</code></li>;
        })}</ul>
      </div>
      <p id="examples-help">Useful clues matter more than the number of examples in this toy.</p>
      <details class="toy-method"><summary>About this toy</summary><p class="toy-footnote">This is a rule filter, not GPT-3. It has no neural network or training. Real models predict text rather than crossing rules off a list.</p></details>
    </div>
  );
}
