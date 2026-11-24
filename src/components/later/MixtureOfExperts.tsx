import '../../i18n/preact';
import '../../styles/games/mixture-of-experts.css';
import {useEffect,useRef,useState} from 'preact/hooks';
import GoalBar from '../game/GoalBar';
import ResultCard,{type GameResult} from '../game/ResultCard';
import {ownsGameKey,useGameActive} from '../game/useGameActive';
import {starsFor,usePlayed} from './played';

export const DURATION=30,ARRIVE=.7,SLOTS=2,WORK=3.2,QUEUE=3;
export const experts=[
 {name:'A',kind:'Numbers',words:['7','42','1991','3.14','100']},
 {name:'B',kind:'Places',words:['Paris','Lagos','Lima','Oslo','Kyoto']},
 {name:'C',kind:'Verbs',words:['run','sing','build','read','swim']}
];
export type Token={id:number;kind:number;word:string;at:number};
export type Sim={t:number;stream:Token[];next:number;queue:Token[];slots:number[][];points:number;processed:number;matched:number;dropped:number};
// A seeded stream: half numbers, then places, then verbs, so the numbers expert is always the crowded one.
export function makeStream(seed:number):Token[]{
 let s=seed>>>0;const rand=()=>(s=(Math.imul(s,1664525)+1013904223)>>>0)/2**32;
 const out:Token[]=[];
 for(let i=0,at=.4;at<DURATION;i++,at=Math.round((at+ARRIVE)*100)/100){const r=rand(),kind=r<.5?0:r<.8?1:2;out.push({id:i,kind,word:experts[kind]!.words[Math.floor(rand()*5)]!,at});}
 return out;
}
export const newSim=(seed:number):Sim=>({t:0,stream:makeStream(seed),next:0,queue:[],slots:[[],[],[]],points:0,processed:0,matched:0,dropped:0});
// Move the clock: tokens arrive (the oldest waiting token overflows when the queue is full) and finished slots free up.
export function advance(sim:Sim,time:number):Sim{
 const s={...sim,t:Math.min(time,DURATION),queue:[...sim.queue]};
 while(s.next<s.stream.length&&s.stream[s.next]!.at<=s.t){if(s.queue.length>=QUEUE){s.queue.shift();s.dropped++;}s.queue.push(s.stream[s.next]!);s.next++;}
 s.slots=sim.slots.map(list=>list.filter(until=>until>s.t));
 return s;
}
export const hasRoom=(sim:Sim,expert:number)=>(sim.slots[expert]?.length??SLOTS)<SLOTS;
// Send the front token to one expert. A full expert drops it; its specialist earns 3 points, any other expert 2.
export function route(sim:Sim,expert:number):Sim{
 const token=sim.queue[0];if(!token)return sim;
 const s={...sim,queue:sim.queue.slice(1),slots:sim.slots.map(l=>[...l])};
 if(!hasRoom(sim,expert)){s.dropped++;return s;}
 s.slots[expert]!.push(s.t+WORK);s.processed++;
 if(token.kind===expert){s.matched++;s.points+=3;}else s.points+=2;
 return s;
}
// The comparison: routes every token the instant it arrives, to its specialist when there is room, else to the emptiest expert.
export function learnedRouter(seed:number):Sim{
 let sim=newSim(seed);
 for(const token of sim.stream){
  sim=advance(sim,token.at);
  const open=[0,1,2].filter(e=>hasRoom(sim,e)).sort((a,b)=>sim.slots[a]!.length-sim.slots[b]!.length);
  sim=route(sim,hasRoom(sim,token.kind)?token.kind:open[0]??token.kind);
 }
 return advance(sim,DURATION);
}
export const moeStars=(mine:number,router:number)=>starsFor(router?mine/router:0,[.5,.75,.92]);
// Layouts that type another script (Arabic ٢) report the physical digit in e.code. Latin layouts keep e.key.
const digitKey=(e:KeyboardEvent)=>/^[^\x00-\x7f]+$/u.test(e.key)?/^(?:Digit|Numpad)(\d)$/.exec(e.code)?.[1]??e.key:e.key;

