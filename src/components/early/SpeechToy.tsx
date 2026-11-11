import '../../i18n/preact';
import '../../styles/games/speech.css';
import {useEffect,useRef,useState} from 'preact/hooks';
import GoalBar from '../game/GoalBar';
import ResultCard,{type GameResult} from '../game/ResultCard';
import {markPlayed} from '../../lib/progress';
import {decodePhrase,decoderScore,speechRounds,speechStars} from './speech-game';
const slug='speech',total=speechRounds.length;
const pct=(n:number)=>`${Math.round(n*100)}%`;
export default function SpeechToy(){
 const [round,setRound]=useState(0);
 const [answers,setAnswers]=useState<(0|1)[]>([]);
 const [voice,setVoice]=useState(false);
 const played=useRef(false),nextButton=useRef<HTMLButtonElement>(null),hearButton=useRef<HTMLButtonElement>(null);
 useEffect(()=>{setVoice(typeof speechSynthesis!=='undefined'&&typeof SpeechSynthesisUtterance!=='undefined');return ()=>{try{speechSynthesis.cancel();}catch{}};},[]);
 const touch=()=>{if(!played.current){played.current=true;markPlayed(slug);}};
 const speak=(text:string)=>{
  touch();if(!voice)return;
  try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.9;speechSynthesis.speak(u);}catch{}
 };
 const finished=round>=total,current=speechRounds[Math.min(round,total-1)]!,answered=answers.length>round;
 const answer=(i:0|1)=>{if(answered)return;touch();setAnswers(a=>[...a,i]);requestAnimationFrame(()=>nextButton.current?.focus());};
 const next=()=>{const n=round+1;setRound(n);if(n<total){speak(speechRounds[n]!.sounds);requestAnimationFrame(()=>hearButton.current?.focus());}};
 const replay=()=>{setRound(0);setAnswers([]);requestAnimationFrame(()=>hearButton.current?.focus());};
 const mine=answers.filter((a,i)=>a===speechRounds[i]!.meant).length,withLm=decoderScore(true),soundOnly=decoderScore(false);
 const result:GameResult={slug,headline:mine>withLm?`You heard ${mine} of 5. The 1975-style decoder got ${withLm}.`:`You got ${mine} of 5. The 1975-style decoder got ${withLm}.`,detail:`Sound alone got ${soundOnly} of 5. The language model fixed most mix-ups, but it only sees two words, so it missed the goalie.`,score:{value:mine,max:5,label:'You'},stars:speechStars(mine),shareText:`"Wreck a nice beach": I got ${mine}/5, a 1975-style speech decoder got ${withLm}/5, and sound alone got ${soundOnly}/5.`};
 const done=answers.length;
 const lmSoFar=speechRounds.slice(0,done).filter(r=>decodePhrase(r,true).pick===r.meant).length;
 const status=finished?'All 5 rounds heard.':`Round ${Math.min(round+1,total)} / 5`;
 const sound=decodePhrase(current,false),lm=decodePhrase(current,true),picked=answers[round];
 return <div class="speech-game">
  <GoalBar goal="Hear 5 sound-alike phrases. Pick what was meant, and beat the decoder." status={status}/>
  {finished?<ResultCard result={result} onReplay={replay}/>:<>
   <p class="speech-context" lang="en" dir="ltr">{current.context}</p>
   <div class="speech-listen">
    {voice&&<button type="button" ref={hearButton} class="game-btn is-primary" onClick={()=>speak(current.sounds)}><span aria-hidden="true">▶</span> Hear it</button>}
    <p class="speech-sounds">Sounds like <q lang="en" dir="ltr">{current.sounds}</q></p>
   </div>
   <div class="game-choices" role="group" aria-label="What was meant?">
    {current.options.map((o,i)=><button type="button" key={o} lang="en" dir="ltr" disabled={answered} aria-pressed={picked===i} class={answered?(i===current.meant?'is-right':picked===i?'is-wrong':''):''} onClick={()=>answer(i as 0|1)}>{o}</button>)}
   </div>
   <p class="speech-verdict" role="status">{answered?(picked===current.meant?'You heard it right.':'Not quite.'):''}</p>
   {answered&&<div class="speech-reveal">
    <p class="speech-tally">{`You ${mine} · Decoder ${lmSoFar}`}</p>
    {[{name:'Sound only',d:sound,why:'Acoustic match alone.'},{name:'Sound × language model',d:lm,why:`The language model only sees “${current.cue}” before the gap.`}].map(row=><div class={`speech-decoder${row.d.pick===current.meant?' is-right':' is-wrong'}`} key={row.name}>
     <p class="speech-decoder-head"><b>{row.name}</b><span>{row.d.pick===current.meant?'Right':'Wrong'}</span></p>
     {current.options.map((o,i)=><div class={`game-meter${i===row.d.pick?' is-good':''}`} key={o}><span class="game-meter-label"><span lang="en" dir="ltr">{o}</span><b dir="ltr">{pct(row.d.share[i]!)}</b></span><span class="game-meter-track"><span class="game-meter-fill" style={`--value:${row.d.share[i]}`}/></span></div>)}
     <p class="speech-why">{row.why}</p>
    </div>)}
    <button type="button" ref={nextButton} class="game-btn is-primary" onClick={next}>{round+1<total?'Next phrase':'See the score'}</button>
   </div>}
  </>}
  <p class="toy-note">Invented sound and prior scores and your browser’s voice; no real recogniser is listening.</p>
 </div>;
}
