import '../i18n/preact';
import '../styles/games/gpt-2.css';
import { useLayoutEffect, useRef, useState } from "preact/hooks";
import GoalBar from "./game/GoalBar";
import ResultCard, { type GameResult } from "./game/ResultCard";
import { markPlayed } from "../lib/progress";

export const toyPassage = "Mira found a lost cat. She brought it home.";
export type Output = "story" | "summary" | "french" | "who" | "what";
// A fixed, invented lookup table. These are not outputs from GPT-2.
export const continuations: Record<Output, string> = {
  story: "Then the cat fell asleep by the window.",
  summary: "Mira took a lost cat home.",
  french: "Mira a trouvé un chat perdu. Elle l’a ramené à la maison.",
  who: "Mira.",
  what: "A lost cat.",
};
// Example pairs go before the passage, as in GPT-2's translation prompts; every other card goes after it.
export const EXAMPLE = "cat = chat";

// The toy reads the end of the prompt, the way the GPT-2 report's task cues sit at the end of the text.
export function readCue(cards: readonly string[]): Output | null {
  const last = cards.at(-1);
  if (last === "TL;DR:") return "summary";
  if (last === "Then") return "story";
  if (last === "=") return cards.includes(EXAMPLE) ? "french" : null;
  if (last === "A:") {
    const question = cards.slice(0, -1).filter((card) => card === "Who?" || card === "What?").at(-1);
    return question === "Who?" ? "who" : question === "What?" ? "what" : null;
  }
  return null;
}

export type Hole = { task: string; target: Output; par: number; deck: string[] };
export const holes: Hole[] = [
  { task: "Make it continue the story.", target: "story", par: 1, deck: ["Please", "continue", "TL;DR:", "Then", "A:"] },
  { task: "Make it summarise the passage.", target: "summary", par: 1, deck: ["Summarise", "this:", "Then", "Q:", "TL;DR:"] },
  { task: "Make it translate the passage into French.", target: "french", par: 2, deck: ["Translate", "into", "French:", "=", EXAMPLE, "TL;DR:"] },
  { task: "Make it answer: who found the cat?", target: "who", par: 2, deck: ["Answer", "What?", "Q:", "Who?", "A:", "Then"] },
];
export const totalPar = holes.reduce((sum, hole) => sum + hole.par, 0);
// A hole is abandoned at this many strokes and scored as the limit.
export const STROKE_LIMIT = 8;
export function golfStars(strokes: number): 0 | 1 | 2 | 3 {
  return strokes <= totalPar ? 3 : strokes <= totalPar + 3 ? 2 : strokes <= totalPar + 8 ? 1 : 0;
}
export function holeName(strokes: number, par: number) {
  const over = strokes - par;
  return over < 0 ? "Birdie" : over === 0 ? "Par" : over === 1 ? "Bogey" : over === 2 ? "Double bogey" : `${over} over par`;
}

type Played = { strokes: number; holed: boolean };

