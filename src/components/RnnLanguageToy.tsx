import '../i18n/preact';
import '../styles/games/rnn-language-model.css';
import { useRef, useState } from 'preact/hooks';
import GoalBar from './game/GoalBar';
import ResultCard, { type GameResult } from './game/ResultCard';
import { markPlayed } from '../lib/progress';

type State = [number, number];
export type Clue = 'river' | 'loan';
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
export function readWord(previous: State, word: string): State {
  const cue = word === 'river' ? 2 : word === 'loan' ? -2 : 0;
  return [sigmoid(1.6 * (2 * previous[0] - 1) + cue), sigmoid(1.6 * (2 * previous[1] - 1) - cue)];
}
/** Chance of "water" after reading the words; a fixed window restarts the same reader on the last `window` words. */
export function waterChance(words: string[], window?: number) {
  const visible = window === undefined ? words : words.slice(-window);
  const state = visible.reduce<State>(readWord, [.5, .5]);
  // Two-word softmax: scores are +3d for water and -3d for money.
  return sigmoid(6 * (state[0] - state[1]));
}
export const answerFor = (clue: Clue) => clue === 'river' ? 'water' : 'money';
export type Target = { clue: Clue; window: number; need: number };
export const targets: Target[] = [
  { clue: 'river', window: 2, need: .7 },
  { clue: 'loan', window: 3, need: .7 },
  { clue: 'river', window: 5, need: .75 },
];
export const ending = 'bank';
export const fillers = ['we', 'walked', 'to', 'the', 'then', 'slowly', 'past', 'shops'];
export const maxWords = 10;
/** The window "can't tell" when it sits within five points of a coin flip. */
export const windowUnsure = .55;
export function judge(sentence: string[], target: Target) {
  const toward = (p: number) => target.clue === 'river' ? p : 1 - p;
  const rnn = toward(waterChance(sentence));
  const window = toward(waterChance(sentence, target.window));
  return { rnn, window, beaten: rnn >= target.need && window < windowUnsure };
}
/** Fewest words that beat a target: the clue, then enough words to push it just past the window edge. */
export const par = (target: Target) => target.window + 1;
export const parTotal = targets.reduce((sum, target) => sum + par(target), 0);
/** Strokes = words in each winning sentence plus one for every read that failed. */
export function rnnStars(strokes: number): 0 | 1 | 2 | 3 {
  return strokes <= parTotal ? 3 : strokes <= parTotal + 2 ? 2 : strokes <= parTotal + 6 ? 1 : 0;
}

const percent = (p: number) => `${Math.round(p * 100)}%`;

