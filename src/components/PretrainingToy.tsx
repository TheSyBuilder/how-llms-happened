import '../i18n/preact';
import '../styles/games/pretraining.css';
import { useMemo, useRef, useState } from "preact/hooks";
import GoalBar from "./game/GoalBar";
import ResultCard, { type GameResult } from "./game/ResultCard";
import { markPlayed } from "../lib/progress";

// Invented sentences. Pretraining sees the next word, never a review rating.
export const readingSentences = [
  "The delightful film made us smile.",
  "The dreadful film made us sigh.",
  "The splendid film made us smile.",
  "The awful film made us sigh.",
  "The lovely film made us smile.",
  "The tedious film made us sigh.",
  "The excellent film made us smile.",
  "The terrible film made us sigh.",
];
export const reviews = [
  { word: "delightful", positive: 1 },
  { word: "dreadful", positive: 0 },
  { word: "lovely", positive: 1 },
  { word: "tedious", positive: 0 },
  { word: "splendid", positive: 1 },
  { word: "awful", positive: 0 },
  { word: "excellent", positive: 1 },
  { word: "terrible", positive: 0 },
];
export const words = readingSentences.map((sentence) => sentence.split(" ")[1]!);
type ReadingEnding = "smile" | "sigh";
export const defaultReadingEndings: ReadingEnding[] = readingSentences.map((sentence) => sentence.endsWith("smile.") ? "smile" : "sigh");
const sigmoid = (value: number) => 1 / (1 + Math.exp(-value));
const isPositive = (word: string) => reviews.find((review) => review.word === word)!.positive;
// A fixed, small initialization gives both learners exactly the same start.
const initialEmbeddings = [0.03, -0.07, -0.04, 0.06, 0.08, 0.02, -0.08, -0.01];

// Train on the labelled words in the order they were handed out.
export function learnFromLabels(labelled: readonly string[], readFirst: boolean, readingEndings: readonly ReadingEnding[] = defaultReadingEndings) {
  const embeddings = [...initialEmbeddings];
  let weight = 0.2;
  let bias = 0;
  if (readFirst) {
    for (let epoch = 0; epoch < 100; epoch++) {
      words.forEach((_, i) => {
        const target = readingEndings[i] === "smile" ? 1 : 0;
        const error = sigmoid(weight * embeddings[i]! + bias) - target;
        const previousWeight = weight;
        weight -= 0.15 * error * embeddings[i]!;
        bias -= 0.15 * error;
        embeddings[i]! -= 0.15 * error * previousWeight;
      });
    }
  }
  const afterReading = [...embeddings];
  // Replace the next-word output with a new rating output; adapt the embeddings too.
  weight = 0;
  bias = 0;
  for (let epoch = 0; epoch < 100; epoch++) {
    for (const word of labelled) {
      const i = words.indexOf(word);
      const error = sigmoid(weight * embeddings[i]! + bias) - isPositive(word);
      const previousWeight = weight;
      weight -= 0.15 * error * embeddings[i]!;
      bias -= 0.15 * error;
      embeddings[i]! -= 0.15 * error * previousWeight;
    }
  }
  return {
    afterReading,
    embeddings,
    predictions: words.map((word, i) => ({ word, positive: sigmoid(weight * embeddings[i]! + bias) })),
  };
}

export function learnReviews(labelCount: number, readFirst: boolean, readingEndings: readonly ReadingEnding[] = defaultReadingEndings) {
  return learnFromLabels(reviews.slice(0, labelCount).map((review) => review.word), readFirst, readingEndings);
}

// A learner "gets" a review when it is at least 80% sure of the right rating.
export const SURE = 0.8;
export type Verdict = "right" | "wrong" | "unsure";
export function verdict(word: string, positive: number): Verdict {
  const sureness = isPositive(word) ? positive : 1 - positive;
  return sureness >= SURE ? "right" : sureness <= 1 - SURE ? "wrong" : "unsure";
}
export const allRight = (learner: ReturnType<typeof learnFromLabels>) => learner.predictions.every(({ word, positive }) => verdict(word, positive) === "right");

// One reading sentence is flipped: a misleading clue the head start carries into the new job.
export function misleadingEndings(misled: number): ReadingEnding[] {
  return defaultReadingEndings.map((ending, i) => i === misled ? (ending === "smile" ? "sigh" : "smile") : ending);
}

// Labels a learner needs when the given order is continued with the remaining words.
export function labelsNeeded(order: readonly string[], readFirst: boolean, readingEndings: readonly ReadingEnding[]) {
  const full = [...order, ...words.filter((word) => !order.includes(word))];
  for (let count = 0; count <= full.length; count++) {
    if (allRight(learnFromLabels(full.slice(0, count), readFirst, readingEndings))) return count;
  }
  return Infinity;
}

export function pretrainingStars(labels: number): 0 | 1 | 2 | 3 {
  return labels <= 3 ? 3 : labels === 4 ? 2 : labels <= 6 ? 1 : 0;
}

