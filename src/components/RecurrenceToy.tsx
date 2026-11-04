import '../i18n/preact';
import { useState } from 'preact/hooks';

type Route = 'recurrent' | 'local' | 'dilated' | 'attention';
export const signalRoutes: { id: Route; name: string; rule: string; arrival: number }[] = [
  { id: 'recurrent', name: 'One by one', rule: 'A running state passes to the next position.', arrival: 7 },
  { id: 'local', name: 'Local windows', rule: 'Each position reads itself and its two neighbours.', arrival: 7 },
  { id: 'dilated', name: 'Widening windows', rule: 'Spacing cycles through 1, 2, 4, 8, 16.', arrival: 3 },
  { id: 'attention', name: 'Direct attention', rule: 'Each position can read every input position.', arrival: 1 },
];

// Connectivity only: a lit node can receive the clue. No learned weights run here.
export function spreadSignal(route: Route, hops: number) {
  let reached = Array.from({ length: 8 }, (_, i) => i === 0);
  let before = [...reached];
  let edges: { from: number; to: number; carries: boolean }[] = [];
  for (let step = 1; step <= hops; step++) {
    before = [...reached];
    edges = [];
    if (route === 'recurrent') {
      edges.push({ from: step - 1, to: step, carries: before[step - 1]! });
      reached = before.map((value, i) => value || (i === step && before[step - 1]!));
    } else {
      const gap = route === 'dilated' ? 2 ** ((step - 1) % 5) : 1;
      reached = before.map((_, to) => {
        const inputs = route === 'attention' ? Array.from({ length: 8 }, (_, i) => i) : [to - gap, to, to + gap].filter(i => i >= 0 && i < 8);
        inputs.forEach(from => edges.push({ from, to, carries: before[from]! }));
        return inputs.some(from => before[from]);
      });
    }
  }
  return { reached, before, edges };
}

export default function RecurrenceToy() {
  const [route, setRoute] = useState<Route>('local');
  const [hops, setHops] = useState(1);
  const { reached, before, edges } = spreadSignal(route, hops);
  const current = signalRoutes.find(item => item.id === route)!;
  const arrived = reached[7];
  const x = (i: number) => 45 + i * 65;
  return <div class="recurrence-toy">
    <div class="toy-topline"><span class="eyebrow">Pass a clue</span><span class="toy-label">Toy · eight positions</span></div>
    <fieldset class="signal-routes"><legend>Choose the connections</legend><div>{signalRoutes.map(item => <button type="button" aria-pressed={route === item.id} onClick={() => setRoute(item.id)}>{item.name}</button>)}</div></fieldset>
    <div class="signal-result" role="status" aria-live="polite" data-arrived={arrived ? 'true' : 'false'}>
      <output data-testid="signal-answer">{arrived ? 'Word 8 has the clue.' : 'Word 8 is still out of reach.'}</output>
      <p><strong>{reached.filter(Boolean).length} / 8</strong> positions can receive the clue. This route first reaches word 8 after <strong>{current.arrival} {current.arrival === 1 ? 'hop' : 'hops'}</strong>.</p>
    </div>
    <div class="signal-slider"><label for="signal-hops">Dependent hops <output for="signal-hops">{hops}</output></label><input id="signal-hops" type="range" min="0" max="7" step="1" value={hops} onInput={event => setHops(Number(event.currentTarget.value))} /><div class="signal-actions"><button type="button" disabled={hops === 7} onClick={() => setHops(hops + 1)}>One more hop →</button><button type="button" onClick={() => { setRoute('local'); setHops(1); }}>Reset signal</button></div></div>
    <figure class="signal-network">
      <svg viewBox="0 0 545 255" role="img" aria-label={`${current.name}, ${hops} hops. The clue can reach positions ${reached.flatMap((yes, i) => yes ? [i + 1] : []).join(', ')}.`}>
        <text x="16" y="22" class="signal-svg-heading">{hops === 0 ? 'Start: a clue at word 1' : route === 'recurrent' ? 'One new state depends on the last' : 'All eight positions update together'}</text>
        {route === 'recurrent' ? <>
          {Array.from({ length: 7 }, (_, i) => <path d={`M${x(i) + 17} 115H${x(i + 1) - 17}`} class={i < hops ? 'signal-wire carries' : 'signal-wire'} />)}
          {reached.map((lit, i) => <g><circle cx={x(i)} cy="115" r="17" class={lit ? 'signal-node lit' : 'signal-node'} /><text x={x(i)} y="121" text-anchor="middle">{i + 1}</text></g>)}
          <text x="16" y="195">Running state →</text>
          <text x="16" y="222">Each new position waits for the previous one.</text>
        </> : <>
          <text x="16" y="51">{hops === 0 ? 'Input' : `Before hop ${hops}`}</text>
          {edges.map(edge => <path key={`${route}-${hops}-${edge.from}-${edge.to}`} d={`M${x(edge.from)} 92L${x(edge.to)} 164`} class={edge.carries ? 'signal-wire carries' : 'signal-wire'} />)}
          {before.map((lit, i) => <g><circle cx={x(i)} cy="78" r="15" class={lit ? 'signal-node lit' : 'signal-node'} /><text x={x(i)} y="84" text-anchor="middle">{i + 1}</text></g>)}
          {reached.map((lit, i) => <g><circle cx={x(i)} cy="180" r="15" class={lit ? 'signal-node lit' : 'signal-node'} /><text x={x(i)} y="186" text-anchor="middle">{i + 1}</text></g>)}
          <text x="16" y="225">{hops === 0 ? 'No mixing yet' : `After hop ${hops}`}{route === 'dilated' && hops > 0 ? ` · spacing ${2 ** ((hops - 1) % 5)}` : ''}</text>
        </>}
      </svg>
      <figcaption><span class="signal-key" aria-hidden="true" /> Green = a path from the clue. {current.rule}</figcaption>
    </figure>
    <p class="signal-footnote">One hop is one dependent update, not a unit of time. Colours show possible influence, not learned meaning. This illustrates reading known input; generating new words still takes successive predictions.</p>
  </div>;
}
