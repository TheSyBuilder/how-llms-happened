import '../../i18n/preact';
import {useState} from 'preact/hooks';
export type Message = 'fox' | 'cat';
export type Summary = [number,number,number];
export const messages:Record<Message,string[]> = {fox:['red','fox','runs'],cat:['blue','cat','sleeps']};
export function encodeMessage(words:string[], count:number, eraseColour=false):Summary {
  const state:Summary = [0,0,0];
  for(const word of words.slice(0,Math.max(0,count))) {
    if(word==='red'||word==='blue') state[0]=eraseColour?0:word==='red'?1:2;
    if(word==='fox'||word==='cat') state[1]=word==='fox'?1:2;
    if(word==='runs'||word==='sleeps') state[2]=word==='runs'?1:2;
  }
  return state;
}
export function decodeSummary(summary:Summary):string[] {
  return ['le', summary[1]===1?'renard':summary[1]===2?'chat':'?', summary[0]===1?'rouge':summary[0]===2?'bleu':'?', summary[2]===1?'court':summary[2]===2?'dort':'?', 'END'];
}
export default function EncoderToy() {
  const [message,setMessage]=useState<Message>('fox');
  const [step,setStep]=useState(0);
  const [erase,setErase]=useState(false);
  const source=messages[message];
  const summary=encodeMessage(source,Math.min(step,3),erase);
  const output=step>3?decodeSummary(summary).slice(0,step-3):[];
  const phase=step<3?'Read the source':step===3?'The message is packed':step<8?'Write from the summary':'The decoder chose END';
  return <div class="early-toy encoder-toy">
    <div class="toy-topline"><span class="eyebrow">Read it. Pack it. Say it.</span><span class="toy-label">Toy · hand-written rules</span></div>
    <div class="early-buttons" aria-label="Source message">{(['fox','cat'] as const).map(key=><button aria-pressed={message===key} onClick={()=>{setMessage(key);setStep(0);}} key={key}>{messages[key].join(' ')}</button>)}</div>
    <div class="sequence-output" role="status"><span>{phase}</span><strong data-testid="decoded-message">{output.filter(word=>word!=='END').join(' ') || '…'}</strong>{step===8&&<b class="sequence-end">END</b>}</div>
    <label class="early-toggle"><input type="checkbox" checked={erase} onChange={e=>setErase(e.currentTarget.checked)}/>Erase colour from the summary</label>
    <label class="early-label" for="encoder-step">Read and write <output>{step} / 8 steps</output></label>
    <input id="encoder-step" type="range" min="0" max="8" step="1" value={step} onInput={e=>setStep(Number(e.currentTarget.value))}/>
    <div class="early-buttons"><button class="early-primary" disabled={step===8} onClick={()=>setStep(n=>Math.min(8,n+1))}>Next step</button><button onClick={()=>{setStep(0);setErase(false);}}>Reset message</button></div>
    <div class="encoder-source" aria-label="Source words">{source.map((word,i)=><span key={word} class={step>i?'has-read':''}>{word}</span>)}</div>
    <div class="summary-vector" aria-label="Summary vector">{summary.map((value,i)=><div key={i}><span>{['colour','animal','action'][i]}</span><output>{value}</output></div>)}</div>
    <p class="early-small">The decoder receives only these three numbers. Three English words become four French words, then END. Erasing colour gives “?” because the decoder cannot reread the source.</p>
    <details class="sequence-inside"><summary>Inside this toy</summary><p>The encoder stores red/blue, fox/cat and runs/sleeps as 1/2 in named slots; 0 means missing. The decoder reads animal before colour and adds “le”. These rules illustrate the handoff, order change and stopping, not neural translation. Real models learn dense representations without named slots or a fixed word quota.</p></details>
  </div>;
}