export default function MixtureOfExperts(){
 const touch=usePlayed('mixture-of-experts');
 const [seed,setSeed]=useState(()=>Date.now());const [sim,setSim]=useState(()=>newSim(seed));
 const [running,setRunning]=useState(false);const [result,setResult]=useState<GameResult|null>(null);
 const [flash,setFlash]=useState('');
 const clock=useRef({elapsed:0,last:0}),root=useRef<HTMLDivElement>(null),active=useGameActive(root);
 useEffect(()=>{
  if(!running||!active)return undefined;
  clock.current.last=performance.now();
  const timer=setInterval(()=>{
   const now=performance.now();clock.current.elapsed+=Math.min(.25,(now-clock.current.last)/1000);clock.current.last=now;
   setSim(s=>advance(s,clock.current.elapsed));
  },100);
  // Charge the part of a tick played before a pause, so pausing never adds time.
  return ()=>{clearInterval(timer);clock.current.elapsed+=Math.min(.25,(performance.now()-clock.current.last)/1000);};
 },[running,active]);
 useEffect(()=>{
  if(!running||sim.t<DURATION)return;
  setRunning(false);
  const router=learnedRouter(seed),stars=moeStars(sim.points,router.points),share=router.points?Math.round(sim.points/router.points*100):0;
  setResult({slug:'mixture-of-experts',stars,score:{value:sim.points,label:'Points'},
   headline:sim.points>=router.points?`I out-routed the learned router: ${sim.points} points to ${router.points}.`:`I scored ${sim.points} points routing tokens. The learned router scored ${router.points}.`,
   detail:`You processed ${sim.processed} tokens, sent ${sim.matched} to their specialist and dropped ${sim.dropped}. The router processed ${router.processed} and dropped ${router.dropped}.`,
   shareText:`I played router for a mixture-of-experts model: ${sim.processed} tokens in 30 seconds, ${share}% of a learned router’s score.`});
 },[sim.t,running]);
 const send=(expert:number)=>{
  if(!running||!sim.queue[0])return;
  const full=!hasRoom(sim,expert);setFlash(full?`Expert ${experts[expert]!.name} was full. Token dropped.`:'');
  setSim(s=>route(s,expert));
 };
 useEffect(()=>{
  if(!running)return undefined;
  const key=(e:KeyboardEvent)=>{if(e.target instanceof HTMLInputElement||e.metaKey||e.ctrlKey||e.altKey||!ownsGameKey(root.current,e))return;const i=['1','2','3'].indexOf(digitKey(e));if(i>=0){e.preventDefault();send(i);}};
  window.addEventListener('keydown',key);return ()=>window.removeEventListener('keydown',key);
 });
 const start=()=>{touch();clock.current.elapsed=0;setFlash('');setSim(newSim(seed));setRunning(true);};
 const replay=()=>{const next=Date.now();setSeed(next);setSim(newSim(next));setResult(null);setFlash('');};
 const left=Math.ceil(DURATION-sim.t),front=sim.queue[0];
 return <div class="later-game moe-game" ref={root}>
  <GoalBar goal="Route tokens to experts for 30 seconds. A token scores 3 points at its specialist, 2 anywhere else, 0 if dropped." status={running?`${sim.processed} processed · ${sim.dropped} dropped`:result?'Done':'Ready'} score={{value:sim.points,label:'Points'}}/>
  {result?<ResultCard result={result} onReplay={replay}/>:<>
   <div class="moe-top">
    <span class={`game-timer${running&&left<=5?' is-low':''}`} role="timer" aria-label={`${left} seconds left`}>{`0:${String(left).padStart(2,'0')}`}</span>
    {!running&&<button type="button" class="game-btn is-primary" onClick={start}>Start routing</button>}
    <span class="moe-rule">{`Each expert has ${SLOTS} slots. A token takes ${WORK} seconds.`}</span>
   </div>
   <div class="moe-queue" role="group" aria-label="Waiting tokens">
    {Array.from({length:QUEUE},(_,i)=>{const token=sim.queue[i];return <span class={`moe-token${i===0&&token?' is-front':''}${token?` kind-${token.kind}`:' is-empty'}`}>{token?<><b dir="ltr" lang="en">{token.word}</b><small>{experts[token.kind]!.kind}</small></>:<small>{running?'…':''}</small>}</span>;})}
   </div>
   <p class="moe-flash" aria-live="polite">{flash||(running?(front?`Next: ${front.word}`:'Waiting for a token'):'Press start. Then tap an expert, or press 1, 2 or 3.')}</p>
   <div class="moe-experts" role="group" aria-label="Experts">{experts.map((ex,i)=>{const busy=sim.slots[i]!;
    return <button type="button" class={`moe-expert kind-${i}${hasRoom(sim,i)?'':' is-full'}`} disabled={!running} onClick={()=>send(i)} aria-label={`Expert ${ex.name}, ${ex.kind}, ${SLOTS-busy.length} of ${SLOTS} slots free`}>
     <span class="moe-key" aria-hidden="true">{i+1}</span>
     <strong>{`Expert ${ex.name}`}</strong><small>{ex.kind}</small>
     <span class="moe-slots" aria-hidden="true">{Array.from({length:SLOTS},(_,k)=>{const until=[...busy].sort((a,b)=>a-b)[k];return <i style={until===undefined?undefined:`--left:${Math.max(0,(until-sim.t)/WORK)}`} class={until===undefined?'':'is-busy'}/>;})}</span>
    </button>;})}</div>
  </>}
  <p class="toy-note">A toy with invented timings; the “learned router” is a rule that acts like a trained, load-balanced one. In Switch, a dropped token skips the expert through a residual connection.</p>
 </div>;
}
