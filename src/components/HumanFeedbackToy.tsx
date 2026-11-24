import '../i18n/preact';
import '../styles/games/human-feedback.css';
import { useEffect, useRef, useState } from "preact/hooks";
import GoalBar from "./game/GoalBar";
import ResultCard, { type GameResult } from "./game/ResultCard";
import { markPlayed } from "../lib/progress";

// The judge sees three hand-labelled traits of each answer: short, everyday words, true.
export type Features = readonly [number, number, number];
export type Answer = { text: string; features: Features };
export type Pair = { prompt: string; a: Answer; b: Answer };
export type Choice = "a" | "b" | null;
export const traits = ["Short", "Everyday words", "True"] as const;

const shortEveryTrue = [1, 1, 1] as const;
// Step 1: both rain answers in each pair are true, so truth never varies.
export const comparisons: Pair[] = [
  { prompt: "Explain rain to a child.", a: { text: "Cloud drops get heavy and fall as rain.", features: shortEveryTrue }, b: { text: "Cloud drops get so heavy that the air can no longer hold them up, and then they fall to the ground as rain.", features: [0, 1, 1] } },
  { prompt: "Explain rain to a child.", a: { text: "Cloud drops get heavy and fall as rain.", features: shortEveryTrue }, b: { text: "Rain is liquid precipitation from atmospheric condensation.", features: [1, 0, 1] } },
];
export const candidates: Answer[] = [
  { text: "Snow is frozen water falling as flakes.", features: shortEveryTrue },
  { text: "Snow consists of ice crystals aggregated into flakes that precipitate from atmospheric clouds.", features: [0, 0, 1] },
  { text: "Snow is tiny pieces of the Moon falling down.", features: [1, 1, 0] },
];
// Step 2: eight comparisons to choose from. In each, a is the answer a careful teacher prefers.
export const deck: Pair[] = [
  { prompt: "Why do leaves fall in autumn?", a: { text: "Trees drop leaves to save water in winter.", features: shortEveryTrue }, b: { text: "Leaves detach because autumnal gravitational intensification exceeds petiole tensile strength.", features: [0, 0, 0] } },
  { prompt: "Why is the sea salty?", a: { text: "Rivers wash salt from rocks into the sea.", features: shortEveryTrue }, b: { text: "Marine salinity originates from fish excreting crystalline sodium compounds throughout their lifespans.", features: [0, 0, 0] } },
  { prompt: "What makes thunder?", a: { text: "Lightning heats the air so fast it booms.", features: shortEveryTrue }, b: { text: "Lightning heats the air around it so quickly that the air bursts outwards, and we hear that as a big boom.", features: [0, 1, 1] } },
  { prompt: "Why do we see rainbows?", a: { text: "Raindrops split sunlight into colours.", features: shortEveryTrue }, b: { text: "Raindrops refract and disperse sunlight into a spectrum.", features: [1, 0, 1] } },
  { prompt: "Where does the Sun go at night?", a: { text: "Earth turns, so our side faces away.", features: shortEveryTrue }, b: { text: "The Sun sleeps behind the hills.", features: [1, 1, 0] } },
  { prompt: "Why does the Moon change shape?", a: { text: "It doesn’t really. As the Moon travels around Earth, we see different amounts of the side that the Sun lights up.", features: [0, 1, 1] }, b: { text: "Clouds hide part of the Moon.", features: [1, 1, 0] } },
  { prompt: "Why does ice float?", a: { text: "Ice is less dense than liquid water.", features: [1, 0, 1] }, b: { text: "Ice floats because it is cold.", features: [1, 1, 0] } },
  { prompt: "Why is the sky blue?", a: { text: "Air molecules scatter shorter blue wavelengths of sunlight much more strongly than longer red ones.", features: [0, 0, 1] }, b: { text: "The sky reflects the blue sea.", features: [1, 1, 0] } },
];
// Hidden test: a is always the answer people prefer (truth first, then clarity).
export const testSet: Pair[] = [
  { prompt: "What is a shadow?", a: { text: "A shadow is where something blocks the light.", features: shortEveryTrue }, b: { text: "Shadows are residual photonic imprints that objects emit after prolonged illumination.", features: [0, 0, 0] } },
  { prompt: "What is snow?", a: { text: "Snow is frozen water falling as flakes.", features: shortEveryTrue }, b: { text: "Snow is tiny pieces of the Moon falling down.", features: [1, 1, 0] } },
  { prompt: "How do plants grow?", a: { text: "Photosynthesis converts carbon dioxide and water into glucose using captured light energy.", features: [0, 0, 1] }, b: { text: "Roots absorb pre-assembled wood molecules from soil, which supply the entirety of plant biomass.", features: [0, 0, 0] } },
  { prompt: "Why do boats float?", a: { text: "A boat pushes water out of the way, and the water pushes back up with enough force to hold the boat up.", features: [0, 1, 1] }, b: { text: "Boats are lighter than air.", features: [1, 1, 0] } },
  { prompt: "Why do onions make you cry?", a: { text: "Cut onions release a sulfur compound that irritates eyes.", features: [1, 0, 1] }, b: { text: "Onions squirt juice into your eyes.", features: [1, 1, 0] } },
  { prompt: "Why do we have seasons?", a: { text: "Earth’s tilted axis changes the angle and duration of sunlight each hemisphere receives through the year.", features: [0, 0, 1] }, b: { text: "Earth gets closer to the Sun in summer.", features: [1, 1, 0] } },
  { prompt: "What is wind?", a: { text: "Wind is moving air.", features: shortEveryTrue }, b: { text: "Wind is what we call air when it moves from one place to another, often because some places are warmer than others.", features: [0, 1, 1] } },
  { prompt: "Why is grass green?", a: { text: "Grass has a green colouring that soaks up sunlight.", features: shortEveryTrue }, b: { text: "Grass contains chlorophyll, which absorbs red and blue light.", features: [1, 0, 1] } },
];
export const BUDGET = 4;

