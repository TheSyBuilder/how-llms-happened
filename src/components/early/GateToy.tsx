import '../../i18n/preact';
import { useState } from 'preact/hooks';
export function gatedCell(previous: number, candidate: number, forget: number, input: number, output: number) {const kept=forget*previous,written=input*candidate,cell=kept+written;return {kept,written,cell,visible:output*Math.tanh(cell)};}
export default function GateToy() {
  const [stored,setStored]=useState(1);const [candidate,setCandidate]=useState(-1);const [forget,setForget]=useState(.8);const [input,setInput]=useState(.5);const [output,setOutput]=useState(1);const [steps,setSteps]=useState(0);
  const next=gatedCell(stored,candidate,forget,input,output);
  const reset=()=>{setStored(1);setCandidate(-1);setForget(.8);setInput(.5);setOutput(1);setSteps(0);};
  return <div class="early-toy">
    <div class="toy-topline"><span class="eyebrow">The memory vault</span><span class="toy-label">Toy · manual gates</span></div>
    <div class="gate-preview" role="status"><div><span>Stored now</span><strong>{stored.toFixed(2)}</strong></div><span aria-hidden="true">→</span><div><span>After this step</span><strong>{next.cell.toFixed(2)}</strong></div><div class="gate-visible"><span>Visible output</span><strong>{next.visible.toFixed(2)}</strong></div></div>
    <div class="early-buttons"><button onClick={()=>{setForget(1);setInput(0);setOutput(1);}}>Protect</button><button onClick={()=>{setForget(0);setInput(1);setOutput(1);}}>Replace</button><button onClick={()=>{setForget(1);setInput(0);setOutput(0);}}>Hide</button></div>
    <fieldset class="gate-candidate"><legend>Incoming candidate</legend>{[-1,1].map(n=><button aria-pressed={candidate===n} onClick={()=>setCandidate(n)}>{n===1 ? '+1 · new cue' : '−1 · distraction'}</button>)}</fieldset>
    {[{name:'Keep old memory',id:'forget-gate',value:forget,set:setForget},{name:'Write the candidate',id:'input-gate',value:input,set:setInput},{name:'Expose the memory',id:'output-gate',value:output,set:setOutput}].map(g=><div class="gate-control"><label class="early-label" for={g.id}>{g.name}<output>{g.value.toFixed(2)}</output></label><input id={g.id} type="range" min="0" max="100" step="5" value={g.value*100} onInput={e=>g.set(Number(e.currentTarget.value)/100)}/></div>)}
    <div class="gate-equation"><span>{next.kept.toFixed(2)} kept</span><b>+</b><span>{next.written.toFixed(2)} written</span><b>=</b><strong>{next.cell.toFixed(2)} memory</strong></div>
    <div class="early-buttons"><button class="early-primary" disabled={steps===12} onClick={()=>{setStored(next.cell);setSteps(steps+1);}}>Apply this step</button><button onClick={reset}>Reset memory</button></div>
    <p class="early-small">{steps} / 12 steps applied. Sliders preview the next update; Apply commits it. Closing the output gate hides memory without erasing it. Real networks learn their gates; you control them here.</p>
  </div>;
}
