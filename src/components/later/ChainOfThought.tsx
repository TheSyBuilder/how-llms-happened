import '../../i18n/preact';
import '../../styles/games/chain-of-thought.css';
import {useEffect,useRef,useState} from 'preact/hooks';
import GoalBar from '../game/GoalBar';
import ResultCard,{type GameResult} from '../game/ResultCard';
import {usePlayed} from './played';

export const SECONDS=20;
export type Puzzle={q:string;steps:string[];bad:number;why:string};
// Each worked solution has exactly one wrong step; the steps after it follow correctly from the mistake.
export const puzzles:Puzzle[]=[
 {q:'Buy 3 notebooks at $4 each. Delivery is $3 for the whole order. What is the total?',steps:['3 notebooks × $4 = $12','Delivery: 3 × $3 = $9','Total: $12 + $9 = $21'],bad:1,why:'Delivery is $3 once, so the total is $15.'},
 {q:'A train leaves at 9:40 and the trip takes 1 hour 35 minutes. When does it arrive?',steps:['9:40 + 1 hour = 10:40','10:40 + 20 minutes = 11:00','11:00 + 15 minutes = 11:05','It arrives at 11:05.'],bad:2,why:'11:00 + 15 minutes is 11:15.'},
 {q:'Sam has 24 stickers, gives a third to Ana, then buys 5 more. How many does Sam have?',steps:['A third of 24 is 8.','24 − 8 = 16','16 + 5 = 22','Sam has 22 stickers.'],bad:2,why:'16 + 5 is 21.'},
 {q:'A recipe for 4 people uses 300 g of flour. How much flour for 6 people?',steps:['300 g ÷ 4 = 75 g per person','6 × 75 g = 400 g','Use 400 g of flour.'],bad:1,why:'6 × 75 g is 450 g.'},
 {q:'A $40 shirt is 25% off, then 10% tax is added to the sale price. What do you pay?',steps:['25% of $40 = $10','Sale price: $40 − $10 = $30','Tax: 10% of $40 = $4','Total: $30 + $4 = $34'],bad:2,why:'The tax is on the $30 sale price: $3, so the total is $33.'}
];
export const MAX_POINTS=puzzles.length*150;
// 50 for finding the step, plus 5 for every second left on the clock.
export const stepPoints=(correct:boolean,remaining:number)=>correct?50+Math.round(5*Math.min(SECONDS,Math.max(0,remaining))):0;
export const chainStars=(found:number,points:number):0|1|2|3=>found===puzzles.length&&points>=550?3:found>=4?2:found>=2?1:0;
const shuffled=()=>puzzles.map((_,i)=>i).sort(()=>Math.random()-.5);

export default function ChainOfThought(){
 const touch=usePlayed('chain-of-thought');
 const [order,setOrder]=useState(shuffled);const [index,setIndex]=useState(-1);
 const [picked,setPicked]=useState<number|null>(null);const [timedOut,setTimedOut]=useState(false);
 const [remaining,setRemaining]=useState(SECONDS);const [points,setPoints]=useState(0);const [found,setFound]=useState(0);
 const [result,setResult]=useState<GameResult|null>(null);const [gain,setGain]=useState(0);
 const clock=useRef({elapsed:0,last:0});
 const puzzle=index>=0?puzzles[order[index]!]!:null,answered=picked!==null||timedOut;
 useEffect(()=>{
  if(!puzzle||answered)return undefined;
  clock.current={elapsed:0,last:performance.now()};
  const timer=setInterval(()=>{
   const now=performance.now();clock.current.elapsed+=Math.min(.25,(now-clock.current.last)/1000);clock.current.last=now;
   const left=SECONDS-clock.current.elapsed;setRemaining(Math.max(0,left));if(left<=0)setTimedOut(true);
  },100);
  return ()=>clearInterval(timer);
 },[index,answered]);
 const start=()=>{touch();setIndex(0);setPicked(null);setTimedOut(false);setRemaining(SECONDS);};
 const pick=(i:number)=>{
  if(!puzzle||answered)return;touch();
  const left=SECONDS-clock.current.elapsed;setPicked(i);
  const won=stepPoints(i===puzzle.bad,left);setGain(won);if(won){setFound(f=>f+1);setPoints(p=>p+won);}
 };
 const next=()=>{
  if(index+1<puzzles.length){setIndex(index+1);setPicked(null);setTimedOut(false);setRemaining(SECONDS);return;}
  const stars=chainStars(found,points);
  setResult({slug:'chain-of-thought',stars,score:{value:points,max:MAX_POINTS,label:'Points'},
   headline:found===puzzles.length?`I caught all 5 wrong steps. ${points} points.`:`I caught ${found} of 5 wrong steps. ${points} points.`,
   detail:'Every solution looked fluent. One step in each was wrong, and every step after it followed the mistake faithfully.',
   shareText:`I spotted ${found} of 5 wrong steps in worked solutions, ${points} points. Showing the working only helps if someone checks it.`});
 };
 const replay=()=>{setOrder(shuffled());setIndex(-1);setPicked(null);setTimedOut(false);setRemaining(SECONDS);setPoints(0);setFound(0);setResult(null);};
 const left=Math.ceil(remaining);
 return <div class="later-game cot-game">
  <GoalBar goal="Five worked solutions. Each has one wrong step. Tap it before the clock runs out." status={result?'Done':index<0?'Ready':`Solution ${index+1} / ${puzzles.length}`} score={{value:points,max:MAX_POINTS,label:'Points'}}/>
  {result?<ResultCard result={result} onReplay={replay}/>:!puzzle?<div class="cot-start"><p>Fast and careful beats fast. Each solution gives you 20 seconds.</p><button type="button" class="game-btn is-primary" onClick={start}>Start</button></div>:<>
   <div class="cot-head"><span class={`game-timer${!answered&&left<=5?' is-low':''}`} role="timer" aria-label={`${left} seconds left`}>{`0:${String(left).padStart(2,'0')}`}</span><p class="cot-question">{puzzle.q}</p></div>
   <ol class="cot-steps" aria-label="Worked solution">{puzzle.steps.map((step,i)=>{
    const state=!answered?'':i===puzzle.bad?' is-bad':i===picked?' is-miss':'';
    return <li><button type="button" class={`cot-step${state}`} disabled={answered} aria-pressed={picked===i} onClick={()=>pick(i)}><span class="cot-num" aria-hidden="true">{i+1}</span><span dir="auto">{step}</span></button></li>;})}</ol>
   {answered&&<div class="cot-verdict" aria-live="polite">
    <p><strong>{picked===puzzle.bad?`Caught it. +${gain}`:timedOut?'Time’s up.':'Not that one.'}</strong> {`Step ${puzzle.bad+1} is wrong: ${puzzle.why}`}</p>
    <button type="button" class="game-btn is-primary" onClick={next}>{index+1<puzzles.length?'Next solution':'See my result'}</button>
   </div>}
  </>}
  <p class="toy-note">These solutions were written by hand with one planted error each; no language model wrote them.</p>
 </div>;
}
