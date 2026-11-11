import '../../i18n/preact';
import '../../styles/games/zero-counts.css';
import {useRef,useState} from 'preact/hooks';
import GoalBar from '../game/GoalBar';
import ResultCard,{type GameResult} from '../game/ResultCard';
import {markPlayed} from '../../lib/progress';
import {CRASHES_NEEDED,ORDER_SIZE,counts,crashes,cupBits,drinkProbability,drinks,orderBits,orderKey,regulars,rescueTotals,seenTotal,unseenCups,zeroStars,type Drink} from './zero-game';
const slug='zero-counts';
const bitsText=(bits:number)=>bits===Infinity?'∞':bits.toFixed(1);
const pctText=(p:number)=>`${Math.round(p*1000)/10}%`;
type Served={order:Drink[];bits:number;repeat:boolean};
export default function ZeroToy(){
 const [tray,setTray]=useState<Drink[]>([]);
 const [broken,setBroken]=useState<Drink[][]>([]);
 const [last,setLast]=useState<Served|null>(null);
 const [pick,setPick]=useState<number|null>(null);
 const played=useRef(false),firstDrink=useRef<HTMLButtonElement>(null);
 const touch=()=>{if(!played.current){played.current=true;markPlayed(slug);}};
 const rescuing=broken.length>=CRASHES_NEEDED;
 const add=(d:Drink)=>{touch();setLast(null);setTray(t=>t.length<ORDER_SIZE?[...t,d]:t);};
 const serve=()=>{
  if(tray.length<ORDER_SIZE)return;
  const bits=orderBits(tray,0),repeat=bits===Infinity&&broken.some(o=>orderKey(o)===orderKey(tray));
  setLast({order:tray,bits,repeat});
  if(crashes(tray)&&!repeat)setBroken(b=>[...b,tray]);
  setTray([]);
 };
 const replay=()=>{setTray([]);setBroken([]);setLast(null);setPick(null);requestAnimationFrame(()=>firstDrink.current?.focus());};
 const totals=rescueTotals(broken),best=[...totals].sort((a,b)=>a.bits-b.bits)[0]!,u=unseenCups(broken),cups=regulars.length+broken.length*ORDER_SIZE;
 const chosen=totals.find(t=>t.reserve===pick);
 const result:GameResult|null=chosen?{slug,headline:`Crashed it 3 times, then rescued it at ${chosen.bits.toFixed(1)} bits.`,detail:chosen===best?`${Math.round(chosen.reserve*100)}% was the best reserve: ${u} of tonight’s ${cups} cups were drinks it had never counted.`:`The best reserve was ${Math.round(best.reserve*100)}% (${best.bits.toFixed(1)} bits): ${u} of tonight’s ${cups} cups were drinks it had never counted.`,score:{value:Number(chosen.bits.toFixed(1)),label:'Total surprise (bits)'},stars:zeroStars(chosen.reserve,broken),shareText:`I crashed a 1953 word counter with infinite surprise 3 times, then rescued it at ${chosen.bits.toFixed(1)} bits.`}:null;
 const status=result?'Rescued.':rescuing?'Now rescue it: pick a reserve.':`Crashes: ${broken.length} / 3`;
 return <div class="zero-game">
  <GoalBar goal="Crash the counter with 3 different orders it has never seen. Then rescue it with the least total surprise." status={status}/>
  <p class="zero-seen">After “please bring”, the counter has seen 10 orders: <span dir="ltr">tea 6 · coffee 3 · cocoa 1</span>.</p>
  {!rescuing&&<>
   <div class="zero-menu" role="group" aria-label="Menu">
    {drinks.map((d,i)=><button type="button" key={d} ref={i===0?firstDrink:null} class={counts[d]?'':'is-unseen'} disabled={tray.length>=ORDER_SIZE} onClick={()=>add(d)}><b dir="ltr">{d}</b><span dir="ltr">{pctText(counts[d]/seenTotal)}</span></button>)}
   </div>
   <div class="zero-tray">
    <ol class="zero-cups" aria-label="Your order">
     {Array.from({length:ORDER_SIZE},(_,i)=>{const d=tray[i];return <li key={i}>{d?<button type="button" aria-label={`Remove ${d}`} onClick={()=>setTray(t=>t.filter((_,j)=>j!==i))}><span dir="ltr">{d}</span><span aria-hidden="true">×</span></button>:<span class="zero-empty">Cup {i+1}</span>}</li>;})}
    </ol>
    <button type="button" class="game-btn is-primary" disabled={tray.length<ORDER_SIZE} onClick={serve}>Serve the order</button>
   </div>
   <div class="zero-readout" role="status">{last&&(last.repeat?<p class="zero-verdict">It already crashed on those drinks. Try a different mix.</p>:<>
    <p class={`zero-verdict${last.bits===Infinity?' is-crash':''}`} key={orderKey(last.order)+broken.length}>{last.bits===Infinity?'Crash: ∞ bits of surprise.':`It survived: ${last.bits.toFixed(1)} bits of surprise.`}</p>
    <ul class="zero-cups-math" dir="ltr" aria-hidden="true">{last.order.map((d,i)=><li key={i}><span>{d}</span><span>{pctText(drinkProbability(d,0))}</span><b>{bitsText(cupBits(d,0))}</b></li>)}</ul>
    {last.bits===Infinity&&<p class="zero-why">One zero makes the whole order impossible to it.</p>}
   </>)}</div>
  </>}
  <ol class="zero-cracks" aria-label="Crashes">{Array.from({length:CRASHES_NEEDED},(_,i)=>{const o=broken[i];return <li key={i} class={o?'is-broken':''}>{o?<span dir="ltr">{o.join(' · ')}</span>:<span>Crash {i+1}</span>}</li>;})}</ol>
  {rescuing&&!result&&<div class="zero-rescue">
   <p>Smoothing sets aside some probability for drinks it has never counted. Tonight it must score your 3 orders plus the regulars’ 10 cups: {u} of {cups} cups are new drinks.</p>
   <p class="zero-question">How much should it set aside?</p>
   <div class="game-choices" role="group" aria-label="Reserve for unseen drinks">{totals.map(t=><button type="button" key={t.reserve} onClick={()=>setPick(t.reserve)}><span dir="ltr">{Math.round(t.reserve*100)}%</span></button>)}</div>
  </div>}
  {result&&<>
   <ul class="zero-totals">{totals.map(t=><li key={t.reserve} class={`${t===best?'is-best':''}${t===chosen?' is-pick':''}`}><div class={`game-meter${t===best?' is-good':''}`}><span class="game-meter-label"><span><span dir="ltr">{Math.round(t.reserve*100)}%</span>{t===chosen?' · your pick':''}{t===best?' · best':''}</span><b dir="ltr">{t.bits.toFixed(1)} bits</b></span><span class="game-meter-track"><span class="game-meter-fill" style={`--value:${t.bits/Math.max(...totals.map(x=>x.bits))}`}/></span></div></li>)}</ul>
   <ResultCard result={result} onReplay={replay}/>
  </>}
  <p class="toy-note">Ten invented orders, and the reserve is split equally; Good–Turing and later methods estimate it from the data.</p>
 </div>;
}
