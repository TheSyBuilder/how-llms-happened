import '../../i18n/preact';
import '../../styles/games/attention.css';
import {Fragment} from 'preact';
import {useRef,useState} from 'preact/hooks';
import GoalBar from '../game/GoalBar';
import ResultCard,{type GameResult} from '../game/ResultCard';
import {markPlayed} from '../../lib/progress';

export type Pair={en:string[];fr:string[];weights:number[][]};
// Hand-made attention weights in the style of the paper's alignment figures: one row per French word, summing to one.
export const pairs:Pair[]=[
  {en:['the','red','fox'],fr:['le','renard','rouge'],weights:[[.85,.05,.1],[.08,.12,.8],[.05,.85,.1]]},
  {en:['the','agreement','on','the','European','Economic','Area'],fr:['l’','accord','sur','la','zone','économique','européenne'],weights:[
    [.8,.14,.02,.02,.01,.005,.005],[.04,.9,.03,.01,.01,.005,.005],[.01,.05,.86,.06,.01,.005,.005],[.01,.01,.08,.76,.04,.03,.07],
    [.005,.005,.01,.08,.12,.08,.7],[.005,.005,.005,.02,.12,.8,.045],[.005,.005,.005,.02,.82,.1,.045]]},
  {en:['I','do','not','like','snow'],fr:['je','n’','aime','pas','la','neige'],weights:[
    [.9,.05,.02,.02,.01],[.05,.15,.75,.04,.01],[.03,.05,.05,.85,.02],[.02,.18,.72,.06,.02],[.02,.02,.03,.28,.65],[.01,.01,.01,.04,.93]]},
];
/** A cell counts as one of the model's links when it holds at least this much of a French word's attention. */
export const linkThreshold=.3;
export const linkKey=(fr:number,en:number)=>`${fr}-${en}`;
export function modelLinks(pair:Pair):string[] {
  return pair.weights.flatMap((row,fr)=>row.flatMap((w,en)=>w>=linkThreshold?[linkKey(fr,en)]:[]));
}
/** One point per model link you drew, minus one per extra link; never below zero. */
export function scoreLinks(pair:Pair,links:string[]) {
  const model=new Set(modelLinks(pair)),mine=new Set(links);
  const hits=[...mine].filter(key=>model.has(key)).length;
  const extras=mine.size-hits;
  return {hits,extras,missed:model.size-hits,points:Math.max(0,hits-extras),max:model.size};
}
export const maxAlignment=pairs.reduce((sum,pair)=>sum+modelLinks(pair).length,0);
export function alignmentStars(points:number):0|1|2|3 {return points>=maxAlignment-1?3:points>=maxAlignment-4?2:points>=Math.ceil(maxAlignment/2)?1:0;}

const row=56,half=22;
const y=(i:number)=>i*row+half;

