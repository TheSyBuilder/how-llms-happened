import '../../i18n/preact';
import '../../styles/games/elman.css';
import {useEffect,useRef,useState} from 'preact/hooks';
import GoalBar from '../game/GoalBar';
import ResultCard,{type GameResult} from '../game/ResultCard';
import {markPlayed} from '../../lib/progress';
import {LEAN,MAX_BET,betPoints,clueLife,clueTrace,elmanRounds,elmanStars,fillers,lean} from './elman-game';
const slug='elman',total=elmanRounds.length;
const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
export default function ElmanToy(){
 const [round,setRound]=useState(0);
 const [bet,setBet]=useState(3);
 const [bets,setBets]=useState<number[]>([]);
 const [shown,setShown]=useState(0);
 const played=useRef(false),nextButton=useRef<HTMLButtonElement>(null),betButton=useRef<HTMLButtonElement>(null);
 const touch=()=>{if(!played.current){played.current=true;markPlayed(slug);}};
 const finished=round>=total,r=elmanRounds[Math.min(round,total-1)]!;
 // Always draw the same number of slots so the board never hints at the answer.
 const slots=MAX_BET+1,life=clueLife(r.weight),steps=Math.min(life+1,slots),trace=clueTrace(r.weight,slots);
 const locked=bets.length>round,running=locked&&shown<steps;
 useEffect(()=>{
  if(!running)return;
  if(reduced()){setShown(steps);return;}
  const timer=setTimeout(()=>setShown(s=>s+1),260);return ()=>clearTimeout(timer);
 },[running,shown,steps]);
 useEffect(()=>{if(locked&&!running)nextButton.current?.focus();},[locked,running]);
 const lock=()=>{touch();if(locked)return;setBets(b=>[...b,bet]);setShown(0);};
 const next=()=>{setRound(n=>n+1);setBet(3);setShown(0);requestAnimationFrame(()=>betButton.current?.focus());};
 const replay=()=>{setRound(0);setBets([]);setBet(3);setShown(0);requestAnimationFrame(()=>betButton.current?.focus());};
 const points=bets.map((b,i)=>betPoints(b,clueLife(elmanRounds[i]!.weight))),score=points.reduce((a,b)=>a+b,0);
 const lives=elmanRounds.map(x=>clueLife(x.weight));
 const result:GameResult={slug,headline:`I scored ${score} of 9 betting how long a clue lasts.`,detail:`The clue lasted ${lives.join(', ')} filler words. Copying back a little more of the state made it last much longer.`,score:{value:score,max:9,label:'Points'},stars:elmanStars(score),shareText:`I bet how long a clue survives inside a 1990 recurrent network and scored ${score}/9.`};
 const state=trace[locked?shown:0]!,leaning=lean(state);
 const done=locked&&!running,pts=done?points[round]!:0;
 const status=finished?'All 3 clues done.':`Clue ${round+1} / 3 · ${score} points`;
 return <div class="elman-game">
  <GoalBar goal="Bet how many filler words a clue survives in the reader's memory. Closest bets score." status={status}/>
  {finished?<ResultCard result={result} onReplay={replay}/>:<>
   <p class="elman-setup">{`The reader reads “${r.clue}”, then filler words. Each word, it copies back ${Math.round(r.weight*100)}% of its hidden state.`}</p>
   <ol class="elman-words" dir="ltr" lang="en" aria-hidden="true">
    <li class="is-clue"><span>{r.clue}</span><i style={`--value:${trace[0]}`}/></li>
    {Array.from({length:slots},(_,i)=>{const seen=locked&&i<shown,s=trace[i+1]!;return <li key={i} class={!seen?'is-unread':lean(s)>=LEAN?'is-kept':'is-lost'}><span>{seen?fillers[i]:'·'}</span><i style={`--value:${seen?s:0}`}/></li>;})}
   </ol>
   <div class={`game-meter${leaning>=LEAN?' is-good':' is-bad'}`}><span class="game-meter-label"><span>Still leans to “water”</span><b dir="ltr">{Math.round(leaning*100)}%</b></span><span class="game-meter-track"><span class="game-meter-fill" style={`--value:${(leaning-.5)*2}`}/></span></div>
   <p class="elman-line">It still remembers the clue while it leans 60% or more.</p>
   {!locked?<div class="elman-bet">
    <span class="elman-bet-label" id="elman-bet-label">Your bet: filler words it survives</span>
    <div class="elman-stepper" role="group" aria-labelledby="elman-bet-label">
     <button type="button" class="game-btn" aria-label="One fewer" disabled={bet<=0} onClick={()=>{touch();setBet(b=>Math.max(0,b-1));}}>−</button>
     <output dir="ltr" aria-live="off">{bet}</output>
     <button type="button" class="game-btn" aria-label="One more" disabled={bet>=MAX_BET} onClick={()=>{touch();setBet(b=>Math.min(MAX_BET,b+1));}}>+</button>
    </div>
    <button type="button" ref={betButton} class="game-btn is-primary" onClick={lock}>{`Lock in ${bet}`}</button>
   </div>:null}
   <p class="elman-verdict" role="status">{done?`It lasted ${life} filler words. You bet ${bets[round]}: ${pts} ${pts===1?'point':'points'}.`:''}</p>
   {done&&<button type="button" ref={nextButton} class="game-btn is-primary" onClick={next}>{round+1<total?'Next clue':'See the score'}</button>}
  </>}
  <p class="toy-note">One hidden number with a hand-picked copy weight; Elman’s network learned many weights from data.</p>
 </div>;
}