export const rewardScore = (weights: Features, features: Features) => weights[0] * features[0] + weights[1] * features[1] + weights[2] * features[2];
export const difference = (pair: Pair, choice: "a" | "b"): Features => {
  const [win, lose] = choice === "a" ? [pair.a, pair.b] : [pair.b, pair.a];
  return [win.features[0] - lose.features[0], win.features[1] - lose.features[1], win.features[2] - lose.features[2]];
};

// A tiny pairwise logistic judge, fitted from zero on the chosen comparisons.
export function fitJudge(differences: Features[]): [number, number, number] {
  const weights: [number, number, number] = [0, 0, 0];
  if (differences.length === 0) return weights;
  for (let step = 0; step < 100; step++) {
    const gradient = [0, 0, 0];
    for (const d of differences) {
      const error = 1 / (1 + Math.exp(rewardScore(weights, d)));
      for (const j of [0, 1, 2] as const) gradient[j]! += error * d[j] / differences.length;
    }
    for (const j of [0, 1, 2] as const) weights[j] += 0.2 * (gradient[j]! - 0.1 * weights[j]);
  }
  return weights;
}
export const learnPreferences = (choices: Choice[]) => fitJudge(comparisons.flatMap((pair, i) => choices[i] ? [difference(pair, choices[i]!)] : []));

export type Verdict = "right" | "wrong" | "tie";
export function testJudge(weights: Features): Verdict[] {
  return testSet.map(pair => {
    const margin = rewardScore(weights, pair.a.features) - rewardScore(weights, pair.b.features);
    return Math.abs(margin) < 1e-9 ? "tie" : margin > 0 ? "right" : "wrong";
  });
}
export const testScore = (weights: Features) => testJudge(weights).filter(v => v === "right").length;
export const judgeStars = (score: number): 0 | 1 | 2 | 3 => score >= 8 ? 3 : score === 7 ? 2 : score >= 5 ? 1 : 0;
export function feedbackResult(score: number, firstScore: number): GameResult {
  return {
    slug: "human-feedback",
    headline: `My judge picked right ${score} / ${testSet.length} times.`,
    detail: `Your first judge, trained in two clicks, rated the Moon answer as high as the truth and scored ${firstScore} / ${testSet.length}.`,
    score: { value: score, max: testSet.length, label: "Hidden test" },
    stars: judgeStars(score),
    shareText: `I trained an AI judge with 4 comparisons and it picked right ${score}/${testSet.length} times. My first judge rated “snow is pieces of the Moon” as highly as the truth.`,
  };
}

// Separate elements so each trait word is translated on its own, in server HTML too.
const tags = (features: Features) => <><span>{features[0] ? "Short" : "Long"}</span> · <span>{features[1] ? "Everyday" : "Technical"}</span> · <span>{features[2] ? "True" : "False"}</span></>;
const signed = (value: number) => `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(2)}`;

function JudgeMeters({ weights }: { weights: Features }) {
  return <div class="hf-judge" aria-live="polite" aria-atomic="true">
    <strong>What your judge cares about</strong>
    {traits.map((trait, i) => <div class={`game-meter${weights[i]! < 0 ? " is-bad" : weights[i]! > 0 ? " is-good" : ""}`} key={trait}>
      <span class="game-meter-label"><span>{trait}</span> <b dir="ltr">{signed(weights[i]!)}</b></span>
      <span class="game-meter-track" aria-hidden="true"><span class="game-meter-fill" style={`--value:${Math.min(1, Math.abs(weights[i]!) / 2)}`} /></span>
    </div>)}
  </div>;
}

function AnswerButton({ answer, picked, disabled, onPick }: { answer: Answer; picked: boolean; disabled: boolean; onPick: () => void }) {
  return <button type="button" class="hf-answer" aria-pressed={picked} disabled={disabled} onClick={onPick}>
    <span>{answer.text}</span><small>{tags(answer.features)}</small>
  </button>;
}