export default function SourceAttentionToy() {
  const [round,setRound]=useState(0);
  const [links,setLinks]=useState<string[]>([]);
  const [picked,setPicked]=useState<{side:'en'|'fr';index:number}|null>(null);
  const [shown,setShown]=useState(false);
  const [total,setTotal]=useState(0);
  const [done,setDone]=useState(false);
  const played=useRef(false);
  const touch=()=>{if(!played.current){played.current=true;markPlayed('attention');}};
  const pair=pairs[round]!;
  const score=scoreLinks(pair,links);
  const model=new Set(modelLinks(pair));
  const last=round===pairs.length-1;
  const height=Math.max(pair.en.length,pair.fr.length)*row-(row-2*half);
  const toggleLink=(fr:number,en:number)=>{const key=linkKey(fr,en);setLinks(list=>list.includes(key)?list.filter(k=>k!==key):[...list,key]);};
  const tap=(side:'en'|'fr',index:number)=>{
    if(shown)return;touch();
    if(!picked||picked.side===side){setPicked(picked&&picked.side===side&&picked.index===index?null:{side,index});return;}
    toggleLink(side==='fr'?index:picked.index,side==='en'?index:picked.index);setPicked(null);
  };
  const reveal=()=>{touch();setShown(true);setPicked(null);setTotal(t=>t+score.points);};
  const next=()=>{if(last){setDone(true);return;}setRound(r=>r+1);setLinks([]);setShown(false);};
  const replay=()=>{setRound(0);setLinks([]);setPicked(null);setShown(false);setTotal(0);setDone(false);};
  const linked=(side:'en'|'fr',i:number)=>links.some(key=>Number(key.split('-')[side==='fr'?0:1])===i);
  const stars=alignmentStars(total);
  const result:GameResult={
    slug:'attention',
    headline:`My alignments matched the model’s attention on ${total} of ${maxAlignment} links.`,
    detail:'Attention re-reads the source for every word it writes. The reads cross over when French puts adjectives after nouns.',
    score:{value:total,max:maxAlignment,label:'Links matched'},
    stars,
    shareText:`I drew ${total}/${maxAlignment} of the word alignments that attention learned for English → French. Can you read like a 2015 translator?`,
  };
  const word=(side:'en'|'fr',text:string,i:number)=><button type="button" key={`${side}${i}`} class={`att-word ${linked(side,i)?'is-linked':''}`} aria-pressed={picked?.side===side&&picked.index===i} disabled={shown} onClick={()=>tap(side,i)}>{text}</button>;
  return <div class="att-game">
    <GoalBar goal="Link each French word to the English word it translates. Then compare with the model’s attention." status={done?'Finished':`Sentence ${round+1} / ${pairs.length}`} score={{value:total,max:maxAlignment,label:'Links matched'}}/>
    {done?<ResultCard result={result} onReplay={replay}/>:<>
      <p class="att-help">{shown?'Thick lines are where the model looked hardest.':picked?'Now tap a word on the other side.':'Tap an English word, then a French word. Tap the same pair again to undo.'}</p>
      <div class="att-board" dir="ltr">
        <div class="att-column" lang="en" role="group" aria-label="English">{pair.en.map((text,i)=>word('en',text,i))}</div>
        <svg class="att-lines" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={`block-size:${height}px`} aria-hidden="true">
          {shown&&pair.weights.flatMap((weights,fr)=>weights.map((w,en)=>w>=.05&&<line key={`m${fr}-${en}`} class="att-model" x1="0" y1={y(en)} x2="100" y2={y(fr)} style={`stroke-width:${1+w*9}px;opacity:${.2+w*.8}`}/>))}
          {links.map(key=>{const [fr,en]=key.split('-').map(Number);return <line key={key} class={`att-mine ${shown?(model.has(key)?'is-hit':'is-miss'):''}`} x1="0" y1={y(en!)} x2="100" y2={y(fr!)}/>;})}
        </svg>
        <div class="att-column" lang="fr" role="group" aria-label="French">{pair.fr.map((text,i)=>word('fr',text,i))}</div>
      </div>
      {links.length>0&&<ul class="att-links" aria-label="Your links">{links.map(key=>{const [fr,en]=key.split('-').map(Number);return <li key={key}><button type="button" class={`att-chip ${shown?(model.has(key)?'is-hit':'is-miss'):''}`} disabled={shown} aria-label={`Remove ${pair.en[en!]} – ${pair.fr[fr!]}`} onClick={()=>toggleLink(fr!,en!)}><span dir="ltr">{`${pair.en[en!]} – ${pair.fr[fr!]}`}</span></button></li>;})}</ul>}
      {shown&&<figure class="att-heatmap">
        <figcaption>The model’s attention: one row per French word</figcaption>
        <div class="att-grid" dir="ltr" style={`--cols:${pair.en.length}`} role="img" aria-label={`Strongest reads: ${pair.fr.map((fr,i)=>`${fr} → ${pair.en[pair.weights[i]!.indexOf(Math.max(...pair.weights[i]!))]}`).join(', ')}`}>
          <span/>{pair.en.map((text,i)=><span class="att-col" key={`c${i}`} lang="en">{text}</span>)}
          {pair.fr.map((text,fr)=><Fragment key={`r${fr}`}>
            <span class="att-row" lang="fr">{text}</span>
            {pair.weights[fr]!.map((w,en)=><span key={`${fr}-${en}`} class={`att-cell ${links.includes(linkKey(fr,en))?'is-mine':''}`} style={`--w:${w}`}/>)}
          </Fragment>)}
        </div>
      </figure>}
      <p class="att-feedback" aria-live="polite">{shown?`${score.hits} of ${score.max} links matched${score.extras?`, ${score.extras} extra`:''}. +${score.points}`:''}</p>
      <div class="att-actions">
        {shown?<button type="button" class="game-btn is-primary" onClick={next}>{last?'See my score':'Next sentence'}</button>
          :<><button type="button" class="game-btn is-primary" disabled={!links.length} onClick={reveal}>Show the model’s attention</button><button type="button" class="game-btn" disabled={!links.length} onClick={()=>{setLinks([]);setPicked(null);}}>Clear</button></>}
      </div>
      <p class="toy-note">The heatmaps are hand-made in the style of the paper’s learned alignments; no translation model runs here.</p>
    </>}
  </div>;
}
