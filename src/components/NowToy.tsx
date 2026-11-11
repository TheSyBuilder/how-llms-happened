import '../i18n/preact';
import '../styles/games/now.css';
import { useEffect, useRef, useState } from 'preact/hooks';
import GoalBar from './game/GoalBar';
import ResultCard, { type GameResult } from './game/ResultCard';
import { markPlayed } from '../lib/progress';

export const deliveryNotes = [
  'Deliver to Pine Studio.',
  'Arrive within 7 minutes.',
  'Start at Harbor. Pick a route.',
] as const;
export type Stop = 'gate' | 'market' | 'dock';
export const deliveryRoutes = [
  { id: 'gate', via: 'gate', label: 'Harbor → Gate → Studio', minutes: 4, destination: 'studio', points: '55,140 235,50 415,140' },
  { id: 'museum', via: 'market', label: 'Harbor → Market → Museum', minutes: 5, destination: 'museum', points: '55,140 235,140 415,235' },
  { id: 'market', via: 'market', label: 'Harbor → Market → Studio', minutes: 6, destination: 'studio', points: '55,140 235,140 415,140' },
  { id: 'dock', via: 'dock', label: 'Harbor → Dock → Studio', minutes: 8, destination: 'studio', points: '55,140 235,235 415,140' },
] as const;
export const stopNames: Record<Stop, string> = { gate: 'Gate', market: 'Market', dock: 'Dock' };
// Every world keeps a route open within 7 minutes; half of them close the Gate.
export const worlds: Stop[][] = [['gate'], ['gate', 'dock'], ['market'], ['dock']];
export const COST = { note: 1, lookup: 2, attempt: 1 } as const;
export const WALLET = 24;
type Setup = { notes: number; budget: number; lookup: boolean; closed: readonly Stop[] };

// A tiny route planner with explicit information boundaries. No language model.
export function planDelivery({ notes, budget, lookup, closed }: Setup) {
  const received = deliveryNotes.slice(-notes);
  const hasAddress = received.includes(deliveryNotes[0]);
  const checks: { route: typeof deliveryRoutes[number]; reason: string; accepted: boolean }[] = [];
  if (!hasAddress) return { received, checks, chosen: undefined, state: 'missing', title: 'Address missing.', detail: 'The address was not sent. Extra attempts cannot recover it.' };
  for (const route of deliveryRoutes.slice(0, budget)) {
    const reason = lookup && closed.includes(route.via) ? `${stopNames[route.via]} is closed`
      : route.destination !== 'studio' ? 'Wrong destination'
      : route.minutes > 7 ? 'Too late' : 'Fits the known information';
    checks.push({ route, reason, accepted: reason === 'Fits the known information' });
    if (checks.at(-1)!.accepted) break;
  }
  const chosen = checks.find(check => check.accepted)?.route;
  if (!chosen) return { received, checks, chosen, state: 'budget', title: 'No route found yet.', detail: 'The checked routes failed. Another candidate may work.' };
  if (closed.includes(chosen.via)) return { received, checks, chosen, state: 'blocked', title: `Old map. Closed ${stopNames[chosen.via]}.`, detail: 'This route fits the old map but fails on the ground. Fetch the road status.' };
  return { received, checks, chosen, state: 'delivered', title: `Delivered in ${chosen.minutes} minutes.`, detail: lookup ? 'The address, current road status and enough attempts came together.' : 'The old map happened to be right this time.' };
}

export const runCost = ({ notes, budget, lookup }: Omit<Setup, 'closed'>) => notes * COST.note + budget * COST.attempt + (lookup ? COST.lookup : 0);
// The cheapest single run that delivers in this world.
export function cheapestRun(closed: readonly Stop[]) {
  let best = Infinity;
  for (const notes of [1, 2, 3]) for (const budget of [1, 2, 3, 4]) for (const lookup of [false, true])
    if (planDelivery({ notes, budget, lookup, closed }).state === 'delivered') best = Math.min(best, runCost({ notes, budget, lookup }));
  return best;
}
export const nowStars = (spent: number, cheapest: number, delivered: boolean): 0 | 1 | 2 | 3 => !delivered ? 0 : spent <= cheapest ? 3 : spent <= cheapest + 4 ? 2 : 1;
export const pickWorld = (random = Math.random) => worlds[Math.floor(random() * worlds.length) % worlds.length]!;

export function nowResult(spent: number, cheapest: number, delivered: boolean, runs: number): GameResult {
  const stars = nowStars(spent, cheapest, delivered);
  return {
    slug: 'now',
    headline: !delivered ? 'Out of credits. The parcel never arrived.' : spent <= cheapest ? `Delivered for ${spent} credits, the cheapest possible.` : `Delivered for ${spent} credits.`,
    detail: !delivered ? `You spent all ${WALLET} credits.` : runs === 1 ? `The cheapest run in this town cost ${cheapest}. You needed 1 run.` : `The cheapest run in this town cost ${cheapest}. You needed ${runs} runs.`,
    score: { value: spent, label: 'Credits spent' },
    stars,
    shareText: delivered ? `I got the parcel to Pine Studio for ${spent} credits and ${stars}/3 stars by giving the planner the right notes, tools and effort.` : 'I ran out of credits before the parcel arrived. Planning with the right notes, tools and effort is harder than it looks.',
  };
}

const places: [number, number, string, Stop | null][] = [[55, 140, 'Harbor', null], [235, 50, 'Gate', 'gate'], [235, 140, 'Market', 'market'], [235, 235, 'Dock', 'dock'], [415, 140, 'Studio', null], [415, 235, 'Museum', null]];