export default function RnnLanguageToy() {
  const [level, setLevel] = useState(0);
  const [built, setBuilt] = useState<string[]>([]);
  const [strokes, setStrokes] = useState(0);
  const [verdict, setVerdict] = useState<ReturnType<typeof judge> | null>(null);
  const [done, setDone] = useState(false);
  const played = useRef(false);
  const touch = () => { if (!played.current) { played.current = true; markPlayed('rnn-language-model'); } };
  const target = targets[level]!;
  const sentence = [...built, ending];
  const answer = answerFor(target.clue);
  const solved = verdict?.beaten === true;
  const full = sentence.length >= maxWords;

  const add = (word: string) => { touch(); if (!full && !solved) { setBuilt(list => [...list, word]); setVerdict(null); } };
  const remove = (index: number) => { if (!solved) { setBuilt(list => list.filter((_, i) => i !== index)); setVerdict(null); } };
  const read = () => {
    touch();
    const result = judge(sentence, target);
    setVerdict(result);
    setStrokes(s => s + (result.beaten ? sentence.length : 1));
  };
  const next = () => {
    if (level === targets.length - 1) { setDone(true); return; }
    setLevel(l => l + 1); setBuilt([]); setVerdict(null);
  };
  const replay = () => { setLevel(0); setBuilt([]); setStrokes(0); setVerdict(null); setDone(false); };

  const stars = rnnStars(strokes);
  const result: GameResult = {
    slug: 'rnn-language-model',
    headline: strokes <= parTotal ? `I beat the window in ${strokes} words. That’s par.` : `I beat the window in ${strokes} strokes (par ${parTotal}).`,
    detail: 'Each clue sat just outside the fixed window, where only the running memory could still see it.',
    score: { value: strokes, label: 'Strokes' },
    stars,
    shareText: `I fooled a fixed-window language model in ${strokes} strokes (par ${parTotal}). Can you beat the window?`,
  };
  const feedback = !verdict ? '' : verdict.beaten
    ? `Beaten in ${sentence.length} words. The window is stuck at ${percent(verdict.window)}; the RNN says ${answer} at ${percent(verdict.rnn)}.`
    : verdict.window >= windowUnsure
      ? `The window still sees the clue: ${percent(verdict.window)} ${answer}. +1 stroke.`
      : `The RNN forgot too: only ${percent(verdict.rnn)} ${answer}, it needs ${percent(target.need)}. +1 stroke.`;

  return <div class="rnn-game">
    <GoalBar goal="Build the shortest sentence the fixed window gets wrong but the running memory gets right." status={done ? 'Finished' : `Target ${level + 1} / ${targets.length} · par ${par(target)}`} score={{ value: strokes, label: 'Strokes' }} />
    {done ? <ResultCard result={result} onReplay={replay} /> : <>
      <p class="rnn-target">{`Make the RNN predict “${answer}” after “bank”, at least ${percent(target.need)} sure, while the window only reads the last ${target.window} words.`}</p>
      <div class="rnn-sentence" dir="ltr" lang="en" role="group" aria-label="Your sentence">
        {sentence.map((word, i) => {
          const inWindow = i >= sentence.length - target.window;
          const cls = `rnn-slot ${inWindow ? 'in-window' : ''} ${word === 'river' || word === 'loan' ? 'is-clue' : ''}`;
          return i === sentence.length - 1
            ? <span class={`${cls} is-locked`} key="end">{word}</span>
            : <button type="button" class={cls} key={i} disabled={solved} aria-label={`Remove ${word}`} onClick={() => remove(i)}>{word}</button>;
        })}
        <span class="rnn-next" aria-hidden="true">→ ?</span>
      </div>
      <p class="rnn-legend"><span class="rnn-key" aria-hidden="true" />{`The window sees the last ${target.window} words. Tap a word to remove it.`}</p>
      <div class="rnn-tiles" role="group" aria-label="Word tiles" dir="ltr" lang="en">
        {(['river', 'loan', ...fillers]).map(word => <button type="button" class={`game-btn ${word === 'river' || word === 'loan' ? 'is-clue' : ''}`} key={word} disabled={full || solved} onClick={() => add(word)}>{word}</button>)}
      </div>
      {verdict && <div class="rnn-readout" aria-hidden="true">
        <div class={`game-meter ${verdict.window < windowUnsure ? 'is-good' : 'is-bad'}`}><span class="game-meter-label">{`Window (last ${target.window}) · ${answer}`} <b>{percent(verdict.window)}</b></span><span class="game-meter-track"><span class="game-meter-fill" style={`--value:${verdict.window}`} /></span></div>
        <div class={`game-meter ${verdict.rnn >= target.need ? 'is-good' : 'is-bad'}`}><span class="game-meter-label">{`Running memory · ${answer}`} <b>{percent(verdict.rnn)}</b></span><span class="game-meter-track"><span class="game-meter-fill" style={`--value:${verdict.rnn}`} /></span></div>
      </div>}
      <p class="rnn-feedback" aria-live="polite">{feedback}</p>
      <div class="rnn-actions">
        {solved
          ? <button type="button" class="game-btn is-primary" onClick={next}>{level === targets.length - 1 ? 'See my score' : 'Next target'}</button>
          : <>
            <button type="button" class="game-btn is-primary" onClick={read}>Read it to both models</button>
            <button type="button" class="game-btn" disabled={!built.length} onClick={() => { setBuilt([]); setVerdict(null); }}>Clear</button>
          </>}
      </div>
      <p class="toy-note">A toy: two hand-set memory units, not Mikolov’s trained network. The window is the same reader restarted on the last few words.</p>
    </>}
  </div>;
}
