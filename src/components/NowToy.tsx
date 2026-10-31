import { useState } from 'preact/hooks';

export const deliveryNotes = [
  'Deliver to Pine Studio.',
  'Arrive within 7 minutes.',
  'Start at Harbor. Pick a route.',
] as const;
export const deliveryRoutes = [
  { id: 'gate', label: 'Harbor → Gate → Studio', minutes: 4, destination: 'studio', points: '55,140 235,50 415,140' },
  { id: 'museum', label: 'Harbor → Market → Museum', minutes: 5, destination: 'museum', points: '55,140 235,140 415,235' },
  { id: 'market', label: 'Harbor → Market → Studio', minutes: 6, destination: 'studio', points: '55,140 235,140 415,140' },
  { id: 'dock', label: 'Harbor → Dock → Studio', minutes: 8, destination: 'studio', points: '55,140 235,235 415,140' },
];
type Setup = { notes: number; budget: number; lookup: boolean; closed: boolean };

// A tiny route planner with explicit information boundaries. No language model.
export function planDelivery({ notes, budget, lookup, closed }: Setup) {
  const received = deliveryNotes.slice(-notes);
  const hasAddress = received.includes(deliveryNotes[0]);
  const checks: { route: typeof deliveryRoutes[number]; reason: string; accepted: boolean }[] = [];
  if (!hasAddress) return { received, checks, chosen: undefined, state: 'missing', title: 'Address missing.', detail: 'The address was not sent. Extra attempts cannot recover it.' };
  for (const route of deliveryRoutes.slice(0, budget)) {
    const reason = lookup && closed && route.id === 'gate' ? 'Gate is closed'
      : route.destination !== 'studio' ? 'Wrong destination'
      : route.minutes > 7 ? 'Too late' : 'Fits the known information';
    checks.push({ route, reason, accepted: reason === 'Fits the known information' });
    if (checks.at(-1)!.accepted) break;
  }
  const chosen = checks.find(check => check.accepted)?.route;
  if (!chosen) return { received, checks, chosen, state: 'budget', title: 'No route found yet.', detail: 'The checked routes failed. Another candidate may work.' };
  if (chosen.id === 'gate' && closed) return { received, checks, chosen, state: 'blocked', title: 'Old map. Closed gate.', detail: 'This route fits the old map but fails on the ground. Fetch the gate status.' };
  return { received, checks, chosen, state: 'delivered', title: `Delivered in ${chosen.minutes} minutes.`, detail: lookup ? 'The address, current gate status and enough attempts came together.' : 'The old map happened to be right. Close the gate to see what changes.' };
}

export default function NowToy() {
  const [notes, setNotes] = useState(2);
  const [budget, setBudget] = useState(1);
  const [lookup, setLookup] = useState(false);
  const [closed, setClosed] = useState(true);
  const plan = planDelivery({ notes, budget, lookup, closed });
  const reset = () => { setNotes(2); setBudget(1); setLookup(false); setClosed(true); };
  const revealControl = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement) || !target.matches('input, button, summary')) return;
    requestAnimationFrame(() => {
      const status = target.closest('.now-toy')!.querySelector('.now-result')!;
      const control = target.closest('label') ?? target;
      const overlap = status.getBoundingClientRect().bottom + 20 - control.getBoundingClientRect().top;
      if (overlap > 0) window.scrollBy({ top: -overlap, behavior: 'instant' });
    });
  };
  return <div class="toy now-toy" onFocusCapture={e => revealControl(e.target)} onInputCapture={e => revealControl(e.target)}>
    <div class="toy-topline"><span class="toy-label">Toy · A tiny delivery planner</span><span>Rules, not a language model</span></div>
    <div class="now-result" data-state={plan.state} role="status" aria-live="polite" aria-atomic="true"><span>{plan.state === 'delivered' ? 'Parcel arrived' : 'What happened?'}</span><output data-testid="delivery-answer">{plan.title}</output><p>{plan.detail}</p></div>
    <div class="now-controls">
      <label class="now-range">Notes to send <output>{notes} / 3</output><input type="range" min="1" max="3" value={notes} aria-label="Notes to send" aria-valuetext={`${notes} of 3 notes; ${notes === 3 ? 'address included' : 'address missing'}`} onInput={e => setNotes(+e.currentTarget.value)} /></label>
      <label class="now-range">Routes to try <output>{budget} / 4</output><input type="range" min="1" max="4" value={budget} aria-label="Routes to try" onInput={e => setBudget(+e.currentTarget.value)} /></label>
    </div>
    <ol class="now-notes" aria-label="Notes reaching the planner">{deliveryNotes.map((note, i) => <li class={i >= 3 - notes ? 'note-received' : 'note-missing'}><span>{i >= 3 - notes ? 'Sent' : 'Not sent'}</span>{note}</li>)}</ol>
    <div class="now-toggles">
      <label><input type="checkbox" checked={closed} onChange={e => setClosed(e.currentTarget.checked)} /><span>Close the gate<small>Change the world</small></span></label>
      <label><input type="checkbox" checked={lookup} onChange={e => setLookup(e.currentTarget.checked)} /><span>Fetch gate status<small>Give the planner a tool</small></span></label>
    </div>
    <div class="now-observation" data-testid="gate-observation">{lookup ? `Tool returns: gate ${closed ? 'closed' : 'open'}.` : 'No lookup. The planner’s old map says “gate open”.'}</div>
    <figure class="now-map">
      <svg viewBox="0 0 470 280" role="img" aria-label={`Delivery map. Gate is ${closed ? 'closed' : 'open'} on the ground. ${plan.chosen ? `Chosen route: ${plan.chosen.label}.` : 'No route chosen.'}`}>
        <g class="now-roads"><path d="M55 140L235 50L415 140M55 140H415M235 140L415 235M55 140L235 235L415 140" /></g>
        {plan.chosen && <polyline class="now-chosen-road" points={plan.chosen.points} />}
        {[[55,140,'Harbor'],[235,50,'Gate'],[235,140,'Market'],[235,235,'Dock'],[415,140,'Studio'],[415,235,'Museum']].map(([x,y,label]) => <g><circle cx={x} cy={y} r="10" class={label === 'Gate' && closed ? 'now-gate-closed' : ''} /><text x={x} y={Number(y) + (label === 'Gate' ? -22 : 33)} text-anchor="middle">{label}</text></g>)}
        {closed && <path class="now-barrier" d="M226 41L244 59M226 59L244 41" />}
        {plan.chosen && <circle class="now-parcel" r="6" cx={plan.state === 'blocked' ? 235 : 415} cy={plan.state === 'blocked' ? 50 : 140} />}
      </svg>
      <figcaption>You see the whole world. The planner receives only the sent notes and tool result.</figcaption>
    </figure>
    <details class="toy-method now-attempts"><summary>Inside this attempt <span>{plan.checks.length} route checks</span></summary><p>Notes: {notes} · Lookups: {lookup ? 1 : 0} · Checks: {plan.checks.length}</p>{plan.checks.length > 0 ? <ol>{plan.checks.map(check => <li><span>{check.route.label} · {check.route.minutes} min</span><strong>{check.reason}</strong></li>)}</ol> : <p>No route is checked without an address.</p>}</details>
    <button class="another-continuation" onClick={reset}>Reset delivery</button>
    <details class="toy-method"><summary>About this toy</summary><p class="toy-footnote">Four fixed routes, checked in the order listed inside each attempt. Stop at the first route that fits the received information. The map is built into the planner; the address comes from the notes. The tool reads one local boolean. No network calls, learned reasoning, real deliveries or performance measurements.</p></details>
  </div>;
}
