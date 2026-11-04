import '../../i18n/preact';
import { useState } from 'preact/hooks';
export function letterOdds(text: string, last: string, remember: boolean) {
  const letters = text.toUpperCase().replace(/[^AB]/g, '');
  const counts = [0, 0];
  for (let i = 0; i < letters.length; i++) if (!remember || (i > 0 && letters[i - 1] === last)) counts[letters[i] === 'A' ? 0 : 1]!++;
  const total = counts[0]! + counts[1]!;
  return { counts, total, probabilities: counts.map(n => total ? n / total : 0) };
}
export default function LetterToy() {
  const [text, setText] = useState('ABABABAB');
  const [remember, setRemember] = useState(true);
  const [tape, setTape] = useState('A');
  const odds = letterOdds(text, tape.at(-1)!, remember);
  const reset = () => { setText('ABABABAB'); setRemember(true); setTape('A'); };
  return <div class="early-toy letter-machine">
    <div class="toy-topline"><span class="eyebrow">The two-letter press</span><span class="toy-label">Toy · A and B only</span></div>
    <label class="early-label" for="letter-text">Training strip</label><input id="letter-text" maxLength={48} value={text} onInput={e => { setText(e.currentTarget.value); setTape('A'); }} aria-describedby="letter-filter" />
    <p id="letter-filter" class="early-small">Only A and B are counted. Each edit starts a fresh tape.</p>
    <div class="early-buttons"><button onClick={() => { setText('ABABABAB'); setTape('A'); }}>Alternating</button><button onClick={() => { setText('AAAABBBB'); setTape('A'); }}>In clusters</button></div>
    <label class="early-toggle"><input type="checkbox" checked={remember} onChange={e => setRemember(e.currentTarget.checked)} /> Remember the last letter</label>
    <div class="letter-tape-output" aria-label="Printed letters">{Array.from(tape).map((letter,i) => <span key={i} class={i === tape.length - 1 ? 'fresh-letter' : ''}>{letter}</span>)}</div>
    <div class="early-result" role="status"><strong>{odds.total ? `Next draw ${remember ? `after ${tape.at(-1)}` : 'from all letters'}` : 'No observations for this choice.'}</strong><p>{odds.total ? `A: ${Math.round(odds.probabilities[0]! * 100)}% · B: ${Math.round(odds.probabilities[1]! * 100)}%` : 'Change the training strip or switch off memory.'}</p></div>
    <div class="letter-odds-bars">{['A','B'].map((label,i) => <div><b>{label}</b><div class="early-bar"><span style={{width:`${odds.probabilities[i]! * 100}%`}} /></div><span>{odds.counts[i]} counts</span></div>)}</div>
    <div class="early-buttons"><button class="early-primary" disabled={!odds.total || tape.length >= 24} onClick={() => setTape(tape + (Math.random() < odds.probabilities[0]! ? 'A' : 'B'))}>Print next letter</button><button onClick={reset}>Reset press</button></div>
    <p class="early-small">Each click draws from the displayed chances. The tape stops at 24 letters. These invented strips are not Markov’s text or Shannon’s samples.</p>
  </div>;
}
