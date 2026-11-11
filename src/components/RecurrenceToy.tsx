import '../i18n/preact';
import '../styles/games/drop-recurrence.css';
import { useEffect, useRef, useState } from 'preact/hooks';
import GoalBar from './game/GoalBar';
import ResultCard, { type GameResult } from './game/ResultCard';
import { markPlayed } from '../lib/progress';

export type Wiring = 'chain' | 'conv' | 'attention';
export const wirings: { id: Wiring; name: string; rule: string }[] = [
  { id: 'chain', name: 'Recurrent chain', rule: 'Each state waits for the one before it.' },
  { id: 'conv', name: 'Convolution stack', rule: 'Every position reads three neighbours; spacing widens 1, 2, 4, 8, 16 per layer.' },
  { id: 'attention', name: 'All-pairs attention', rule: 'Every position reads every position in one step.' },
];
/** Reads the chip can do at once. A step with more reads than this takes several ticks. */
export const readsPerTick = 128;
export const raceLengths = [8, 16, 32, 64];
const spacing = (layer: number) => 2 ** ((layer - 1) % 5);

/** Dependent steps from word 1 to word n, and the reads each step needs across the whole sentence. */
export function plan(wiring: Wiring, n: number) {
  if (wiring === 'chain') return { steps: n - 1, reads: 2 };
  if (wiring === 'attention') return { steps: 1, reads: n * n };
  let steps = 0, reach = 0;
  while (reach < n - 1) reach += spacing(++steps);
  return { steps, reads: 3 * n };
}
export const ticksPerStep = (wiring: Wiring, n: number) => Math.ceil(plan(wiring, n).reads / readsPerTick);
export const finishTick = (wiring: Wiring, n: number) => plan(wiring, n).steps * ticksPerStep(wiring, n);
/** Furthest word (1-based) that has heard from word 1 after a number of ticks. */
export function reachAt(wiring: Wiring, n: number, tick: number) {
  const done = Math.floor(Math.max(0, tick) / ticksPerStep(wiring, n));
  if (wiring === 'chain') return Math.min(n, 1 + done);
  if (wiring === 'attention') return done >= 1 ? n : 1;
  let reach = 1;
  for (let layer = 1; layer <= done; layer++) reach += spacing(layer);
  return Math.min(n, reach);
}
export function winners(n: number): Wiring[] {
  const best = Math.min(...wirings.map(w => finishTick(w.id, n)));
  return wirings.filter(w => finishTick(w.id, n) === best).map(w => w.id);
}
export function raceStars(correct: number): 0 | 1 | 2 | 3 {
  return correct >= 4 ? 3 : correct === 3 ? 2 : correct === 2 ? 1 : 0;
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const nameOf = (id: Wiring) => wirings.find(w => w.id === id)!.name;

export default function RecurrenceToy() {
  const [race, setRace] = useState(0);
  const [bet, setBet] = useState<Wiring | null>(null);
  const [tick, setTick] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const played = useRef(false);
  const n = raceLengths[race]!;
  const won = winners(n);
  const end = Math.min(...wirings.map(w => finishTick(w.id, n)));
  const over = bet !== null && tick >= end;
  const last = race === raceLengths.length - 1;

  useEffect(() => {
    if (bet === null || tick >= end) return undefined;
    if (reduced()) { setTick(end); return undefined; }
    const timer = setTimeout(() => setTick(t => t + 1), Math.max(50, Math.round(1400 / end)));
    return () => clearTimeout(timer);
  }, [bet, tick, end]);

  const place = (id: Wiring) => {
    if (bet) return;
    if (!played.current) { played.current = true; markPlayed('drop-recurrence'); }
    setBet(id); setTick(0); if (won.includes(id)) setCorrect(c => c + 1);
  };
  const next = () => { if (last) { setDone(true); return; } setRace(r => r + 1); setBet(null); setTick(0); };
  const replay = () => { setRace(0); setBet(null); setTick(0); setCorrect(0); setDone(false); };
  const stars = raceStars(correct);
  const result: GameResult = {
    slug: 'drop-recurrence',
    headline: `I called ${correct} of ${raceLengths.length} races between recurrence, convolution and attention.`,
    detail: 'Attention takes one step but its reads grow with the square of the length; a widening convolution needs a few more steps of cheaper work. The chain always waits in line.',
    score: { value: correct, max: raceLengths.length, label: 'Bets won' },
    stars,
    shareText: `I called ${correct}/${raceLengths.length} races between an RNN, a convolution stack and attention. Which wiring gets word 1 to the last word first?`,
  };

  return <div class="race-game">
    <GoalBar goal="Bet on the wiring that gets word 1’s message to the last word first." status={done ? 'Finished' : `Race ${race + 1} / ${raceLengths.length} · ${n} words`} score={{ value: correct, max: raceLengths.length, label: 'Bets won' }} />
    {done ? <ResultCard result={result} onReplay={replay} /> : <>
      <p class="race-budget">{`${n} words. The chip does ${readsPerTick} reads per tick; a step that needs more reads takes more ticks.`}</p>
      <div class="race-lanes">
        {wirings.map(w => {
          const p = plan(w.id, n), finish = finishTick(w.id, n), reach = reachAt(w.id, n, bet ? tick : 0);
          const arrived = bet !== null && tick >= finish;
          return <section class={`race-lane ${over && won.includes(w.id) ? 'is-winner' : ''} ${bet === w.id ? 'is-bet' : ''}`} key={w.id} aria-label={w.name}>
            <h3>{w.name}{bet === w.id && <span class="race-badge">Your bet</span>}</h3>
            <p class="race-plan">{`Steps: ${p.steps} · reads per step: ${p.reads} · ticks per step: ${ticksPerStep(w.id, n)}`}</p>
            <div class="race-track" aria-hidden="true"><span class="race-fill" style={`--value:${(reach - 1) / (n - 1)}`} /></div>
            <p class="race-time">{over ? (arrived ? `Arrived at tick ${finish}` : `Word ${reach} of ${n} · would arrive at tick ${finish}`) : bet ? `Word ${reach} of ${n}` : w.rule}</p>
          </section>;
        })}
      </div>
      {bet === null
        ? <div class="game-choices race-bets" role="group" aria-label="Place your bet">{wirings.map(w => <button type="button" key={w.id} onClick={() => place(w.id)}>{w.name}</button>)}</div>
        : <p class="race-clock"><span class="game-timer" role="timer">{`tick ${tick}`}</span></p>}
      <p class="race-feedback" aria-live="polite">{over ? `${won.map(nameOf).join(' + ')} ${won.length > 1 ? 'tie' : 'wins'} at tick ${end}. ${won.includes(bet!) ? 'Bet won.' : 'Bet lost.'}` : ''}</p>
      {over && <div class="race-actions"><button type="button" class="game-btn is-primary" onClick={next}>{last ? 'See my score' : 'Next race'}</button></div>}
      <p class="toy-note">Toy accounting: one tick is one round of up to {readsPerTick} reads. It shows how path length and total work trade off, not measured speeds.</p>
    </>}
  </div>;
}
