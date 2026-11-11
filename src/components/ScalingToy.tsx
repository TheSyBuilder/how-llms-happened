import '../i18n/preact';
import '../styles/games/scaling-laws.css';
import { useLayoutEffect, useRef, useState } from "preact/hooks";
import GoalBar from "./game/GoalBar";
import ResultCard, { type GameResult } from "./game/ResultCard";
import { markPlayed } from "../lib/progress";

export const trainingBudgets = [64, 256, 1024];
// Invented dimensionless scores, chosen only to illustrate competing resources.
export function scalingPoint(budget: number, step: number) {
  const model = 2 ** (step / 10);
  const text = budget / model;
  const modelPenalty = model ** -0.3;
  const textPenalty = text ** -0.7;
  const loss = 1 + modelPenalty + textPenalty;
  return { model, text, loss, modelPenalty, textPenalty };
}
export function scalingCurve(budget: number) {
  return Array.from({ length: 61 }, (_, step) => ({ step, ...scalingPoint(budget, step) }));
}
// The slider step (ten steps per doubling of model size) with the lowest toy loss.
export function bestStep(budget: number) {
  return scalingCurve(budget).reduce((a, b) => (b.loss < a.loss ? b : a)).step;
}
// Distance is scored in doublings: 100 points on the spot, 50 at 2× off, nothing at 4× off.
export const guessPoints = (guess: number, best: number) => Math.max(0, 100 - 5 * Math.abs(guess - best));
export const offBy = (guess: number, best: number) => 2 ** (Math.abs(guess - best) / 10);
export function scalingStars(total: number): 0 | 1 | 2 | 3 {
  return total >= 220 ? 3 : total >= 160 ? 2 : total >= 80 ? 1 : 0;
}
export const START_STEP = 0;

const x = (step: number) => 52 + step * 5.3;
const y = (loss: number) => 236 - (loss - 1) * 103;
const number = (value: number) => value.toFixed(1);
const path = (budget: number) => scalingCurve(budget).map((p, i) => `${i === 0 ? "M" : "L"}${x(p.step)},${y(p.loss)}`).join(" ");
const times = (ratio: number) => `${ratio.toFixed(1)}×`;

type Guess = { budget: number; step: number; best: number; points: number };

