import '../i18n/preact';
import '../styles/games/gpt-3.css';
import { useLayoutEffect, useRef, useState } from "preact/hooks";
import GoalBar from "./game/GoalBar";
import ResultCard, { type GameResult } from "./game/ResultCard";
import { markPlayed } from "../lib/progress";

type Words = readonly string[];
export type Example = { input: Words; output: Words };
export type Rule = { id: string; label: string; apply: (words: Words) => Words };
export const pairRules: Rule[] = [
  { id: "keep", label: "Keep the order", apply: ([a, b]) => [a!, b!] },
  { id: "swap", label: "Swap the pair", apply: ([a, b]) => [b!, a!] },
  { id: "first", label: "Repeat the first", apply: ([a]) => [a!, a!] },
  { id: "last", label: "Repeat the last", apply: ([, b]) => [b!, b!] },
];
// Every order of three words.
export const tripleRules: Rule[] = [
  { id: "keep3", label: "Keep the order", apply: ([a, b, c]) => [a!, b!, c!] },
  { id: "reverse", label: "Reverse", apply: ([a, b, c]) => [c!, b!, a!] },
  { id: "rotate", label: "Move the first to the end", apply: ([a, b, c]) => [b!, c!, a!] },
  { id: "rotateBack", label: "Move the last to the front", apply: ([a, b, c]) => [c!, a!, b!] },
  { id: "swapFront", label: "Swap the first two", apply: ([a, b, c]) => [b!, a!, c!] },
  { id: "swapBack", label: "Swap the last two", apply: ([a, b, c]) => [a!, c!, b!] },
];
const same = (a: Words, b: Words) => a.length === b.length && a.every((word, i) => word === b[i]);
export function mismatchingRows(rule: Rule, examples: readonly Example[]) {
  return examples.flatMap((example, i) => same(rule.apply(example.input), example.output) ? [] : [i + 1]);
}
export function fittingRules(examples: readonly Example[], bank: readonly Rule[] = pairRules) {
  return bank.filter((rule) => mismatchingRows(rule, examples).length === 0);
}

export type Puzzle = { bank: Rule[]; rule: string; examples: Example[]; query: Words };
const ex = (input: string, output: string): Example => ({ input: input.split(" "), output: output.split(" ") });
// Five puzzles that get harder: pairs first, then every order of three words.
export const puzzles: Puzzle[] = [
  { bank: pairRules, rule: "swap", query: ["sun", "moon"], examples: [ex("cat cat", "cat cat"), ex("cat dog", "dog cat")] },
  { bank: pairRules, rule: "first", query: ["red", "blue"], examples: [ex("gold gold", "gold gold"), ex("gold red", "gold gold")] },
  { bank: tripleRules, rule: "reverse", query: ["red", "green", "blue"], examples: [ex("sun moon sun", "sun moon sun"), ex("one two three", "three two one")] },
  { bank: tripleRules, rule: "rotate", query: ["red", "green", "blue"], examples: [ex("dog dog dog", "dog dog dog"), ex("dog dog cat", "dog cat dog"), ex("sun moon star", "moon star sun")] },
  { bank: tripleRules, rule: "swapFront", query: ["one", "two", "three"], examples: [ex("cat cat cat", "cat cat cat"), ex("cat cat dog", "cat cat dog"), ex("red green blue", "green red blue")] },
];
export const answerOf = (puzzle: Puzzle) => puzzle.bank.find((rule) => rule.id === puzzle.rule)!.apply(puzzle.query).join(" ");
// The possible answers: what each rule in the bank would say, without repeats.
export const choicesFor = (puzzle: Puzzle) => [...new Set(puzzle.bank.map((rule) => rule.apply(puzzle.query).join(" ")))];
// The rule filter answers once every rule that still fits agrees on the new input.
export function filterNeeds(puzzle: Puzzle) {
  for (let count = 1; count <= puzzle.examples.length; count++) {
    const answers = new Set(fittingRules(puzzle.examples.slice(0, count), puzzle.bank).map((rule) => rule.apply(puzzle.query).join(" ")));
    if (answers.size === 1) return count;
  }
  return Infinity;
}
// Answering right with fewer examples than the filter needed scores more; a tie scores 1; wrong scores 0.
export const puzzlePoints = (shown: number, needed: number, correct: boolean) => correct ? Math.max(1, needed - shown + 1) : 0;
export const maxPoints = puzzles.reduce((sum, puzzle) => sum + filterNeeds(puzzle), 0);
export function gpt3Stars(points: number): 0 | 1 | 2 | 3 {
  return points >= 8 ? 3 : points >= 5 ? 2 : points >= 2 ? 1 : 0;
}
export function longestStreak(results: readonly boolean[]) {
  let best = 0, run = 0;
  for (const correct of results) { run = correct ? run + 1 : 0; best = Math.max(best, run); }
  return best;
}

type Answer = { choice: string; shown: number; needed: number; points: number };