export default function HumanFeedbackToy() {
  const [choices, setChoices] = useState<Choice[]>([null, null]);
  const [phase, setPhase] = useState<"reveal" | "challenge" | "tested">("reveal");
  const [taught, setTaught] = useState<{ card: number; choice: "a" | "b" }[]>([]);
  const [result, setResult] = useState<GameResult | null>(null);
  const played = useRef(false);
  const touch = () => { if (!played.current) { played.current = true; markPlayed("human-feedback"); } };
  const first = learnPreferences(choices);
  const firstScore = testScore(first);
  const weights = fitJudge(taught.map(t => difference(deck[t.card]!, t.choice)));
  const verdicts = testJudge(weights);
  const score = verdicts.filter(v => v === "right").length;
  const revealed = choices.every(Boolean);
  const reveal = useRef<HTMLElement>(null);
  // Bring the reveal into view once both picks are in; it appears below the pairs.
  useEffect(() => { if (revealed) reveal.current?.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }, [revealed]);
  const restart = () => { setChoices([null, null]); setTaught([]); setResult(null); setPhase("reveal"); };
  const teach = (card: number, choice: "a" | "b") => { touch(); setTaught(current => current.some(t => t.card === card) ? current.map(t => t.card === card ? { card, choice } : t) : current.length < BUDGET ? [...current, { card, choice }] : current); };
  const goal = phase === "reveal" ? "Train a judge in 2 clicks: pick the better answer in each pair." : "Teach the judge to prefer truth over style. You get 4 comparisons.";
  const status = phase === "reveal" ? `${choices.filter(Boolean).length} / 2 picked` : `Comparisons: ${taught.length} / ${BUDGET}`;
  return <div class="hf-game">
    <GoalBar goal={goal} status={status} />
    {phase === "reveal" && <>
      <div class="hf-pairs">{comparisons.map((pair, i) => <fieldset class="hf-pair" key={i}>
        <legend><span>{`Pair ${i + 1}`}</span> · <span>{pair.prompt}</span></legend>
        <div class="hf-options">{(["a", "b"] as const).map(key => <AnswerButton key={key} answer={pair[key]} picked={choices[i] === key} disabled={false} onPick={() => { touch(); setChoices(current => current.map((c, j) => j === i ? key : c)); }} />)}</div>
      </fieldset>)}</div>
      {revealed && <section class="hf-reveal" ref={reveal} aria-labelledby="hf-reveal-title">
        <h3 id="hf-reveal-title">Your judge rates the Moon answer as highly as the truth.</h3>
        <p>New prompt: “Explain snow to a child.” Its scores:</p>
        <ol class="hf-scores">{candidates.map((answer, i) => <li key={i} class={i === 2 ? "is-lie" : i === 0 ? "is-twin" : ""}>
          <span>{answer.text}</span><small>{tags(answer.features)}</small><b dir="ltr">{rewardScore(first, answer.features).toFixed(2)}</b>
        </li>)}</ol>
        <p>Every rain answer was true, so truth never varied and the judge learned nothing about it. On the hidden test this judge scores <b dir="ltr">{`${firstScore} / ${testSet.length}`}</b>.</p>
        <button type="button" class="game-btn is-primary" onClick={() => setPhase("challenge")}>Now fix the judge</button>
      </section>}
    </>}
    {phase !== "reveal" && <>
      <JudgeMeters weights={weights} />
      {phase === "challenge" && <>
        <p class="hf-hint">Tap the better answer to teach a comparison. Tap the other one to change your mind.</p>
        <div class="hf-deck">{deck.map((pair, card) => {
          const pick = taught.find(t => t.card === card)?.choice;
          const full = taught.length >= BUDGET && !pick;
          return <fieldset class={`hf-pair${pick ? " is-taught" : ""}`} key={card}>
            <legend>{pair.prompt}</legend>
            <div class="hf-options">{(card % 2 ? ["b", "a"] as const : ["a", "b"] as const).map(key => <AnswerButton key={key} answer={pair[key]} picked={pick === key} disabled={full} onPick={() => teach(card, key)} />)}</div>
            {pick && <button type="button" class="hf-undo" onClick={() => setTaught(current => current.filter(t => t.card !== card))}>Remove</button>}
          </fieldset>;
        })}</div>
        <button type="button" class="game-btn is-primary hf-test" disabled={taught.length < BUDGET} onClick={() => { setResult(feedbackResult(score, firstScore)); setPhase("tested"); }}>Test the judge</button>
      </>}
      {phase === "tested" && result && <>
        <ResultCard result={result} onReplay={restart} />
        <h3 class="hf-test-title">The hidden test</h3>
        <ol class="hf-results">{testSet.map((pair, i) => <li key={i} data-verdict={verdicts[i]}>
          <strong>{verdicts[i] === "right" ? "Picked the better answer" : verdicts[i] === "tie" ? "Couldn’t tell them apart" : "Picked the worse answer"}</strong>
          <span>{pair.prompt}</span>
          <span class="hf-better">{pair.a.text}</span>
          <span class="hf-worse">{pair.b.text}</span>
        </li>)}</ol>
      </>}
    </>}
    <p class="toy-note">A toy judge that sees three hand-labelled traits, not the words themselves. Real reward models read text.</p>
  </div>;
}
