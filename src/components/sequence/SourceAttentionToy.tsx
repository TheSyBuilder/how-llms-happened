import {useState} from 'preact/hooks';
export const sourceWords = ['the','red','fox'];
export const targetSteps = [{label:'Article',word:'le',source:0},{label:'Animal',word:'renard',source:2},{label:'Colour',word:'rouge',source:1}];
export function sourceRead(target:number, focus:number, hideRed=false) {
  const desired=targetSteps[target]!.source;
  const scores=sourceWords.map((_,i)=>i===desired?Math.max(0,Math.min(4,focus)):0);
  const weights=scores.map((score,i)=>hideRed&&i===1?0:Math.exp(score));
  const sum=weights.reduce((a,b)=>a+b,0);
  const alpha=weights.map(w=>w/sum);
  // Source vectors are the three basis vectors: their weighted sum equals alpha.
  const context=[...alpha];
  const highest=Math.max(...alpha);
  const tied=alpha.filter(n=>Math.abs(n-highest)<1e-9).length>1;
  return {scores,alpha,context,strongest:tied?null:alpha.indexOf(highest)};
}
export default function SourceAttentionToy() {
  const [target,setTarget]=useState(1),[focus,setFocus]=useState(3),[hideRed,setHideRed]=useState(false);
  const read=sourceRead(target,focus,hideRed);
  return <div class="early-toy source-attention-toy">
    <div class="toy-topline"><span class="eyebrow">A fresh read for each word</span><span class="toy-label">Toy · hand-set scores</span></div>
    <div class="attention-steps" aria-label="Decoder needs">{targetSteps.map((step,i)=><button aria-pressed={target===i} onClick={()=>setTarget(i)} key={step.word}><span>{step.label}</span><strong>{step.word}</strong></button>)}</div>
    <div class="sequence-output" role="status"><span>For “{targetSteps[target]!.word}”</span><strong data-testid="source-read-result">{read.strongest===null?'No clear preference':`Strongest read: ${sourceWords[read.strongest]}`}</strong></div>
    <label class="early-label" for="source-focus">Focus strength <output>{focus.toFixed(1)}</output></label>
    <input id="source-focus" type="range" min="0" max="4" step=".1" value={focus} onInput={e=>setFocus(Number(e.currentTarget.value))}/>
    <label class="early-toggle"><input type="checkbox" checked={hideRed} onChange={e=>setHideRed(e.currentTarget.checked)}/>Hide “red” from the read</label>
    <svg class="source-read-diagram" viewBox="0 0 480 220" role="img" aria-label="Source states mixed into one context vector">
      {sourceWords.map((word,i)=><g key={word}><path d={`M${80+i*160} 70 Q${80+i*160} 130 240 170`} fill="none" stroke="var(--deep)" stroke-width={1+read.alpha[i]!*15} opacity={read.alpha[i] === 0?0:.25+read.alpha[i]!* .75}/><rect x={20+i*160} y="10" width="120" height="60" rx="5" fill={hideRed&&i===1?'var(--line)':'var(--accent)'}/><text x={80+i*160} y="36" text-anchor="middle">{word}</text><text x={80+i*160} y="58" text-anchor="middle" class="read-percent">{(read.alpha[i]!*100).toFixed(1)}%</text></g>)}
      <rect x="110" y="170" width="260" height="45" rx="5" fill="var(--ink)"/><text x="240" y="199" text-anchor="middle" fill="var(--paper)">Weighted context</text>
    </svg>
    <div class="summary-vector" aria-label="Weighted context vector">{read.context.map((value,i)=><div key={i}><span>{['article','colour','animal'][i]}</span><output>{value.toFixed(2)}</output></div>)}</div>
    <p class="early-small">The percentages share one read; they are not probabilities of French words. Different requests mix the same three source states differently. Hiding a source removes its contribution.</p>
    <div class="early-buttons"><button onClick={()=>{setTarget(1);setFocus(3);setHideRed(false);}}>Reset attention</button></div>
    <details class="sequence-inside"><summary>Inside this toy</summary><p>Each request gives its matching source a score equal to the focus slider and all others 0. Softmax turns scores into weights; hiding red excludes it before normalization. Source values are [1,0,0], [0,1,0], [0,0,1]. Their weighted sum is shown above. Real source vectors and scores are learned; this toy does not translate.</p></details>
  </div>;
}
