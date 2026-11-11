import '../../i18n/preact';
import '../../styles/games/open-models.css';
import {useState} from 'preact/hooks';
import GoalBar from '../game/GoalBar';
import ResultCard,{type GameResult} from '../game/ResultCard';
import {usePlayed} from './played';

// Parameter counts from each model card (or the card's safetensors total), in billions.
// For mixture-of-experts models, every expert is stored, so the total is what must fit.
export type OpenModel={name:string;params:number;active?:number};
export const openModels:OpenModel[]=[
 {name:'Gemma 3 1B',params:1.0},
 {name:'Llama 3.2 1B',params:1.24},
 {name:'Llama 3.2 3B',params:3.21},
 {name:'Qwen3 4B',params:4.0},
 {name:'Gemma 3 4B',params:4.3},
 {name:'Mistral 7B',params:7.24},
 {name:'Llama 3.1 8B',params:8.03},
 {name:'Qwen3 8B',params:8.2},
 {name:'Gemma 3 12B',params:12.2},
 {name:'Qwen3 14B',params:14.8},
 {name:'Gemma 3 27B',params:27.4},
 {name:'Qwen3 30B-A3B',params:30.5,active:3.3},
 {name:'Qwen3 32B',params:32.8},
 {name:'Mixtral 8×7B',params:46.7,active:12.9},
 {name:'Llama 3.3 70B',params:70.6},
 {name:'Qwen2.5 72B',params:72.7},
 {name:'Qwen3 235B-A22B',params:235,active:22},
 {name:'Llama 3.1 405B',params:405.9},
 {name:'DeepSeek-V3',params:671,active:37}
];
export const precisions=[4,8,16] as const;
export const presets=[8,16,24,36,64,128];
export const devices=['laptop','phone','desktop'] as const;
export const weightGB=(billions:number,bits:number)=>billions*bits/8;
// A quarter of memory, and never less than 2 GB, stays free for the OS, apps and the KV cache.
export const reserveGB=(memory:number)=>Math.max(2,memory*.25);
export const usableGB=(memory:number)=>Math.max(0,memory-reserveGB(memory));
export const fits=(model:OpenModel,bits:number,memory:number)=>weightGB(model.params,bits)<=usableGB(memory)+1e-9;
// The answer: the largest model that fits at any precision (4-bit is always the smallest).
export const biggestFit=(memory:number)=>[...openModels].reverse().find(m=>fits(m,4,memory));
export const bestPrecision=(model:OpenModel,memory:number)=>[...precisions].reverse().find(b=>fits(model,b,memory));
export const openStars=(tests:number)=>tests<=3?3:tests<=5?2:1;
const round1=(n:number)=>Math.round(n*10)/10;