function Learner({ title, learner, id }: { title: string; learner: ReturnType<typeof learnFromLabels>; id: string }) {
  const right = learner.predictions.filter(({ word, positive }) => verdict(word, positive) === "right").length;
  return (
    <section class={`pt-learner${right === words.length ? " is-done" : ""}`} aria-labelledby={id}>
      <h3 id={id}>{title} <span class="pt-count" dir="ltr">{`${right}/8`}</span></h3>
      <ul dir="ltr">
        {learner.predictions.map(({ word, positive }) => {
          const v = verdict(word, positive);
          return <li class={`pt-chip is-${v}`}><span aria-hidden="true">{v === "right" ? "✓" : v === "wrong" ? "✗" : "?"}</span> {word} <small>{`${Math.round(positive * 100)}% positive`}</small></li>;
        })}
      </ul>
    </section>
  );
}

export default function PretrainingToy() {
  // The first game flips "splendid" so server render and hydration agree; replays draw a new one.
  const [misled, setMisled] = useState(2);
  const [labelled, setLabelled] = useState<string[]>([]);
  const [announce, setAnnounce] = useState("");
  const played = useRef(false);
  const endings = useMemo(() => misleadingEndings(misled), [misled]);
  const scratch = useMemo(() => learnFromLabels(labelled, false), [labelled]);
  const pretrained = useMemo(() => learnFromLabels(labelled, true, endings), [labelled, endings]);
  const finished = labelled.length > 0 && allRight(pretrained);
  const scratchNeeded = useMemo(() => finished ? labelsNeeded(labelled, false, endings) : 0, [finished, labelled, endings]);
  const count = (learner: ReturnType<typeof learnFromLabels>) => learner.predictions.filter(({ word, positive }) => verdict(word, positive) === "right").length;

  const give = (word: string) => {
    if (finished || labelled.includes(word)) return;
    if (!played.current) { played.current = true; markPlayed("pretraining"); }
    const next = [...labelled, word];
    setLabelled(next);
    const read = learnFromLabels(next, true, endings), fresh = learnFromLabels(next, false);
    setAnnounce(`${word}: ${isPositive(word) ? "positive" : "negative"}. Read first: ${count(read)} of 8 right. From scratch: ${count(fresh)} of 8 right.`);
  };
  const replay = () => {
    setMisled((current) => (current + 1 + Math.floor(Math.random() * 7)) % 8);
    setLabelled([]);
    setAnnounce("");
  };
  const n = labelled.length;
  const result: GameResult = {
    slug: "pretraining",
    headline: `I taught it with ${n} labels; from scratch it needed ${scratchNeeded}.`,
    detail: "Reading grouped the adjectives by how their sentences ended. One label per group named the groups; the misleading sentence needed a label of its own.",
    score: { value: n, label: "Labels" },
    stars: pretrainingStars(n),
    shareText: `I taught a pre-read learner film reviews with ${n} labels. From scratch it needed ${scratchNeeded}.`,
  };

  return (
    <div class="pretraining-toy pt-game">
      <GoalBar goal="Hand out as few labels as you can until the pre-read learner gets all 8 reviews right." status={`Labels handed out: ${n}`} score={{ value: n, label: "Labels" }} />
      <p class="screen-reader-only" role="status">{announce}</p>
      <div class="pt-reading">
        <h3>What the pre-read learner read first</h3>
        <p>No ratings, just next words. One of these sentences is misleading.</p>
        <ul dir="ltr">{words.map((word, i) => <li class={finished && i === misled ? "pt-misled" : undefined}>{`The ${word} film made us `}<strong>{`${endings[i]}.`}</strong>{finished && i === misled && <em>{" ← misleading"}</em>}</li>)}</ul>
      </div>
      {finished ? (
        <ResultCard result={result} onReplay={replay} />
      ) : (
        <div class="pt-labels">
          <h3>Tap a review to hand over its label</h3>
          <div class="game-choices" role="group" aria-label="Reviews to label" dir="ltr">
            {reviews.map(({ word, positive }) => {
              const given = labelled.includes(word);
              return <button type="button" class={given ? (positive ? "pt-pos" : "pt-neg") : undefined} aria-pressed={given} disabled={given} onClick={() => give(word)}>
                {word}{given && <small>{positive ? " → positive" : " → negative"}</small>}
              </button>;
            })}
          </div>
        </div>
      )}
      <div class="pt-learners">
        <Learner title="From scratch" learner={scratch} id="pt-scratch" />
        <Learner title="Read first" learner={pretrained} id="pt-read" />
      </div>
      <p class="pt-key">✓ at least 80% sure and right · ✗ sure but wrong · ? not sure yet</p>
      <p class="toy-note">A tiny learner with one number per word and eight invented sentences, not GPT-1.</p>
    </div>
  );
}
