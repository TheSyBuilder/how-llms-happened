import { useState } from "preact/hooks";

export const toyPassage = "Mira found a lost cat. She brought it home.";
export const promptEndings = [
  { label: "Continue", cue: "Then" },
  { label: "Summarise", cue: "TL;DR:" },
  { label: "Answer", cue: "Q: Who found the cat? A:" },
];
// A fixed, invented lookup table. These are not outputs from GPT-2.
export const continuationSnippets = [
  { cue: "Then", format: "Story", text: "the cat fell asleep by the window." },
  { cue: "Then", format: "Story", text: "Mira made a little bed for it." },
  { cue: "TL;DR:", format: "Summary", text: "Mira took a lost cat home." },
  { cue: "TL;DR:", format: "Summary", text: "A lost cat found a home with Mira." },
  { cue: "Q: Who found the cat? A:", format: "Answer", text: "Mira." },
  { cue: "Q: Who found the cat? A:", format: "Answer", text: "Mira found it." },
];
const normalise = (text: string) => text.trim().replace(/\s+/g, " ").toLowerCase();
export function matchContinuations(cue: string) {
  const key = normalise(cue);
  const matches = continuationSnippets.filter((snippet) => !key || normalise(snippet.cue) === key);
  return {
    matches,
    formats: ["Story", "Summary", "Answer"].map((format) => {
      const count = matches.filter((snippet) => snippet.format === format).length;
      return { format, count, share: matches.length ? count / matches.length : 0 };
    }),
  };
}

export default function Gpt2Toy() {
  const [cue, setCue] = useState("Then");
  const [sample, setSample] = useState(0);
  const result = matchContinuations(cue);
  const selected = result.matches.length ? result.matches[sample % result.matches.length] : undefined;
  const changeCue = (value: string) => { setCue(value); setSample(0); };
  return (
    <div class="gpt2-toy">
      <div class="toy-topline"><span class="eyebrow">One passage. Different jobs.</span><span class="toy-label">Toy · six fixed snippets</span></div>
      <p>Change the ending of the prompt. The lookup table stays fixed.</p>
      <div class="prompt-presets" role="group" aria-label="Prompt presets">
        {promptEndings.map((ending) => <button type="button" key={ending.label} aria-pressed={cue === ending.cue} onClick={() => changeCue(ending.cue)}>{ending.label}</button>)}
        <button type="button" aria-pressed={cue === ""} onClick={() => changeCue("")}>No cue</button>
      </div>
      <div class="prompt-paper">
        <span class="eyebrow">Prompt</span>
        <p>{toyPassage}</p>
        <label for="prompt-ending">Prompt ending · edit it<input id="prompt-ending" type="text" value={cue} maxLength={120} spellcheck={false} autoComplete="off" placeholder="Try TL;DR:" onInput={(event) => changeCue(event.currentTarget.value)} aria-describedby="cue-help" /></label>
        <p id="cue-help">Try “In a nutshell:” too. Can this lookup recognise a new cue?</p>
      </div>
      <div class="prompt-flow" aria-hidden="true"><span>↓</span> same fixed table <span>↓</span></div>
      <div class="continuation-paper" role="status" aria-live="polite" aria-atomic="true">
        <span class="eyebrow">Toy continuation</span>
        <p class="continuation-text" data-testid="toy-continuation">{selected ? selected.text : "No matching cue."}</p>
        <p class="continuation-note">{selected ? `${result.matches.length} of 6 snippets available. ${cue.trim() ? `The cue selects the ${selected.format.toLowerCase()} format.` : "Without a cue, all three formats are available."}` : "This toy only recognises its three preset cues. Use a preset to try again."}</p>
      </div>
      <button class="another-continuation" type="button" disabled={result.matches.length < 2} onClick={() => setSample((value) => value + 1)}>Try another continuation ↻</button>
      <div class="format-shares" aria-label="Toy matches by format">
        {result.formats.map(({ format, count, share }) => <div class="format-row" key={format}><span>{format}</span><div class="completion-track" aria-hidden="true"><span style={{ width: `${share * 100}%` }} /></div><output data-testid={`format-${format.toLowerCase()}`} aria-label={`${format}: ${count} of ${result.matches.length} matches`}>{result.matches.length ? `${count}/${result.matches.length}` : "—"}</output></div>)}
      </div>
      <details class="toy-corpus"><summary>See the six fixed snippets</summary><ul>{continuationSnippets.map((snippet) => <li key={snippet.text}><code>{snippet.cue}</code> → {snippet.text}</li>)}</ul></details>
      <p class="toy-footnote">An illustration, not GPT-2: this is a hand-written lookup, not a neural network. It matches cues, not meaning, and cannot read a new passage. Real GPT-2 predicts tokens using learned patterns.</p>
    </div>
  );
}
