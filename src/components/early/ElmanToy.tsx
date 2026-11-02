import { useState } from 'preact/hooks';
export const readerTail=['bank','near','the','old','bridge'];
export function readHistory(sign: number, count: number, copy: boolean) {
  let state=0; const trace=[0];
  for(let i=0;i<count;i++){state=Math.tanh((copy ? .85*state : 0)+(i===0 ? sign : 0));trace.push(state);}
  return {state,trace,water:1/(1+Math.exp(-4*state))};
}
export default function ElmanToy() {
  const [count,setCount]=useState(1); const [copy,setCopy]=useState(true);
  const left=readHistory(1,count,copy),right=readHistory(-1,count,copy);
  return <div class="early-toy">
    <div class="toy-topline"><span class="eyebrow">Two histories. One reader.</span><span class="toy-label">Toy · fixed weights</span></div>
    <div class="early-result" role="status"><strong>{count===0 ? 'Nothing read yet.' : count===1 ? 'Different first words.' : `Both readers just saw “${readerTail[count-2]}”.`}</strong><p>{Math.abs(left.state-right.state)<.001 ? 'Their states match.' : 'Their states still carry different histories.'}</p></div>
    <label class="early-label" for="words-read">Words read <output>{count} / 6</output></label><input id="words-read" type="range" min="0" max="6" step="1" value={count} onInput={e=>setCount(Number(e.currentTarget.value))}/>
    <label class="early-toggle"><input type="checkbox" checked={copy} onChange={e=>setCopy(e.currentTarget.checked)}/> Copy the previous hidden state</label>
    <div class="reader-lanes">{[{name:'river',sign:1,result:left},{name:'money',sign:-1,result:right}].map(lane=><div class="reader-lane"><div class="reader-words">{[lane.name,...readerTail].map((w,i)=><span class={i>=count ? 'unread-word' : i===count-1 ? 'current-word' : ''}>{w}</span>)}</div><svg viewBox="0 0 340 150" role="img" aria-label={`${lane.name} history, hidden state ${lane.result.state.toFixed(3)}`}><path d="M20 75H320" class="vector-ray"/><polyline points={lane.result.trace.map((s,i)=>`${20+i*50},${75-s*60}`).join(' ')} class="memory-trace"/>{lane.result.trace.map((s,i)=><circle cx={20+i*50} cy={75-s*60} r="5" class="vector-bank"/>)}</svg><p>Hidden state <strong>{lane.result.state.toFixed(3)}</strong></p><div class="early-bar"><span style={{width:`${lane.result.water*100}%`}}/></div><output>water {(lane.result.water*100).toFixed(1)}% · cash {((1-lane.result.water)*100).toFixed(1)}%</output></div>)}</div>
    <div class="early-buttons"><button class="early-primary" disabled={count===6} onClick={()=>setCount(count+1)}>Read one more word</button><button onClick={()=>{setCount(1);setCopy(true);}}>Reset reader</button></div>
    <p class="early-small">The clue words inject +1 or −1; all other words inject 0. A fixed recurrence and invented two-choice readout make memory visible. No training or genuine word understanding happens here.</p>
  </div>;
}