export default function Gpt3Toy() {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(1);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [announce, setAnnounce] = useState("");
  const played = useRef(false);
  const nextButton = useRef<HTMLButtonElement>(null);
  const puzzle = puzzles[index];
  const answer = answers[index];
  const finished = index >= puzzles.length;
  const needed = puzzle ? filterNeeds(puzzle) : 0;
  const points = answers.reduce((sum, a) => sum + a.points, 0);
  const results = answers.map((a) => a.points > 0);
  let streak = 0;
  for (const correct of results) streak = correct ? streak + 1 : 0;
  useLayoutEffect(() => { if (answer) nextButton.current?.focus(); }, [answer]);

  const touch = () => { if (!played.current) { played.current = true; markPlayed("gpt-3"); } };
  const more = () => {
    if (!puzzle || answer || shown >= needed) return;
    touch();
    setShown(shown + 1);
    setAnnounce(shown + 1 >= needed ? "Example added. The filter now has its answer." : "Example added.");
  };
  const pick = (choice: string) => {
    if (!puzzle || answer) return;
    touch();
    const correct = choice === answerOf(puzzle);
    const earned = puzzlePoints(shown, needed, correct);
    setAnswers([...answers, { choice, shown, needed, points: earned }]);
    setAnnounce(!correct ? `Wrong. The rule gives ${answerOf(puzzle)}. Streak reset.` : shown < needed ? `Right, ${needed - shown} examples before the filter. ${earned} points.` : `Right, a tie with the filter. 1 point.`);
  };
  const advance = () => { setIndex(index + 1); setShown(1); setAnnounce(""); };
  const replay = () => { setIndex(0); setShown(1); setAnswers([]); setAnnounce(""); };

  const beats = answers.filter((a) => a.points > 0 && a.shown < a.needed).length;
  const best = longestStreak(results);
  const result: GameResult = {
    slug: "gpt-3",
    headline: `I beat the rule filter on ${beats} of 5 puzzles, with a streak of ${best}.`,
    detail: "Each new example crossed rules off. GPT-3 also took its task from examples in the prompt, without changing its weights, and ambiguous examples left it guessing too.",
    score: { value: points, max: maxPoints, label: "Points" },
    stars: gpt3Stars(points),
    shareText: `I beat the in-context rule filter on ${beats} of 5 puzzles (streak ${best}). Can you spot the rule from fewer examples?`,
  };

  return (
    <div class="gpt3-toy g3-game">
      <GoalBar
        goal="Name the answer for the new input before the rule filter can."
        status={finished ? `Best streak: ${best}` : `Puzzle ${index + 1} / 5 · streak ${streak}`}
        score={{ value: points, max: maxPoints, label: "Points" }}
      />
      <p class="screen-reader-only" role="status">{announce}</p>
      {finished || !puzzle ? (
        <ResultCard result={result} onReplay={replay} />
      ) : (
        <>
          <div class="g3-prompt" dir="ltr">
            <ol aria-label="Examples in this prompt">
              {puzzle.examples.slice(0, shown).map((e) => <li><code>{e.input.join(" ")}</code> <span aria-hidden="true">→</span><span class="screen-reader-only"> becomes </span> <code><strong>{e.output.join(" ")}</strong></code></li>)}
            </ol>
            <p class="g3-query"><code>{puzzle.query.join(" ")}</code> <span aria-hidden="true">→</span> <strong>?</strong></p>
          </div>
          {!answer && <div class="g3-more">
            <button type="button" class="game-btn" disabled={shown >= needed} onClick={more}>Show another example</button>
            <p>{shown >= needed ? "The filter has its answer now. Match it to tie, for 1 point." : `Answer now for ${puzzlePoints(shown, needed, true)} points.`}</p>
          </div>}
          <div class="game-choices g3-choices" role="group" aria-label="Your answer" dir="ltr">
            {choicesFor(puzzle).map((choice) => (
              <button type="button" disabled={!!answer}
                class={answer ? (choice === answerOf(puzzle) ? "is-right" : choice === answer.choice ? "is-wrong" : undefined) : undefined}
                aria-pressed={answer ? answer.choice === choice : undefined}
                onClick={() => pick(choice)}>{choice}</button>
            ))}
          </div>
          {answer && (
            <div class="g3-summary">
              <p><strong>{answer.points === 0 ? "Wrong. Streak reset." : answer.shown < answer.needed ? `You beat the filter by ${answer.needed - answer.shown}: ${answer.points} points.` : "A tie with the filter: 1 point."}</strong></p>
              <p>{`The filter needed ${answer.needed} examples to be sure. Rules still fitting after each example:`} <span dir="ltr">{[puzzle.bank.length, ...puzzle.examples.slice(0, answer.needed).map((_, i) => fittingRules(puzzle.examples.slice(0, i + 1), puzzle.bank).length)].join(" → ")}</span></p>
              <ul class="g3-rules">{puzzle.bank.map((rule) => {
                const out = mismatchingRows(rule, puzzle.examples.slice(0, answer.needed)).length > 0;
                return <li class={out ? "is-out" : "is-in"}><span>{rule.label}</span> <small>{out ? "Ruled out" : "Fits"}</small> <code dir="ltr">{rule.apply(puzzle.query).join(" ")}</code></li>;
              })}</ul>
              <button type="button" class="game-btn is-primary" ref={nextButton} onClick={advance}>{index + 1 < puzzles.length ? "Next puzzle" : "See your result"}</button>
            </div>
          )}
        </>
      )}
      <p class="toy-note">A rule filter with a fixed list of patterns, not GPT-3.</p>
    </div>
  );
}