export default function Gpt2Toy() {
  const [index, setIndex] = useState(0);
  const [cards, setCards] = useState<string[]>([]);
  const [strokes, setStrokes] = useState(0);
  const [card, setCard] = useState<Played[]>([]);
  const [announce, setAnnounce] = useState("");
  const played = useRef(false);
  const nextButton = useRef<HTMLButtonElement>(null);
  const hole = holes[index];
  const done = card[index];
  const finished = card.length === holes.length && index >= holes.length;
  const output = readCue(cards);
  useLayoutEffect(() => { if (done) nextButton.current?.focus(); }, [done]);

  const finishHole = (result: Played) => setCard([...card, result]);
  const play = (word: string) => {
    if (!hole || done || cards.includes(word)) return;
    if (!played.current) { played.current = true; markPlayed("gpt-2"); }
    const next = [...cards, word];
    const count = strokes + 1;
    const out = readCue(next);
    setCards(next);
    setStrokes(count);
    if (out === hole.target) {
      finishHole({ strokes: count, holed: true });
      setAnnounce(`Holed in ${count}. ${holeName(count, hole.par)}.`);
    } else if (count >= STROKE_LIMIT) {
      finishHole({ strokes: count, holed: false });
      setAnnounce(`Out of strokes. Scored ${count}.`);
    } else {
      setAnnounce(out ? `The toy writes: ${continuations[out]}` : "No cue it recognises yet.");
    }
  };
  const undo = () => { if (!done && cards.length) { setCards(cards.slice(0, -1)); setAnnounce(""); } };
  const advance = () => { setIndex(index + 1); setCards([]); setStrokes(0); setAnnounce(""); };
  const replay = () => { setIndex(0); setCards([]); setStrokes(0); setCard([]); setAnnounce(""); };

  const total = card.reduce((sum, h) => sum + h.strokes, 0);
  const runningPar = holes.slice(0, card.length).reduce((sum, h) => sum + h.par, 0);
  const result: GameResult = {
    slug: "gpt-2",
    headline: total <= totalPar ? `Even par: 4 tasks from ${total} cue words.` : `4 tasks from ${total} cue words, ${total - totalPar} over par.`,
    detail: "The model never changed. A few cue words in the prompt (TL;DR:, A:, an example pair) chose which kind of text came next.",
    score: { value: total, max: totalPar, label: "Strokes / par" },
    stars: golfStars(total),
    shareText: `I played GPT-2 prompt golf: 4 tasks in ${total} cue words (par ${totalPar}).`,
  };
  const examples = cards.filter((c) => c === EXAMPLE), after = cards.filter((c) => c !== EXAMPLE);

  return (
    <div class="gpt2-toy g2-game">
      <GoalBar
        goal={finished ? "Four holes played." : `Hole ${index + 1} · ${hole!.task}`}
        status={finished ? `Par ${totalPar}` : `Par ${hole!.par} · stroke ${strokes}`}
        score={{ value: total + (done ? 0 : strokes), max: runningPar + (finished || done ? 0 : hole!.par), label: "Strokes / par" }}
      />
      <p class="screen-reader-only" role="status">{announce}</p>
      {finished || !hole ? (
        <>
          <table class="g2-scorecard">
            <caption>Your scorecard</caption>
            <thead><tr><th scope="col">Hole</th><th scope="col">Par</th><th scope="col">Strokes</th></tr></thead>
            <tbody>{holes.map((h, i) => <tr><th scope="row">{h.task}</th><td>{h.par}</td><td>{card[i]!.holed ? card[i]!.strokes : `${card[i]!.strokes} (gave up)`}</td></tr>)}</tbody>
          </table>
          <ResultCard result={result} onReplay={replay} />
        </>
      ) : (
        <>
          <div class="g2-prompt" dir="ltr">
            <span class="g2-tag">Prompt</span>
            {examples.length > 0 && <p class="g2-examples">{examples.map((c) => <mark class="g2-cue">{c}</mark>)}</p>}
            <p>{toyPassage}{after.map((c) => <> <mark class="g2-cue">{c}</mark></>)}<span class="g2-caret" aria-hidden="true"> ▍</span></p>
          </div>
          <div class={`g2-output${output === hole.target ? " is-hit" : ""}`} dir="ltr">
            <span class="g2-tag">Toy continuation</span>
            <p>{output ? continuations[output] : "…"}</p>
          </div>
          {done ? (
            <div class="g2-holed">
              <p><strong>{done.holed ? `${holeName(done.strokes, hole.par)}: holed in ${done.strokes}.` : `Out of strokes at ${done.strokes}.`}</strong></p>
              <button type="button" class="game-btn is-primary" ref={nextButton} onClick={advance}>{index + 1 < holes.length ? "Next hole" : "See your scorecard"}</button>
            </div>
          ) : (
            <>
              <p class="g2-help">Tap a cue card to add it to the prompt. Every card is a stroke, even one you undo.</p>
              <div class="g2-deck" role="group" aria-label="Cue cards" dir="ltr">
                {hole.deck.map((c) => <button type="button" disabled={cards.includes(c)} onClick={() => play(c)}><code>{c}</code></button>)}
              </div>
              <div class="g2-actions">
                <button type="button" class="game-btn" disabled={!cards.length} onClick={undo}>Undo card</button>
              </div>
            </>
          )}
        </>
      )}
      <p class="toy-note">A hand-written cue lookup, not GPT-2. It knows only the task formats from the GPT-2 report.</p>
    </div>
  );
}
