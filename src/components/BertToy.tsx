import '../i18n/preact';
import '../styles/games/bert.css';
import { useLayoutEffect, useRef, useState } from "preact/hooks";
import GoalBar from "./game/GoalBar";
import ResultCard, { type GameResult } from "./game/ResultCard";
import { markPlayed } from "../lib/progress";

// Invented examples for a context-filtering illustration, not a trained model.
// The home page's first experiment counts these sentences.
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

// Guess the [MASK]: each clue is a chunk of the sentence, revealed nearest the gap first.
// `fits` lists the choices a clue leaves possible; a clue without it rules nothing out.
export type Clue = { text: string; fits?: string[] };
export type Round = { left: Clue[]; right: Clue[]; answer: string; choices: string[] };
export const rounds: Round[] = [
  { left: [{ text: "The metal", fits: ["plane", "boat"] }], right: [{ text: "flew over", fits: ["bird", "plane"] }, { text: "the clouds." }], answer: "plane", choices: ["bird", "plane", "boat", "fish"] },
  { left: [{ text: "I put on my" }], right: [{ text: "because my feet", fits: ["socks"] }, { text: "were cold." }], answer: "socks", choices: ["hat", "socks", "gloves", "scarf"] },
  { left: [{ text: "At the zoo, the" }], right: [{ text: "stretched its long neck", fits: ["giraffe"] }, { text: "to reach the leaves.", fits: ["giraffe", "elephant"] }], answer: "giraffe", choices: ["lion", "giraffe", "penguin", "elephant"] },
  { left: [{ text: "The hungry", fits: ["bird", "fish"] }], right: [{ text: "swam across the lake.", fits: ["fish", "boat"] }], answer: "fish", choices: ["bird", "fish", "boat", "plane"] },
  { left: [{ text: "Grandpa wound up the", fits: ["clock"] }, { text: "old" }], right: [{ text: "on the wall,", fits: ["clock", "map", "mirror"] }, { text: "and it struck midnight.", fits: ["clock", "bell"] }], answer: "clock", choices: ["clock", "map", "mirror", "bell"] },
];
// left[] is in sentence order, so the clue nearest the gap is the last one; right[] starts at the gap.
export const nearestFirst = (round: Round, side: "left" | "right") => side === "left" ? [...round.left].reverse() : round.right;

// The choices every given clue leaves possible.
export function stillFits(round: Round, clues: readonly Clue[]) {
  return round.choices.filter((choice) => clues.every((clue) => !clue.fits || clue.fits.includes(choice)));
}
// What a reader could rule in after reading the whole sentence from one or both directions.
export function readers(round: Round) {
  return { leftOnly: stillFits(round, round.left), bothWays: stillFits(round, [...round.left, ...round.right]) };
}
// Fewer clues, more points: 3 for one clue, 2 for two, 1 for three or more; a wrong guess scores 0.
export const pointsFor = (cluesShown: number, correct: boolean) => correct ? Math.max(1, 4 - cluesShown) : 0;
// The fewest clues that leave only the answer, choosing the side for each reveal.
export function fewestClues(round: Round) {
  let best = Infinity;
  for (let l = 0; l <= round.left.length; l++) for (let r = 0; r <= round.right.length; r++) {
    const shown = [...nearestFirst(round, "left").slice(0, l), ...nearestFirst(round, "right").slice(0, r)];
    if (l + r > 0 && stillFits(round, shown).length === 1) best = Math.min(best, l + r);
  }
  return best;
}
export const maxPoints = rounds.reduce((sum, round) => sum + pointsFor(fewestClues(round), true), 0);
export function bertStars(points: number): 0 | 1 | 2 | 3 {
  return points >= maxPoints - 1 ? 3 : points >= 8 ? 2 : points >= 4 ? 1 : 0;
}

type Guess = { choice: string; clues: number; points: number };

function Sentence({ round, shown, reveal }: { round: Round; shown: { left: number; right: number }; reveal: boolean }) {
  const left = round.left.map((clue, i) => ({ clue, visible: reveal || round.left.length - i <= shown.left }));
  const right = round.right.map((clue, i) => ({ clue, visible: reveal || i < shown.right }));
  const chunk = ({ clue, visible }: { clue: Clue; visible: boolean }) => visible
    ? <span class="bt-chunk">{clue.text}</span>
    : <span class="bt-chunk is-hidden"><span class="screen-reader-only">hidden clue</span><span aria-hidden="true">{"▒".repeat(Math.min(10, Math.ceil(clue.text.length / 2)))}</span></span>;
  return (
    <p class="bt-sentence" dir="ltr">
      {left.map(chunk)}
      <strong class={reveal ? "bt-mask is-revealed" : "bt-mask"}>{reveal ? round.answer : "[MASK]"}</strong>
      {right.map(chunk)}
    </p>
  );
}

