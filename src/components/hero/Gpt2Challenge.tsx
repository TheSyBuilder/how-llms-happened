import '../../i18n/preact';
import '../../styles/gpt2-challenge.css';
import {useEffect,useLayoutEffect,useRef,useState} from 'preact/hooks';
import {t} from '../../i18n/core';
import {markPlayed} from '../../lib/progress';
import GoalBar from '../game/GoalBar';
import ResultCard,{type GameResult} from '../game/ResultCard';
import data from '../../data/gpt2-challenge.json';

export type Item={id:string;prefix:string;options:string[];answer:number;probs:number[];top1:string};
export const items:Item[]=data.items;
export const ROUNDS=10,SECONDS=15,SLUG='gpt-2';
// The first round of a page view is fixed so the server render and hydration agree; the other nine are drawn on mount.
export const OPENING=Math.max(0,items.findIndex(item=>item.id==='canberra'));

export function random(seed:number){let a=seed>>>0;return ()=>{a=a+0x6d2b79f5>>>0;let x=Math.imul(a^a>>>15,1|a);x=x+Math.imul(x^x>>>7,61|x)^x;return ((x^x>>>14)>>>0)/4294967296;};}
// Indices of `count` distinct items out of `total`, shuffled by `seed`; `first`, when given, leads.
export function pickRounds(seed:number,count=ROUNDS,total=items.length,first?:number){
 const next=random(seed),pool=Array.from({length:total},(_,i)=>i).filter(i=>i!==first);
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[pool[i],pool[j]]=[pool[j]!,pool[i]!];}
 return (first===undefined?pool:[first,...pool]).slice(0,count);
}
export const gpt2Pick=(probs:number[])=>probs.reduce((best,p,i)=>p>probs[best]!?i:best,0);
// picks[i] is the option index chosen for round i, or -1 when the timer ran out.
export function score(rounds:Item[],picks:number[]){
 let you=0,gpt=0;
 picks.forEach((pick,i)=>{const item=rounds[i];if(!item)return;if(pick===item.answer)you++;if(gpt2Pick(item.probs)===item.answer)gpt++;});
 return {you,gpt};
}
export const stars=(you:number,gpt:number):0|1|2|3=>you>=9?3:you>gpt?2:you===gpt?1:0;
export function outcome(you:number,gpt:number,max=ROUNDS):GameResult{
 const tally=`You ${you} · GPT-2 ${gpt}.`;
 return {slug:SLUG,stars:stars(you,gpt),
  headline:t(you>gpt?`${tally} You beat GPT-2.`:you<gpt?`${tally} GPT-2 wins this time.`:`${tally} It's a tie.`),
  detail:t('GPT-2 is good at idioms and famous lines, and weak at sums, negation and facts it never read.'),
  score:{value:you,max,label:t('Your score')},
  shareText:t(`I scored ${you}/${max} vs GPT-2's ${gpt}/${max} on "Are you smarter than GPT-2?"`)};
}
const percent=(p:number)=>p<.01?'<1%':p>.99?'>99%':`${Math.round(p*100)}%`;
const editable=(target:EventTarget|null)=>target instanceof HTMLElement&&(target.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

export default function Gpt2Challenge(){
 const [order,setOrder]=useState(()=>pickRounds(0,ROUNDS,items.length,OPENING));
 const [picks,setPicks]=useState<number[]>([]);
 const [revealed,setRevealed]=useState(false);
 const [timed,setTimed]=useState(true);
 const [left,setLeft]=useState(SECONDS*1000);
 const [inView,setInView]=useState(false);
 const root=useRef<HTMLElement>(null),played=useRef(false),focusNext=useRef<'next'|'choice'|null>(null);
 const rounds=order.map(i=>items[i]!),round=picks.length-(revealed?1:0),item=rounds[round],done=round>=ROUNDS;
 const {you,gpt}=score(rounds,picks);

 useEffect(()=>{
  setOrder(pickRounds(Math.random()*2**32,ROUNDS,items.length,OPENING));
  if(typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches)setTimed(false);
  const node=root.current;if(!node||typeof IntersectionObserver!=='function'){setInView(true);return;}
  const observer=new IntersectionObserver(([entry])=>setInView(!!entry?.isIntersecting),{threshold:.35});
  observer.observe(node);return ()=>observer.disconnect();
 },[]);

 const choose=(pick:number)=>{
  if(revealed||done)return;
  if(pick>=0&&!played.current){played.current=true;markPlayed(SLUG);}
  focusNext.current=root.current?.contains(document.activeElement)?'next':null;
  setPicks([...picks,pick]);setRevealed(true);
 };
 const next=()=>{
  if(!revealed)return;
  focusNext.current=root.current?.contains(document.activeElement)?'choice':null;
  setRevealed(false);setLeft(SECONDS*1000);
 };
 const replay=()=>{setOrder(pickRounds(Math.random()*2**32));setPicks([]);setRevealed(false);setLeft(SECONDS*1000);focusNext.current='choice';};

 // The clock only runs while the game is on screen and the tab is visible.
 useEffect(()=>{
  if(!timed||revealed||done||!inView)return;
  let last=performance.now();
  const id=setInterval(()=>{
   const now=performance.now(),step=document.hidden?0:now-last;last=now;
   setLeft(value=>Math.max(0,value-step));
  },100);
  return ()=>clearInterval(id);
 },[timed,revealed,done,inView,round]);
 useEffect(()=>{if(timed&&left<=0&&!revealed&&!done)choose(-1);},[left]);

 useEffect(()=>{
  const onKey=(event:KeyboardEvent)=>{
   if(!inView||done||event.altKey||event.ctrlKey||event.metaKey||editable(event.target))return;
   const number=Number(event.key);
   if(!revealed&&number>=1&&number<=4&&item&&number<=item.options.length){event.preventDefault();choose(number-1);}
   else if(revealed&&event.key==='Enter'&&!(event.target instanceof HTMLElement&&event.target.closest('button,a'))){event.preventDefault();next();}
  };
  addEventListener('keydown',onKey);return ()=>removeEventListener('keydown',onKey);
 });

 useLayoutEffect(()=>{
  const want=focusNext.current;focusNext.current=null;
  if(want==='next')root.current?.querySelector<HTMLButtonElement>('.g2c-next')?.focus();
  if(want==='choice')root.current?.querySelector<HTMLButtonElement>('.g2c-choices button')?.focus();
 },[revealed,order]);

 const status=done?'Final score':`Round ${Math.min(round+1,ROUNDS)} / ${ROUNDS}`;
 const pick=revealed?picks[round]!:undefined,model=item?gpt2Pick(item.probs):0;
 const ratio=left/(SECONDS*1000),seconds=Math.ceil(left/1000);
 return <section class="g2c" ref={root} aria-labelledby="g2c-title">
  <h2 id="g2c-title" class="g2c-title">Are you smarter than GPT-2?</h2>
  <GoalBar goal="Pick the real next word. Beat GPT-2." status={status}/>
  {done?<ResultCard result={outcome(you,gpt)} onReplay={replay}/>:item&&<div class="g2c-board">
   <div class="g2c-head">
    <p class="g2c-score" aria-live="polite" aria-atomic="true">{`You ${you} · GPT-2 ${gpt}`}</p>
    <div class="g2c-clock">
     {timed&&<span class={`g2c-ring${revealed?' is-paused':seconds<=5?' is-low':''}`} role="timer" aria-label={`${seconds} seconds left`}>
      <svg viewBox="0 0 44 44" aria-hidden="true"><circle class="g2c-ring-track" cx="22" cy="22" r="19"/><circle class="g2c-ring-fill" cx="22" cy="22" r="19" pathLength="100" style={`stroke-dashoffset:${(1-ratio)*100}`}/></svg>
      <b aria-hidden="true">{revealed?'':seconds}</b>
     </span>}
     <button type="button" class="game-btn g2c-toggle" aria-pressed={!timed} onClick={()=>{setTimed(!timed);setLeft(SECONDS*1000);}}>No timer</button>
    </div>
   </div>
   <p class="g2c-prefix" dir="ltr" key={item.id}>
    <span lang="en" translate={false}>{item.prefix+' '}</span>
    {revealed?<mark class="g2c-word" lang="en" translate={false}>{item.options[item.answer]!}</mark>:<span class="g2c-blank"><span class="g2c-caret" aria-hidden="true"/><span class="g2c-sr">(next word)</span></span>}
   </p>
   <div class="g2c-choices" role="group" aria-label="Choose the next word">
    {item.options.map((word,i)=>{
     const state=!revealed?'':i===item.answer?' is-answer':i===pick?' is-miss':'';
     return <button type="button" class={`g2c-choice${state}`} disabled={revealed} aria-pressed={revealed?i===pick:undefined} onClick={()=>choose(i)}>
      <kbd aria-hidden="true">{String(i+1)}</kbd>
      <span class="g2c-option" dir="ltr" lang="en" translate={false}>{word}</span>
      {revealed&&<span class="g2c-tags">{i===pick&&<span class="g2c-tag is-you">You</span>}{i===model&&<span class="g2c-tag is-gpt">GPT-2</span>}</span>}
      {revealed&&<span class="g2c-meter"><span class="g2c-meter-track"><span class="g2c-meter-fill" style={`--value:${item.probs[i]}`}/></span><b dir="ltr">{percent(item.probs[i]!)}</b></span>}
     </button>;
    })}
   </div>
   <div class="g2c-reveal" aria-live="polite">
    {revealed&&<>
     <p class={`g2c-verdict${pick===item.answer?' is-win':' is-loss'}`}>{pick===item.answer?'Right!':pick===-1?"Time's up.":'Not this time.'}</p>
     <p class="g2c-model">{model===item.answer?'GPT-2 got it right.':'GPT-2 got it wrong.'} <span class="g2c-top">{'Its top guess from its whole vocabulary:'} <code dir="ltr">{JSON.stringify(item.top1)}</code></span></p>
     <button type="button" class="game-btn is-primary g2c-next" onClick={next}>{round+1>=ROUNDS?'See your result':'Next word'} <span aria-hidden="true">→</span></button>
    </>}
   </div>
  </div>}
  <p class="toy-note">GPT-2 small (124M parameters, 2019). Its choices were recorded once with transformers.js; nothing runs live.</p>
 </section>;
}