export default function NowToy() {
  const [closed, setClosed] = useState<Stop[]>(worlds[0]!);
  const [notes, setNotes] = useState(2);
  const [budget, setBudget] = useState(1);
  const [lookup, setLookup] = useState(false);
  const [spent, setSpent] = useState(0);
  const [runs, setRuns] = useState(0);
  const [last, setLast] = useState<ReturnType<typeof planDelivery> | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const played = useRef(false);
  // Randomise after hydration so the server and the first client render agree.
  useEffect(() => { setClosed(pickWorld()); }, []);
  const touch = () => { if (!played.current) { played.current = true; markPlayed('now'); } };
  const cost = runCost({ notes, budget, lookup });
  const left = WALLET - spent;
  const send = () => {
    touch();
    const plan = planDelivery({ notes, budget, lookup, closed });
    const total = spent + cost;
    setSpent(total); setRuns(runs + 1); setLast(plan);
    if (plan.state === 'delivered') setResult(nowResult(total, cheapestRun(closed), true, runs + 1));
    // No run that could still deliver fits in the wallet: the game is over.
    else if (WALLET - total < cheapestRun(closed)) setResult(nowResult(total, cheapestRun(closed), false, runs + 1));
  };
  const restart = () => { setClosed(pickWorld()); setNotes(2); setBudget(1); setLookup(false); setSpent(0); setRuns(0); setLast(null); setResult(null); };
  const blockedAt = last?.state === 'blocked' && last.chosen ? places.find(p => p[3] === last.chosen!.via) : undefined;
  const closedNames = closed.map(stop => stopNames[stop]).join(', ');
  return <div class="toy now-toy now-game">
    <GoalBar goal="Get the parcel to Pine Studio for as few credits as possible. The planner sees only what you send it." status={`Runs: ${runs} · Credits left: ${left} / ${WALLET}`} score={{ value: spent, label: 'Spent' }} />
    {result ? <ResultCard result={result} onReplay={restart} /> : <>
      <div class="now-result" data-state={last?.state ?? 'ready'} role="status" aria-live="polite" aria-atomic="true">
        <span>{last ? (last.state === 'delivered' ? 'Parcel arrived' : `Run ${runs} failed`) : 'Ready when you are'}</span>
        <output data-testid="delivery-answer">{last ? last.title : `This run costs ${cost} credits.`}</output>
        <p>{last ? last.detail : 'Set up the planner, then send it.'}</p>
      </div>
      <div class="now-controls">
        <label class="now-range">Notes to send <output>{notes} / 3</output><input type="range" min="1" max="3" value={notes} aria-valuetext={`${notes} of 3 notes; ${notes === 3 ? 'address included' : 'address missing'}`} onInput={e => { touch(); setNotes(+e.currentTarget.value); }} /><small>1 credit each</small></label>
        <label class="now-range">Routes to try <output>{budget} / 4</output><input type="range" min="1" max="4" value={budget} onInput={e => { touch(); setBudget(+e.currentTarget.value); }} /><small>1 credit each</small></label>
      </div>
      <ol class="now-notes" aria-label="Notes reaching the planner">{deliveryNotes.map((note, i) => <li class={i >= 3 - notes ? 'note-received' : 'note-missing'}><span>{i >= 3 - notes ? 'Sent' : 'Not sent'}</span>{note}</li>)}</ol>
      <label class="now-tool"><input type="checkbox" checked={lookup} onChange={e => { touch(); setLookup(e.currentTarget.checked); }} /><span>Fetch road status<small>Give the planner a tool · 2 credits</small></span></label>
      <div class="now-observation" data-testid="gate-observation">{lookup ? `Tool returns: closed today: ${closedNames}.` : 'No lookup. The planner’s old map says every road is open.'}</div>
      <figure class="now-map">
        <svg viewBox="0 0 470 280" role="img" aria-label={`Delivery map. Closed today: ${closedNames}. ${last?.chosen ? `Last route: ${last.chosen.label}.` : 'No route sent yet.'}`}>
          <g class="now-roads"><path d="M55 140L235 50L415 140M55 140H415M235 140L415 235M55 140L235 235L415 140" /></g>
          {last?.chosen && <polyline class="now-chosen-road" points={last.chosen.points} />}
          {places.map(([x, y, label, stop]) => <g><circle cx={x} cy={y} r="10" class={stop && closed.includes(stop) ? 'now-gate-closed' : ''} /><text x={x} y={y + (label === 'Gate' ? -22 : 33)} text-anchor="middle">{label}</text></g>)}
          {places.filter(p => p[3] && closed.includes(p[3])).map(([x, y]) => <path class="now-barrier" d={`M${x - 9} ${y - 9}L${x + 9} ${y + 9}M${x - 9} ${y + 9}L${x + 9} ${y - 9}`} />)}
          {last?.chosen && <circle class="now-parcel" r="6" cx={blockedAt ? blockedAt[0] : 415} cy={blockedAt ? blockedAt[1] : 140} />}
        </svg>
        <figcaption>You see today’s closed roads. The planner sees only the sent notes and the tool result.</figcaption>
      </figure>
      <div class="now-send">
        <button type="button" class="game-btn is-primary" disabled={cost > left} onClick={send}>{`Send the planner · ${cost} credits`}</button>
        <button type="button" class="game-btn" onClick={restart}>New town</button>
      </div>
      {last && <details class="toy-method now-attempts"><summary>Inside the last run <span>{last.checks.length === 1 ? '1 route check' : `${last.checks.length} route checks`}</span></summary>{last.checks.length > 0 ? <ol>{last.checks.map(check => <li><span>{check.route.label} · {check.route.minutes} min</span><strong>{check.reason}</strong></li>)}</ol> : <p>No route is checked without an address.</p>}</details>}
    </>}
    <p class="toy-note">A rule-based planner with invented credits, not a language model or a real price list.</p>
  </div>;
}
