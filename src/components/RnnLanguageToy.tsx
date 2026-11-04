import { useState } from 'preact/hooks';

type State = [number, number];
export type Topic = 'river' | 'loan';
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
export const windowSize = 3;
export function historyWords(topic: Topic, long: boolean) {
  return [topic, 'we', 'walked', ...(long ? ['slowly', 'past', 'shops', 'and', 'then', 'on'] : []), 'to', 'the', 'bank'];
}
export function readWord(previous: State, word: string): State {
  const cue = word === 'river' ? 2 : word === 'loan' ? -2 : 0;
  return [sigmoid(1.6 * (2 * previous[0] - 1) + cue), sigmoid(1.6 * (2 * previous[1] - 1) - cue)];
}
export function predictHistory(words: string[], count: number, fixedWindow = false) {
  const read = words.slice(0, Math.max(0, Math.min(words.length, Math.floor(count))));
  const visible = fixedWindow ? read.slice(-windowSize) : read;
  const state = visible.reduce<State>(readWord, [.5, .5]);
  // Two-word softmax: scores are +3d for water and -3d for money.
  const water = sigmoid(6 * (state[0] - state[1]));
  return { state, water, money: 1 - water, visible };
}

export default function RnnLanguageToy() {
  const [count, setCount] = useState(6);
  const [long, setLong] = useState(false);
  const words = historyWords('river', long);
  const short = predictHistory(words, count, true);
  const river = predictHistory(words, count);
  const loan = predictHistory(historyWords('loan', long), count);
  const read = Math.min(count, words.length);
  const lost = read > windowSize;
  return <div class="early-toy rnn-toy">
    <div class="toy-topline"><span class="eyebrow">Same ending. Different past.</span><span class="toy-label">Toy · hand-set weights</span></div>
    <div class="rnn-verdict" role="status" aria-live="polite">
      <strong data-testid="rnn-conclusion">{read === 0 ? 'Neither reader has a clue yet.' : lost ? 'The window forgot. The state still differs.' : 'Both readers still have the clue.'}</strong>
      <p>After the river history: next-word chance of <b>water</b></p>
      <div class="rnn-comparison">
        <div><span>Last {windowSize} words only</span><output data-testid="window-chance">{(short.water * 100).toFixed(1)}%</output></div>
        <div><span>Running state</span><output data-testid="running-chance">{(river.water * 100).toFixed(1)}%</output></div>
      </div>
    </div>
    <label class="early-label" for="rnn-position">Words read <output>{read} / {words.length}</output></label>
    <input id="rnn-position" type="range" min="0" max={words.length} step="1" value={read} onInput={e => setCount(Number(e.currentTarget.value))}/>
    <div class="early-buttons rnn-actions">
      <button class="early-primary" disabled={read === words.length} onClick={() => setCount(n => Math.min(n + 1, words.length))}>Read next word</button>
      <button disabled={read === words.length} onClick={() => setCount(words.length)}>Read to the end</button>
    </div>
    <label class="early-toggle"><input type="checkbox" checked={long} onChange={e => { const next = e.currentTarget.checked; setLong(next); setCount(historyWords('river', next).length); }}/>Add six words before “to the bank”</label>
    <div class="rnn-histories" aria-label="Two histories and their next-word predictions">
      {(['river', 'loan'] as const).map(topic => {
        const row = historyWords(topic, long);
        const prediction = topic === 'river' ? river : loan;
        return <section class="rnn-history" aria-label={`${topic} history`} key={topic}>
          <p class="rnn-word-strip">{row.map((word, i) => <span key={i} class={`${i >= read ? 'rnn-unread' : i < read - windowSize ? 'rnn-outside' : 'rnn-in-window'} ${i === read - 1 ? 'rnn-current' : ''}`}>{word}</span>)}<b aria-hidden="true">→ ?</b></p>
          <div class="rnn-distribution"><span>water <output>{(prediction.water * 100).toFixed(1)}%</output></span><span>money <output>{(prediction.money * 100).toFixed(1)}%</output></span></div>
          <div class="rnn-probability" role="img" aria-label={`Running state: water ${(prediction.water * 100).toFixed(1)} percent, money ${(prediction.money * 100).toFixed(1)} percent`}><span style={{width:`${prediction.water * 100}%`}}/></div>
        </section>;
      })}
    </div>
    <p class="early-small">Highlighted words fit inside the three-word window. Faded words are outside it. Both histories use the same weights. Extra words weaken the running clue; no weights are trained here.</p>
    <div class="early-buttons"><button onClick={() => { setCount(0); setLong(false); }}>Reset reader</button></div>
    <details class="rnn-inside"><summary>Inside this toy</summary><p>Two sigmoid state units start at [0.5, 0.5]. Each updates as s′ = sigmoid(1.6 × (2s − 1) + cue). River supplies cues [2, −2], loan supplies [−2, 2], and other words supply [0, 0]. If d = s₁ − s₂, the scores for water and money are 3d and −3d; softmax turns them into probabilities.</p><p>River state: [{river.state.map(n => n.toFixed(3)).join(', ')}]. Loan state: [{loan.state.map(n => n.toFixed(3)).join(', ')}]. The fixed-window comparison restarts the same toy predictor from [0.5, 0.5] on only the last three read words. It is not a separately trained model. These are invented word streams and numbers, not measurements from the paper.</p></details>
  </div>;
}
