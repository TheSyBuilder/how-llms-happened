import '../i18n/preact';
import { useLayoutEffect, useRef, useState } from "preact/hooks";

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

export function nextWordChoices(cue: string, words: string[]) {
  const matches = matchContinuations(cue).matches
    .map((snippet) => snippet.text.split(" "))
    .filter((snippet) => words.every((word, index) => snippet[index] === word));
  const counts = new Map<string, number>();
  for (const snippet of matches) {
    const word = snippet[words.length];
    if (word !== undefined) counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return { count: matches.length, choices: [...counts].map(([word, count]) => ({ word, count })) };
}

export default function Gpt2Toy() {
  const [cue, setCue] = useState("Then");
  const [sample, setSample] = useState(0);
  const [words, setWords] = useState<string[]>([]);
  const builder = useRef<HTMLDetailsElement>(null);
  const focusChoice = useRef(false);
  const next = nextWordChoices(cue, words);
  useLayoutEffect(() => {
    if (!focusChoice.current) return;
    focusChoice.current = false;
    builder.current?.querySelector<HTMLButtonElement>(".word-options button, .word-undo")?.focus();
  }, [words]);
  const result = matchContinuations(cue);
  const selected = result.matches.length ? result.matches[sample % result.matches.length] : undefined;
  const changeCue = (value: string) => { setCue(value); setSample(0); setWords([]); };
  const writeWords = (value: string[]) => { focusChoice.current = true; setWords(value); };
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
        <label for="prompt-ending">Prompt ending · edit it<input id="prompt-ending" dir="ltr" type="text" value={cue} maxLength={120} spellcheck={false} autoComplete="off" placeholder="Try TL;DR:" onInput={(event) => changeCue(event.currentTarget.value)} aria-describedby="cue-help" /></label>
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
      <details class="word-builder" ref={builder}>
        <summary>Build a continuation word by word</summary>
        <p>Pick a word. It joins the prompt, narrowing the next choices. Counts come from the six snippets, not GPT-2.</p>
        <div class="word-written" role="status" aria-live="polite" aria-atomic="true">
          <span class="eyebrow">Your continuation</span>
          <p data-testid="written-words" dir="ltr">{words.length ? words.map((word, index) => <span key={index}>{index ? " " : ""}{word}</span>) : "…"}</p>
          <span>{next.count === 0 ? "No matching cue." : next.choices.length ? `Matching snippets: ${next.count}` : "Snippet complete."}</span>
        </div>
        <div class="word-options" role="group" aria-label="Choose the next word" dir="ltr">
          {next.choices.map(({ word, count }) => <button type="button" key={word} onClick={() => writeWords([...words, word])}>
            <code>{word}</code><span>{count}/{next.count}</span>
          </button>)}
        </div>
        <div class="word-actions">
          <button class="word-undo" type="button" disabled={!words.length} onClick={() => writeWords(words.slice(0, -1))}>Undo word</button>
          <button type="button" disabled={!words.length} onClick={() => writeWords([])}>Start over</button>
        </div>
        <p class="toy-footnote">Real GPT-2 predicts tokens, which may be parts of words, and can compose new text.</p>
      </details>
      <details class="toy-corpus"><summary>See the six fixed snippets</summary><ul>{continuationSnippets.map((snippet) => <li key={snippet.text}><code>{snippet.cue}</code> → {snippet.text}</li>)}</ul></details>
      <details class="toy-method"><summary>About this toy</summary><p class="toy-footnote">An illustration, not GPT-2: this is a hand-written lookup, not a neural network. It matches cues, not meaning, and cannot read a new passage. Real GPT-2 predicts tokens using learned patterns.</p></details>
    </div>
  );
}