export default function ScalingToy() {
  const [round, setRound] = useState(0);
  const [step, setStep] = useState(START_STEP);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [announce, setAnnounce] = useState("");
  const played = useRef(false);
  const nextButton = useRef<HTMLButtonElement>(null);
  const budget = trainingBudgets[round];
  const revealed = guesses[round];
  const finished = round >= trainingBudgets.length;
  const point = budget ? scalingPoint(budget, step) : undefined;
  const total = guesses.reduce((sum, g) => sum + g.points, 0);
  useLayoutEffect(() => { if (revealed) nextButton.current?.focus(); }, [revealed]);

  const move = (value: number) => {
    if (revealed) return;
    if (!played.current) { played.current = true; markPlayed("scaling-laws"); }
    setStep(value);
  };
  const drop = () => {
    if (!budget || revealed) return;
    if (!played.current) { played.current = true; markPlayed("scaling-laws"); }
    const best = bestStep(budget);
    const points = guessPoints(step, best);
    setGuesses([...guesses, { budget, step, best, points }]);
    setAnnounce(`Budget ${budget}: the best size is ${number(2 ** (best / 10))} model units. Your guess, ${number(2 ** (step / 10))}, was ${times(offBy(step, best))} off. ${points} points.`);
  };
  const advance = () => { setRound(round + 1); setStep(START_STEP); setAnnounce(""); };
  const replay = () => { setRound(0); setStep(START_STEP); setGuesses([]); setAnnounce(""); };

  const meanOff = guesses.length ? 2 ** (guesses.reduce((sum, g) => sum + Math.abs(g.step - g.best), 0) / guesses.length / 10) : 1;
  const result: GameResult = {
    slug: "scaling-laws",
    headline: `I found the sweet spot within ${times(meanOff)} on 3 budgets.`,
    detail: "Each 4× bigger budget moved the toy’s best model size up about 2.6×. Kaplan et al. reported a similar trend in real training runs: put most extra compute into a bigger model.",
    score: { value: total, max: 300, label: "Points" },
    stars: scalingStars(total),
    shareText: `I guessed the compute-optimal model size for 3 budgets, ${times(meanOff)} off on average. Scaling laws, played as a game.`,
  };

  return (
    <div class="scaling-toy sl-game">
      <GoalBar
        goal="Guess the model size with the lowest loss before the curve is revealed."
        status={finished ? "3 budgets played" : `Budget ${round + 1} / 3 · ${budget!.toLocaleString("en-US")} units`}
        score={{ value: total, max: 300, label: "Points" }}
      />
      <p class="screen-reader-only" role="status">{announce}</p>
      {finished || !budget || !point ? (
        <>
          <figure class="scaling-chart sl-chart">
            <svg viewBox="0 0 400 298" role="img" aria-label="Your three guesses against the revealed toy loss curves.">
              <g class="scaling-grid">{[1, 2, 3].map((loss) => <path d={`M52 ${y(loss)}H370`} />)}</g>
              <path d="M52 37V236H370" fill="none" stroke="currentColor" />
              {guesses.map((g, i) => <g class={`sl-final sl-final-${i}`}>
                <path d={path(g.budget)} fill="none" stroke-width="2.5" />
                <circle cx={x(g.best)} cy={y(scalingPoint(g.budget, g.best).loss)} r="9" fill="none" stroke="currentColor" stroke-width="2" />
                <circle class="scaling-dot" cx={x(g.step)} cy={y(scalingPoint(g.budget, g.step).loss)} r="6" fill="var(--accent)" stroke="currentColor" stroke-width="2" />
                <text x={x(g.best)} y={y(scalingPoint(g.budget, g.best).loss) + 30} text-anchor="middle" font-size="16" fill="currentColor">{g.budget.toLocaleString("en-US")}</text>
              </g>)}
              <g fill="currentColor" text-anchor="middle" font-size="19">{[0, 20, 40, 60].map((s) => <text x={x(s)} y="270">{2 ** (s / 10)}</text>)}<text x="210" y="294">Model units · equal ratios</text></g>
            </svg>
          </figure>
          <ol class="sl-recap">{guesses.map((g) => <li><span>{`Budget ${g.budget.toLocaleString("en-US")}`}</span> <strong>{`${times(offBy(g.step, g.best))} off`}</strong> <span>{`${g.points} points`}</span></li>)}</ol>
          <ResultCard result={result} onReplay={replay} />
        </>
      ) : (
        <>
          <p class="sl-rule">Budget = model size × text read. A bigger model learns more from each word, but at a fixed budget it reads fewer words.</p>
          <figure class="scaling-chart sl-chart">
            <svg viewBox="0 0 400 298" role="img" aria-labelledby="curve-title">
              <title id="curve-title">{revealed ? `Toy loss across model sizes for budget ${budget}. Lowest at ${number(2 ** (revealed.best / 10))} model units.` : `Hidden toy loss curve for budget ${budget}. Your guess: ${number(point.model)} model units.`}</title>
              <g class="scaling-grid">{[1, 2, 3].map((loss) => <path d={`M52 ${y(loss)}H370`} />)}</g>
              <g fill="currentColor" font-size="19"><text x="52" y="23">Toy loss ↓ lower is better</text>{[1, 2, 3].map((loss) => <text x="16" y={y(loss) + 6}>{loss}</text>)}</g>
              <path d="M52 37V236H370" fill="none" stroke="currentColor" />
              {guesses.filter((g) => g.budget !== budget).map((g) => <path d={path(g.budget)} fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="4 5" opacity=".6" />)}
              {!revealed && <rect class="sl-fog" x="53" y="37" width="317" height="198" />}
              {!revealed && <text class="sl-fog-label" x="211" y="140" text-anchor="middle" font-size="20">curve hidden</text>}
              {revealed && <path class="sl-curve" d={path(budget)} fill="none" stroke="var(--deep)" stroke-width="3" pathLength={1} />}
              <path class="sl-guess-line" d={`M${x(step)} 37V236`} />
              {revealed && <circle class="sl-best" cx={x(revealed.best)} cy={y(scalingPoint(budget, revealed.best).loss)} r="10" fill="none" stroke="currentColor" stroke-width="2.5" />}
              {revealed && <circle class="scaling-dot" cx={x(step)} cy={y(point.loss)} r="7" fill="var(--accent)" stroke="currentColor" stroke-width="2" />}
              <path class="sl-guess-marker" d={`M${x(step)} 236l-8 12h16z`} />
              <g fill="currentColor" text-anchor="middle" font-size="19">{[0, 20, 40, 60].map((s) => <text x={x(s)} y="270">{2 ** (s / 10)}</text>)}<text x="210" y="294">Model units · equal ratios</text></g>
            </svg>
          </figure>
          <div class="toy-controls sl-controls">
            <label for="model-size">Your guess · model size <output for="model-size">{number(point.model)} units</output></label>
            <input id="model-size" dir="ltr" type="range" min="0" max="60" step="1" value={step} disabled={!!revealed}
              aria-valuetext={`${number(point.model)} model units, ${number(point.text)} text units`}
              onInput={(event) => move(Number(event.currentTarget.value))} />
            <div class="range-ends" dir="ltr"><span>1 · small model, lots of text</span><span>64 · big model, little text</span></div>
            <p class="sl-split" dir="ltr"><span>{`model ${number(point.model)}`}</span> × <span>{`text ${number(point.text)}`}</span> = <span>{budget.toLocaleString("en-US")}</span></p>
          </div>
          {revealed ? (
            <div class="sl-reveal">
              <p><strong>{revealed.points >= 90 ? "Right on the sweet spot." : revealed.points >= 50 ? "Close." : "The sweet spot was elsewhere."}</strong> {`Best: ${number(2 ** (revealed.best / 10))} units. You: ${number(point.model)}, ${times(offBy(step, revealed.best))} off, ${revealed.points} points.`}</p>
              <button type="button" class="game-btn is-primary" ref={nextButton} onClick={advance}>{round + 1 < trainingBudgets.length ? "Next budget" : "See your result"}</button>
            </div>
          ) : (
            <button type="button" class="game-btn is-primary sl-drop" onClick={drop}>Drop my guess</button>
          )}
        </>
      )}
      <p class="toy-note">An invented curve in toy units, shaped like Kaplan’s trade-off but not the paper’s fitted numbers.</p>
    </div>
  );
}
