import '../i18n/preact';
import '../styles/games/neural-language-model.css';
import { useRef, useState } from 'preact/hooks';
import GoalBar from './game/GoalBar';
import ResultCard, { type GameResult } from './game/ResultCard';
import { markPlayed } from '../lib/progress';

export type Word = 'cat' | 'dog' | 'horse' | 'bike' | 'car';
export type Vector = [number, number, number];
export type Lesson = { word: Word; next: 'sat' | 'stopped' };
export type Predictor = { weights: Vector; steps: number };

export const words: Word[] = ['cat', 'dog', 'horse', 'bike', 'car'];
// Hand-placed vectors standing in for ones learned from earlier reading. Shared features make words move together.
export const vectors: Record<Word, Vector> = { cat: [1, 0, 0], dog: [.8, .3, 0], horse: [.3, .8, 0], bike: [0, .5, .6], car: [0, 0, 1] };
export const lessons: Lesson[] = [
  { word: 'cat', next: 'sat' }, { word: 'car', next: 'stopped' }, { word: 'horse', next: 'stopped' },
  { word: 'dog', next: 'sat' }, { word: 'bike', next: 'stopped' }, { word: 'horse', next: 'sat' },
];
export const learningRate = 1.5;
/** A prediction "moves" when its chance of "sat" changes by at least this many percentage points. */
export const shiftThreshold = 1;
export const maxScore = lessons.length * (words.length - 1);

const dot = (a: Vector, b: Vector) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const freshPredictor = (): Predictor => ({ weights: [0, 0, 0], steps: 0 });
export function satChance(model: Predictor, word: Word) {
  return 1 / (1 + Math.exp(-dot(model.weights, vectors[word])));
}
/** One cross-entropy gradient step on the shared predictor for "the <word> <next>". */
export function teach(model: Predictor, lesson: Lesson): Predictor {
  const v = vectors[lesson.word];
  const error = satChance(model, lesson.word) - (lesson.next === 'sat' ? 1 : 0);
  return { weights: v.map((x, i) => model.weights[i]! - learningRate * error * x) as Vector, steps: model.steps + 1 };
}
/** Percentage-point change in every word's chance of "sat" caused by one lesson. */
export function shiftsAfter(model: Predictor, lesson: Lesson): Record<Word, number> {
  const after = teach(model, lesson);
  return Object.fromEntries(words.map(word => [word, (satChance(after, word) - satChance(model, word)) * 100])) as Record<Word, number>;
}
export function movers(model: Predictor, lesson: Lesson): Word[] {
  const shifts = shiftsAfter(model, lesson);
  return words.filter(word => word !== lesson.word && Math.abs(shifts[word]) >= shiftThreshold);
}
/** One point for every other word called correctly: picked and moved, or left alone and stayed put. */
export function scoreCalls(model: Predictor, lesson: Lesson, picked: Word[]) {
  const moved = movers(model, lesson);
  return words.filter(word => word !== lesson.word && picked.includes(word) === moved.includes(word)).length;
}
export function neuralStars(score: number): 0 | 1 | 2 | 3 {
  return score >= 22 ? 3 : score >= 19 ? 2 : score >= 15 ? 1 : 0;
}

const percent = (p: number) => `${Math.round(p * 100)}%`;
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(1)}`;

export default function NeuralLanguageToy() {
  const [model, setModel] = useState(freshPredictor);
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<Word[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const played = useRef(false);
  const touch = () => { if (!played.current) { played.current = true; markPlayed('neural-language-model'); } };
  const lesson = lessons[round]!;
  const shifts = shiftsAfter(model, lesson);
  const moved = movers(model, lesson);
  const shown = revealed ? teach(model, lesson) : model;
  const roundScore = scoreCalls(model, lesson, picked);
  const last = round === lessons.length - 1;

  const reveal = () => { touch(); setScore(s => s + roundScore); setRevealed(true); };
  const next = () => {
    if (last) { setDone(true); return; }
    setModel(m => teach(m, lesson)); setRound(r => r + 1); setPicked([]); setRevealed(false);
  };
  const replay = () => { setModel(freshPredictor()); setRound(0); setPicked([]); setRevealed(false); setScore(0); setDone(false); };
  const toggle = (word: Word) => { touch(); setPicked(list => list.includes(word) ? list.filter(w => w !== word) : [...list, word]); };

  const stars = neuralStars(score);
  const result: GameResult = {
    slug: 'neural-language-model',
    headline: `I called ${score} of ${maxScore} word shifts.`,
    detail: stars === 3 ? 'You read the shared vectors like the network does: words with features in common move together.' : 'Words move when they share a feature with the word being taught. Words with nothing in common stay put.',
    score: { value: score, max: maxScore, label: 'Calls' },
    stars,
    shareText: `I predicted ${score}/${maxScore} of the ways a 2003 neural language model generalizes. Teach “cat”, and does “dog” change?`,
  };

  return <div class="nlm-game">
    <GoalBar goal="Before each lesson, tap every word whose prediction will move." status={done ? 'Finished' : `Lesson ${round + 1} / ${lessons.length}`} score={{ value: score, max: maxScore, label: 'Calls' }} />
    {done ? <ResultCard result={result} onReplay={replay} /> : <>
      <div class="nlm-lesson">
        <span class="nlm-lesson-label">{`Lesson ${round + 1}`}</span>
        <p><span>Teach:</span> <strong dir="ltr" lang="en">the {lesson.word} {lesson.next}</strong></p>
      </div>
      <p class="nlm-question">{revealed ? (moved.length ? `Moved: ${moved.join(', ')}` : 'Nothing else moved.') : 'Which other words will change their guess for “sat”?'}</p>
      <div class="nlm-words" role="group" aria-label="Words">
        {words.map(word => {
          const taught = word === lesson.word, chose = picked.includes(word), didMove = moved.includes(word);
          const status = revealed && !taught ? (chose === didMove ? 'is-right' : 'is-wrong') : '';
          const body = <>
            <span class="nlm-word" dir="ltr" lang="en">{word}</span>
            <span class="nlm-features" aria-hidden="true">{vectors[word].map((value, i) => <i key={i} style={`--v:${value}`} />)}</span>
            <span class="nlm-chance"><span>sat</span> <b dir="ltr">{percent(satChance(shown, word))}</b></span>
            <span class="nlm-tag">{taught ? 'Being taught' : revealed ? `${signed(shifts[word])} pts` : chose ? 'Will move' : 'Stays'}</span>
          </>;
          return taught
            ? <div class="nlm-card is-taught" key={word}>{body}</div>
            : <button type="button" class={`nlm-card ${status}`} key={word} aria-pressed={chose} disabled={revealed} onClick={() => toggle(word)}>{body}</button>;
        })}
      </div>
      <p class="nlm-feedback" aria-live="polite">{revealed ? `${roundScore} of ${words.length - 1} calls right.` : ''}</p>
      <div class="nlm-actions">
        {revealed
          ? <button type="button" class="game-btn is-primary" onClick={next}>{last ? 'See my score' : 'Next lesson'}</button>
          : <button type="button" class="game-btn is-primary" onClick={reveal}>Teach it</button>}
      </div>
      <p class="toy-note">A toy: five words with hand-placed three-number vectors, and one shared predictor that each lesson nudges.</p>
    </>}
  </div>;
}