type Test={model:OpenModel;bits:number;ok:boolean};
export default function OpenModels(){
 const touch=usePlayed('open-models');
 const [memory,setMemory]=useState<number|null>(null);const [custom,setCustom]=useState('');
 const [device,setDevice]=useState<typeof devices[number]>('laptop');
 const [bits,setBits]=useState<number>(16);const [tests,setTests]=useState<Test[]>([]);
 const [result,setResult]=useState<GameResult|null>(null);
 const pick=(gb:number)=>{touch();setMemory(gb);setTests([]);};
 const test=(model:OpenModel)=>{
  if(memory===null)return;touch();
  const ok=fits(model,bits,memory),all=[...tests,{model,bits,ok}];setTests(all);
  const target=biggestFit(memory);
  if(ok&&target&&model.name===target.name){
   const stars=openStars(all.length),top=bestPrecision(model,memory)!;
   setResult({slug:'open-models',stars,score:{value:all.length,label:'Tests'},
    headline:model.active?`My ${memory} GB ${device} can run ${model.name} (${model.params}B parameters, ${model.active}B active) at ${top}-bit.`:`My ${memory} GB ${device} can run ${model.name} (${model.params}B parameters) at ${top}-bit.`,
    detail:`Its weights take ${round1(weightGB(model.params,top))} GB of the ${round1(usableGB(memory))} GB left after the system’s share. Found in ${all.length} tests.`,
    shareText:`My ${memory} GB ${device} can run ${model.name}, a ${model.params}B-parameter open model, at ${top}-bit. Found it in ${all.length} tests.`});
  }
 };
 const replay=()=>{setMemory(null);setCustom('');setBits(16);setTests([]);setResult(null);};
 const last=tests[tests.length-1];
 const customValue=Math.round(+custom);
 return <div class="later-game om-game">
  <GoalBar goal="Find the biggest open model your device can hold, in as few tests as you can." status={memory===null?'Pick your memory':`${memory} GB · ${round1(usableGB(memory))} GB for weights`} score={{value:tests.length,label:'Tests'}}/>
  {result?<ResultCard result={result} onReplay={replay}/>:<>
   <fieldset class="om-step"><legend>1. How much memory does your device have?</legend>
    <div class="om-devices" role="group" aria-label="Device">{devices.map(d=><button type="button" class="game-btn" aria-pressed={device===d} onClick={()=>{touch();setDevice(d);}}>{d==='laptop'?'Laptop':d==='phone'?'Phone':'Desktop'}</button>)}</div>
    <div class="game-choices om-presets" role="group" aria-label="Memory">{presets.map(gb=><button type="button" aria-pressed={memory===gb} onClick={()=>pick(gb)}>{`${gb} GB`}</button>)}</div>
    <form class="om-custom" onSubmit={e=>{e.preventDefault();if(customValue>=4&&customValue<=2048)pick(customValue);}}>
     <label for="om-custom-gb">Other amount (GB)</label>
     <input id="om-custom-gb" type="number" inputMode="numeric" min={4} max={2048} value={custom} onInput={e=>setCustom(e.currentTarget.value)}/>
     <button type="submit" class="game-btn" disabled={!(customValue>=4&&customValue<=2048)}>Use it</button>
    </form>
   </fieldset>
   {memory!==null&&<>
    <fieldset class="om-step"><legend>2. Choose a precision</legend>
     <div class="om-bits" role="group" aria-label="Bits per weight">{precisions.map(b=><button type="button" class="game-btn" aria-pressed={bits===b} onClick={()=>{touch();setBits(b);}}>{`${b}-bit`}</button>)}</div>
    </fieldset>
    <fieldset class="om-step"><legend>3. Test a model</legend>
     <p class="om-last" aria-live="polite">{last?`${last.model.name} at ${last.bits}-bit: ${round1(weightGB(last.model.params,last.bits))} GB. ${last.ok?'It fits. Is there a bigger one?':'Too big.'}`:`Each test checks one model at ${bits}-bit. Weights take billions × bits ÷ 8 GB.`}</p>
     <ul class="om-models">{openModels.map(m=>{const tried=tests.filter(t=>t.model.name===m.name),seen=tried[tried.length-1];
      return <li><button type="button" class={seen?(seen.ok?'is-fit':'is-over'):''} onClick={()=>test(m)}>
       <span class="om-name" dir="ltr">{m.name}</span>
       <span class="om-size" dir="ltr">{m.active?`${m.params}B total · ${m.active}B active`:`${m.params}B`}</span>
       {seen&&<span class="om-flag">{seen.ok?`Fits: ${round1(weightGB(m.params,seen.bits))} GB at ${seen.bits}-bit`:`Too big: ${round1(weightGB(m.params,seen.bits))} GB at ${seen.bits}-bit`}</span>}
      </button></li>;})}</ul>
    </fieldset>
   </>}
  </>}
  <p class="toy-note">Weights only: billions of parameters × bits ÷ 8 = GB, with a quarter of memory (at least 2 GB) kept for the system and the KV cache. Speed and quality are not modelled.</p>
 </div>;
}