export default function BertToy() {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState({ left: 0, right: 0 });
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [announce, setAnnounce] = useState("");
  const played = useRef(false);
  const nextButton = useRef<HTMLButtonElement>(null);
  const round = rounds[index];
  const guess = guesses[index];
  const finished = guesses.length === rounds.length && index >= rounds.length;
  const points = guesses.reduce((sum, g) => sum + g.points, 0);
  const total = shown.left + shown.right;
  useLayoutEffect(() => { if (guess) nextButton.current?.focus(); }, [guess]);

  const touch = () => { if (!played.current) { played.current = true; markPlayed("bert"); } };
  const reveal = (side: "left" | "right") => {
    if (!round || guess) return;
    const clue = nearestFirst(round, side)[shown[side]];
    if (!clue) return;
    touch();
    setShown({ ...shown, [side]: shown[side] + 1 });
    setAnnounce(`Clue: ${clue.text}`);
  };
  const pick = (choice: string) => {
    if (!round || guess || total === 0) return;
    touch();
    const correct = choice === round.answer;
    const earned = pointsFor(total, correct);
    setGuesses([...guesses, { choice, clues: total, points: earned }]);
    setAnnounce(correct ? `Right: ${round.answer}. ${earned} points.` : `Not quite. It was ${round.answer}.`);
  };
  const advance = () => { setIndex(index + 1); setShown({ left: 0, right: 0 }); setAnnounce(""); };
  const replay = () => { setIndex(0); setShown({ left: 0, right: 0 }); setGuesses([]); setAnnounce(""); };

  const correctCount = guesses.filter((g, i) => g.choice === rounds[i]!.answer).length;
  const clueCount = guesses.reduce((sum, g) => sum + g.clues, 0);
  const result: GameResult = {
    slug: "bert",
    headline: correctCount === rounds.length ? `I guessed all 5 [MASK]s from ${clueCount} clues.` : `I guessed ${correctCount} of 5 [MASK]s from ${clueCount} clues.`,
    detail: "A left-to-right reader only gets the words before the gap. BERT trained on both sides, and the decisive clue was often after it.",
    score: { value: points, max: maxPoints, label: "Points" },
    stars: bertStars(points),
    shareText: `I scored ${points}/${maxPoints} at Guess the [MASK], reading both sides of the gap like BERT.`,
  };
  const readerView = round && readers(round);

  return (
    <div class="bert-toy bt-game">
      <GoalBar
        goal="Guess each hidden word from as few clues as you can."
        status={finished ? "5 rounds played" : `Round ${index + 1} / 5`}
        score={{ value: points, max: maxPoints, label: "Points" }}
      />
      <p class="screen-reader-only" role="status">{announce}</p>
      {finished || !round ? (
        <ResultCard result={result} onReplay={replay} />
      ) : (
        <>
          <Sentence round={round} shown={shown} reveal={!!guess} />
          {!guess && <div class="bt-reveal">
            <button type="button" class="game-btn" disabled={shown.left >= round.left.length} onClick={() => reveal("left")}><span aria-hidden="true">←</span> Reveal a left clue</button>
            <button type="button" class="game-btn" disabled={shown.right >= round.right.length} onClick={() => reveal("right")}>Reveal a right clue <span aria-hidden="true">→</span></button>
          </div>}
          <div class="game-choices" role="group" aria-label="Your guess" dir="ltr">
            {round.choices.map((choice) => (
              <button type="button" disabled={total === 0 || !!guess}
                class={guess ? (choice === round.answer ? "is-right" : choice === guess.choice ? "is-wrong" : undefined) : undefined}
                aria-pressed={guess ? guess.choice === choice : undefined}
                onClick={() => pick(choice)}>{choice}</button>
            ))}
          </div>
          {!guess && <p class="bt-hint">{total === 0 ? "Reveal a clue to start guessing." : `Guess now for ${pointsFor(total, true)} points, or reveal another clue.`}</p>}
          {guess && readerView && (
            <div class="bt-summary">
              <p class="bt-verdict"><strong>{guess.points ? `Right, for ${guess.points} points.` : `Not quite. It was “${round.answer}”.`}</strong></p>
              <dl class="bt-readers">
                <div><dt>Left-only reader (GPT-style)</dt><dd dir="ltr">{readerView.leftOnly.length === 1 ? readerView.leftOnly[0] : readerView.leftOnly.join(" · ")}</dd><dd class="bt-reader-note">{readerView.leftOnly.length === 1 ? "Rules in one word." : `Can’t rule out ${readerView.leftOnly.length} words.`}</dd></div>
                <div><dt>Both-ways reader (BERT)</dt><dd dir="ltr">{readerView.bothWays.join(" · ")}</dd><dd class="bt-reader-note">{readerView.bothWays.length === 1 ? "Rules in one word." : `Can’t rule out ${readerView.bothWays.length} words.`}</dd></div>
              </dl>
              <button type="button" class="game-btn is-primary" ref={nextButton} onClick={advance}>{index + 1 < rounds.length ? "Next round" : "See your result"}</button>
            </div>
          )}
        </>
      )}
      <p class="toy-note">A hand-written clue table, not BERT: each clue simply rules some words out.</p>
    </div>
  );
}
