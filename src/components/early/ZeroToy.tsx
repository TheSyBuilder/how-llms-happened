import { useState } from 'preact/hooks';
export const drinks = ['tea','coffee','cocoa','juice','water'];
export function reserveOdds(reserve: number, broad: boolean) { return [.6 * (1-reserve), .3 * (1-reserve), .1 * (1-reserve), reserve * (broad ? .2 : .5), reserve * (broad ? .8 : .5)]; }
export default function ZeroToy() {
  const [reserve, setReserve] = useState(0);
  const [broad, setBroad] = useState(false);
  const [word, setWord] = useState(3);
  const odds = reserveOdds(reserve / 100, broad);
  const p = odds[word]!;
  return <div class="early-toy">
    <div class="toy-topline"><span class="eyebrow">The unseen shelf</span><span class="toy-label">Toy · invented drink counts</span></div>
    <p class="early-small">After “please bring”: 6 teas, 3 coffees, 1 cocoa. No juice or water yet.</p>
    <div class="early-result" role="status"><strong>{p ? `${drinks[word]} gets ${(p*100).toFixed(1)}%` : `${drinks[word]} is ruled out.`}</strong><p>{p ? `Surprise: ${(-Math.log2(p)).toFixed(2)} bits. A possible next word.` : 'One zero makes the entire sequence probability zero.'}</p></div>
    <label class="early-label" for="reserve-mass">Reserve for unseen words <output>{reserve}%</output></label><input id="reserve-mass" type="range" min="0" max="50" step="5" value={reserve} onInput={e => setReserve(Number(e.currentTarget.value))} />
    <div class="probability-shelf">{drinks.map((drink,i) => <button aria-pressed={word===i} onClick={() => setWord(i)}><span class="cup" style={{'--fill':`${odds[i]!*100}%`}}><span /></span><b>{drink}</b><output>{(odds[i]!*100).toFixed(1)}%</output></button>)}</div>
    <label class="early-toggle"><input type="checkbox" checked={broad} onChange={e => setBroad(e.currentTarget.checked)} /> Favour the broader traveller</label>
    <p class="early-small">In an invented wider collection, water follows 4 different words; juice follows 1. Switch on to split the unseen reserve 4:1 instead of equally.</p>
    <div class="early-buttons"><button onClick={() => {setReserve(0);setBroad(false);setWord(3);}}>Reset shelf</button></div>
    <p class="early-small">The total stays 100%. This is a probability-budget illustration, not a full Good–Turing or Kneser–Ney estimator.</p>
  </div>;
}
