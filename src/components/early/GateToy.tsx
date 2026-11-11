import '../../i18n/preact';
import '../../styles/games/lstm.css';
import {useEffect,useRef,useState} from 'preact/hooks';
import GoalBar from '../game/GoalBar';
import ResultCard,{type GameResult} from '../game/ResultCard';
import {markPlayed} from '../../lib/progress';
import {READ_WINDOW_MS,expectedCode,makeStream,vaultLevels,vaultStars,vaultStep,type Beat,type Gates} from './vault-game';
const slug='lstm',levels=vaultLevels.length;
type Phase='ready'|'running'|'bell'|'result'|'finished';
type Logged={beat:Beat;gates:Gates;before:number;after:number};
const clock=(ms:number)=>`0:${String(Math.max(0,Math.ceil(ms/1000))).padStart(2,'0')}`;
export default function GateToy(){
 const [level,setLevel]=useState(0);
 const [phase,setPhase]=useState<Phase>('ready');
 const [stream,setStream]=useState<Beat[]>([]);
 const [beat,setBeat]=useState(0);
 const [cell,setCell]=useState(0);
 const [gates,setGates]=useState<Gates>({keep:true,write:false});
 const [log,setLog]=useState<Logged[]>([]);
 const [outcomes,setOutcomes]=useState<{ok:boolean;read:number|null;code:number}[]>([]);
 const [now,setNow]=useState(0);
 const gatesRef=useRef(gates),cellRef=useRef(0),startedAt=useRef(0),played=useRef(false),root=useRef<HTMLDivElement>(null),mainButton=useRef<HTMLButtonElement>(null),readButton=useRef<HTMLButtonElement>(null);
 gatesRef.current=gates;cellRef.current=cell;
 const spec=vaultLevels[Math.min(level,levels-1)]!;
 const focusMain=()=>requestAnimationFrame(()=>mainButton.current?.focus());
 const start=()=>{
  if(!played.current){played.current=true;markPlayed(slug);}
  setStream(makeStream(spec.pattern));setBeat(0);setCell(0);setGates({keep:true,write:false});setLog([]);
  startedAt.current=Date.now();setNow(Date.now());setPhase('running');
 };
 const finishLevel=(read:number|null)=>{const code=expectedCode(stream);setOutcomes(o=>[...o,{ok:read===code,read,code}]);setPhase('result');focusMain();};
 // Each beat commits the gates as they stand when the beat ends.
 useEffect(()=>{
  if(phase!=='running')return;
  const timer=setTimeout(()=>{
   const b=stream[beat]!,before=cellRef.current,after=vaultStep(before,b,gatesRef.current);
   setCell(after);setLog(l=>[...l,{beat:b,gates:{...gatesRef.current},before,after}]);
   startedAt.current=Date.now();
   if(beat+1>=stream.length){setPhase('bell');requestAnimationFrame(()=>readButton.current?.focus());}else setBeat(beat+1);
  },spec.beatMs);
  return ()=>clearTimeout(timer);
 },[phase,beat,stream]);
 useEffect(()=>{
  if(phase!=='bell')return;
  const timer=setTimeout(()=>finishLevel(null),READ_WINDOW_MS);return ()=>clearTimeout(timer);
 },[phase]);
 useEffect(()=>{
  if(phase!=='running'&&phase!=='bell')return;
  const tick=setInterval(()=>setNow(Date.now()),100);return ()=>clearInterval(tick);
 },[phase]);
 const toggle=(name:keyof Gates)=>{if(phase==='running')setGates(g=>({...g,[name]:!g[name]}));};
 const read=()=>{if(phase==='bell')finishLevel(cellRef.current);};
 const keys=useRef({toggle,read});keys.current={toggle,read};
 useEffect(()=>{
  const onKey=(e:KeyboardEvent)=>{
   if(e.metaKey||e.ctrlKey||e.altKey)return;
   const target=e.target as HTMLElement|null;if(target?.closest('input,textarea,select,[contenteditable]'))return;
   const active=document.activeElement;if(active&&active!==document.body&&!root.current?.contains(active))return;
   const k=e.key.toLowerCase();
   if(k==='k'){e.preventDefault();keys.current.toggle('keep');}
   else if(k==='w'){e.preventDefault();keys.current.toggle('write');}
   else if(k==='r'){e.preventDefault();keys.current.read();}
  };
  window.addEventListener('keydown',onKey);return ()=>window.removeEventListener('keydown',onKey);
 },[]);
 const nextLevel=()=>{if(level+1>=levels)setPhase('finished');else{setLevel(level+1);setPhase('ready');}focusMain();};
 const replay=()=>{setLevel(0);setOutcomes([]);setPhase('ready');setLog([]);setCell(0);focusMain();};
 const opened=outcomes.filter(o=>o.ok).length;
 const result:GameResult={slug,headline:opened===3?'Opened all 3 vaults.':`Opened ${opened} of 3 vaults.`,detail:'Keep held the code, Write let it in, and Read gave it back at the bell. An LSTM learns to work these gates itself.',score:{value:opened,max:3,label:'Vaults'},stars:vaultStars(opened),shareText:`I worked an LSTM's memory gates by hand and opened ${opened} of 3 vaults.`};
 const current=stream[beat],last=log.at(-1),outcome=outcomes[level];
 const left=phase==='running'?(stream.length-beat)*spec.beatMs-(now-startedAt.current):phase==='bell'?READ_WINDOW_MS-(now-startedAt.current):0;
 const distractors=spec.pattern.split('').filter(c=>c==='.').length,replaces=spec.pattern.includes('N');
 const status=phase==='finished'?'All 3 vaults tried.':`Vault ${level+1} / 3 · ${opened} opened`;
 return <div class="vault-game" ref={root}>
  <GoalBar goal="Hold the code in memory until the bell, then read it out. Three vaults, more noise each time." status={status}/>
  {phase==='finished'?<ResultCard result={result} onReplay={replay}/>:<>
   <p class="vault-brief">{replaces?`Vault ${level+1}: ${distractors} distractors, and the code changes once. The new code replaces the old one.`:`Vault ${level+1}: ${distractors} distractors.`}</p>
   <div class="vault-board">
    <div class={`vault-incoming${current&&phase==='running'?` is-${current.kind}`:''}`} key={`${level}-${beat}-${phase}`}>
     <span>{phase==='running'?(current?.kind==='code'?'Code':current?.kind==='new-code'?'New code':'Noise'):phase==='bell'?'Bell!':'Incoming'}</span>
     <strong dir="ltr">{phase==='running'?current?.value:phase==='bell'?'!':'–'}</strong>
    </div>
    <div class="vault-cell">
     <span>Stored in memory</span>
     <strong dir="ltr">{phase==='ready'?'–':cell}</strong>
     {last&&phase!=='ready'&&<span class="vault-math" dir="ltr">{`${last.gates.keep?1:0} × ${last.before} + ${last.gates.write?1:0} × ${last.beat.value} = ${last.after}`}</span>}
    </div>
    {(phase==='running'||phase==='bell')&&<span class={`game-timer${left<1500?' is-low':''}`} role="timer" aria-label={phase==='bell'?'Time left to read':'Time to the bell'}>{clock(left)}</span>}
   </div>
   <div class="vault-gates" role="group" aria-label="Gates">
    <button type="button" class="vault-gate" aria-pressed={gates.keep} disabled={phase!=='running'} onClick={()=>toggle('keep')} aria-keyshortcuts="K"><b>Keep</b><span>{gates.keep?'On: hold memory':'Off: forget'}</span></button>
    <button type="button" class="vault-gate" aria-pressed={gates.write} disabled={phase!=='running'} onClick={()=>toggle('write')} aria-keyshortcuts="W"><b>Write</b><span>{gates.write?'On: add incoming':'Off: ignore incoming'}</span></button>
    <button type="button" ref={readButton} class="vault-gate is-read" disabled={phase!=='bell'} onClick={read} aria-keyshortcuts="R"><b>Read</b><span>Open at the bell</span></button>
   </div>
   <p class="vault-keys">Keys: K keep, W write, R read</p>
   <p class="vault-verdict" role="status">{phase==='bell'?'Bell! Read it out.':phase==='result'&&outcome?(outcome.ok?`Vault opened: you read ${outcome.code}.`:outcome.read===null?`Too slow. The code was ${outcome.code}.`:`Wrong: you read ${outcome.read}, the code was ${outcome.code}.`):''}</p>
   {phase==='ready'&&<button type="button" ref={mainButton} class="game-btn is-primary" onClick={start}>{`Start vault ${level+1}`}</button>}
   {phase==='result'&&<button type="button" ref={mainButton} class="game-btn is-primary" onClick={nextLevel}>{level+1<levels?'Next vault':'See the score'}</button>}
   {log.length>0&&<ol class="vault-log" dir="ltr" aria-hidden="true">{log.map((l,i)=><li key={i} class={`is-${l.beat.kind}`}><b>{l.beat.value}</b><span>{l.gates.keep?'K':'·'}{l.gates.write?'W':'·'}</span></li>)}</ol>}
  </>}
  <p class="toy-note">You are the gates here; a real LSTM learns when to open them and squashes what it reads with tanh.</p>
 </div>;
}
