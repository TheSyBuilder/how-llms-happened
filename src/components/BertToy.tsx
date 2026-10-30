import { useState } from "preact/hooks";

// Invented examples for a context-filtering illustration, not a trained model.
export const missingWordExamples = [
  { left: "little", word: "bird", right: "sky" },
  { left: "little", word: "plane", right: "sky" },
  { left: "little", word: "boat", right: "lake" },
  { left: "little", word: "fish", right: "lake" },
  { left: "metal", word: "plane", right: "sky" },
  { left: "metal", word: "boat", right: "lake" },
  { left: "hungry", word: "bird", right: "sky" },
  { left: "hungry", word: "fish", right: "lake" },
];
export const missingWords = ["bird", "plane", "boat", "fish"];

export function countCompletions(left: string | null, right: string | null) {
  const matches = missingWordExamples.filter((example) =>
    (left === null || example.left === left) && (right === null || example.right === right),
  );
  return {
    matches,
    predictions: missingWords.map((word) => {
      const count = matches.filter((example) => example.word === word).length;
      return { word, count, probability: matches.length ? count / matches.length : 0 };
    }),
  };
}

export default function BertToy() {
  const [left, setLeft] = useState("metal");
  const [right, setRight] = useState("sky");
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(false);
  const result = countCompletions(showLeft ? left : null, showRight ? right : null);
  const possible = result.predictions.filter((prediction) => prediction.count > 0).map((prediction) => prediction.word);
  return (
    <div class="bert-toy">
      <div class="toy-topline"><span class="eyebrow">The clues around the gap</span><span class="toy-label">Toy · eight invented sentences</span></div>
      <p>Start with the left clue. Reveal the right clue, then change either one.</p>
      <div class="context-controls">
        <div><label class="context-switch"><input type="checkbox" checked={showLeft} onChange={(event) => setShowLeft(event.currentTarget.checked)} />Left context</label><label class="clue-select" for="left-clue">Left clue<select id="left-clue" value={left} onChange={(event) => setLeft(event.currentTarget.value)}><option value="metal">metal</option><option value="little">little</option><option value="hungry">hungry</option></select></label></div>
        <div><label class="context-switch"><input type="checkbox" checked={showRight} onChange={(event) => setShowRight(event.currentTarget.checked)} />Right context</label><label class="clue-select" for="right-clue">Right clue<select id="right-clue" value={right} onChange={(event) => setRight(event.currentTarget.value)}><option value="sky">sky</option><option value="lake">lake</option></select></label></div>
      </div>
      <div class="masked-sentence" aria-label="Visible context"><span class={showLeft ? "" : "hidden-clue"}>{showLeft ? `The ${left}` : "Left hidden"}</span><strong>[MASK]</strong><span class={showRight ? "" : "hidden-clue"}>{showRight ? `crossed the ${right}.` : "Right hidden"}</span></div>
      <p class="context-count" data-testid="context-count">{result.matches.length} of 8 sentences match the visible clues.</p>
      <div class="completion-bars" aria-label="Shares of matching sentences">
        {result.predictions.map(({ word, count, probability }) => <div class="completion-row" key={word}><span>{word}</span><div class="completion-track" aria-hidden="true"><span style={{ width: `${probability * 100}%` }} /></div><output aria-label={`${word}: ${count} of ${result.matches.length} matches`} data-testid={`completion-${word}`}>{Math.round(probability * 100)}%</output></div>)}
      </div>
      <div class="toy-result" role="status" aria-live="polite">
        <strong>{possible.length === 1 ? `Only “${possible[0]}” fits this tiny set.` : `${possible.length} words still fit.`}</strong>
        <p>{!showLeft && !showRight ? "No clues: all four words have the same share." : showLeft && showRight ? possible.length === 1 ? "The two clues work together. Neither side alone singles out this word." : "Both sides help, but a missing word can still have more than one plausible answer." : "One side narrows the possibilities. Reveal the other side to combine the clues."}</p>
        <span class="screen-reader-only">{result.matches.length} matching sentences. {result.predictions.map(({ word, probability }) => `${word}: ${Math.round(probability * 100)} percent`).join(". ")}.</span>
      </div>
      <details class="toy-corpus"><summary>See the eight toy sentences</summary><ul>{missingWordExamples.map((example) => <li class={result.matches.includes(example) ? "matches-context" : ""} key={`${example.left}-${example.word}`}><span aria-hidden="true">{result.matches.includes(example) ? "●" : "○"}</span> The {example.left} <strong>{example.word}</strong> crossed the {example.right}.</li>)}</ul><p>Filled dots mark sentences matching the visible clues.</p></details>
      <details class="toy-method"><summary>About this toy</summary><p class="toy-footnote">These percentages count matching sentences. This toy has no neural network and learns no English. BERT learns patterns from text; it does not look up exact matches in this list.</p></details>
    </div>
  );
}
