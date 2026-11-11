import '../../i18n/preact';
import '../../styles/games/next-letter.css';
import {useEffect,useRef,useState} from 'preact/hooks';
import GoalBar from '../game/GoalBar';
import ResultCard,{type GameResult} from '../game/ResultCard';
import {markPlayed} from '../../lib/progress';
import {ROUNDS,contexts,keyPress,letterStars,predictNext,tallyPairs,type Press} from './letter-game';
type Move={press:Press;guess:Press};
const slug='next-letter';
export default function LetterToy(){
 const [moves,setMoves]=useState<Move[]>([]);
 const root=useRef<HTMLDivElement>(null),firstKey=useRef<HTMLButtonElement>(null),played=useRef(false);
 const history=moves.map(m=>m.press),done=moves.length>=ROUNDS;
 const hits=moves.filter(m=>m.press===m.guess).length,pct=moves.length?Math.round(hits/moves.length*100):0;
 const press=(p:Press)=>{
  if(!played.current){played.current=true;markPlayed(slug);}
  // The guess is computed from earlier presses only, before this press is recorded.
  setMoves(list=>list.length>=ROUNDS?list:[...list,{press:p,guess:predictNext(list.map(m=>m.press)).guess}]);
 };
 useEffect(()=>{
  const onKey=(e:KeyboardEvent)=>{
   if(e.metaKey||e.ctrlKey||e.altKey)return;
   const target=e.target as HTMLElement|null;
   if(target?.closest('input,textarea,select,[contenteditable]'))return;
   const active=document.activeElement;
   if(active&&active!==document.body&&!root.current?.contains(active))return;
   const p=keyPress(e.key);if(!p||!root.current?.querySelector('.markov-keys'))return;
   e.preventDefault();press(p);
  };
  window.addEventListener('keydown',onKey);return ()=>window.removeEventListener('keydown',onKey);
 },[]);
 const replay=()=>{setMoves([]);requestAnimationFrame(()=>firstKey.current?.focus());};
 const last=moves.at(-1),tally=tallyPairs(history);
 const nextContext=history.length>=2?history.slice(-2).join(''):'';
 const result:GameResult={slug,headline:`It predicted you ${pct}% of the time.`,detail:`It counted what followed each pair of your presses and caught ${hits} of ${ROUNDS}.`,score:{value:hits,max:ROUNDS,label:'Caught'},stars:letterStars(hits/ROUNDS),shareText:`A 1913 idea predicted my "random" choices ${pct}% of the time.`};
 const status=last?`${last.press===last.guess?'Caught':'Escaped'} · ${hits} of ${moves.length} predicted`:'Press A or B to start.';
 return <div class="markov-game" ref={root}>
  <GoalBar goal="Press A or B 30 times. Keep its hit rate at 55% or lower." status={status}/>
  {done?<ResultCard result={result} onReplay={replay}/>:<>
   <div class="markov-stage">
    <div class={`markov-reveal${last?(last.press===last.guess?' is-caught':' is-escaped'):''}`} key={moves.length}>
     {last?<><span>{`You pressed ${last.press} · It guessed ${last.guess}`}</span><strong>{last.press===last.guess?'Caught':'Escaped'}</strong></>:<><span>Its guess is sealed before every press.</span><strong>Ready</strong></>}
    </div>
    <div class="markov-tally" aria-hidden="true"><span><b>{hits}</b> caught</span><span><b>{moves.length-hits}</b> escaped</span><span><b dir="ltr">{pct}%</b> predicted</span></div>
   </div>
   <div class="markov-keys" dir="ltr" role="group" aria-label="Your choice">
    <button type="button" ref={firstKey} class="markov-key" onClick={()=>press('A')} aria-keyshortcuts="A ArrowLeft">A</button>
    <button type="button" class="markov-key" onClick={()=>press('B')} aria-keyshortcuts="B ArrowRight">B</button>
   </div>
   <p class="markov-hint">Keys: A or ←, B or →</p>
  </>}
  <ol class="markov-tiles" dir="ltr" aria-label={`${moves.length} of ${ROUNDS} presses`}>
   {Array.from({length:ROUNDS},(_,i)=>{const m=moves[i];return <li key={i} class={m?(m.press===m.guess?'is-caught':'is-escaped'):''} aria-hidden="true">{m?.press??''}</li>;})}
  </ol>
  <div class="markov-counts">
   <p class="markov-counts-title">What it has counted</p>
   <ul dir="ltr">{contexts.map(c=><li key={c} class={c===nextContext&&!done?'is-next':''}><span>After {c}</span><span>A ×{tally[c]![0]}</span><span>B ×{tally[c]![1]}</span></li>)}</ul>
   {!done&&<p class="markov-next">{nextContext&&tally[nextContext]![0]!==tally[nextContext]![1]?`Its next guess is sealed, using what followed ${nextContext}.`:history.length?'A tie or no record yet, so it backs off to a shorter clue.':'No clues yet, so it starts with a default guess.'}</p>}
  </div>
  <p class="toy-note">The predictor is only these four tallies, the same kind of count Markov made by hand.</p>
 </div>;
}
