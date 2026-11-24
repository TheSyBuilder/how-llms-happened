import '../../i18n/preact';
import '../../styles/game.css';
import {useEffect,useLayoutEffect,useRef,useState} from 'preact/hooks';
import {t} from '../../i18n/core';
import {eras,metaFor,nextChapter} from '../../lib/chapter-meta';
import {markCompleted,markPlayed} from '../../lib/progress';
import {chapterUrl,drawResultImage,resultKey,saveResultImage,scoreText,xIntentUrl} from '../../lib/share';
import {isolateRuns} from './bidi';
export type GameResult={slug:string;progressSlug?:string;completed?:boolean;headline:string;detail?:string;score?:{value:number;max?:number;label:string};stars?:0|1|2|3;shareText:string};
const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
async function copy(text:string){
 try{await navigator.clipboard.writeText(text);return true;}catch{return false;}
}
export default function ResultCard({result,onReplay}:{result:GameResult;onReplay:()=>void}){
 const heading=useRef<HTMLHeadingElement>(null);const [status,setStatus]=useState('');const [burst,setBurst]=useState(false);
 const meta=metaFor(result.slug),next=nextChapter(result.slug),era=meta&&eras.find(item=>item.id===meta.era);
 const url=chapterUrl(result.slug),key=resultKey(result);
 // A layout effect runs in the same task as the DOM commit, so a visible card is always a saved result.
 useLayoutEffect(()=>{
  const slug=result.progressSlug??result.slug;
  if(result.completed===false)markPlayed(slug);
  else markCompleted(slug,{best:result.headline,...(result.stars===undefined?{}:{stars:result.stars})});
 },[key,result.progressSlug,result.completed]);
 useEffect(()=>{
  const target=heading.current;target?.focus({preventScroll:true});target?.scrollIntoView({block:'nearest',behavior:reduced()?'auto':'smooth'});setStatus('');
  if((result.stars??0)>=1&&!reduced()){setBurst(true);navigator.vibrate?.(10);const timer=setTimeout(()=>setBurst(false),700);return ()=>clearTimeout(timer);}
  return undefined;
 },[key]);
 const save=async()=>{
  setStatus('Saving image…');
  try{
   const canvas=await drawResultImage(document.createElement('canvas'),{url,headline:result.headline,...(meta?{title:meta.title,year:meta.year,era:meta.era}:{}),...(result.score?{score:result.score}:{}),...(result.stars===undefined?{}:{stars:result.stars})});
   const outcome=await saveResultImage(canvas,`llm-lineage-${result.slug}.png`);
   setStatus(outcome==='downloaded'?'Image saved.':outcome==='shared'?'Image shared.':'');
  }catch{setStatus('Could not make the image.');}
 };
 return <section class="result-card" aria-labelledby={`result-${result.slug}`}>
  {burst&&<span class="result-burst" aria-hidden="true">{Array.from({length:8},(_,i)=><i style={`--i:${i}`}/>)}</span>}
  <div class="result-top">
   {meta&&era&&<span class="era-badge" style={`--era:var(--era-${meta.era})`}>{era.label}</span>}
   {result.stars!==undefined&&<span class="result-stars" role="img" aria-label={`${result.stars} of 3 stars`}>{'★'.repeat(result.stars)+'☆'.repeat(3-result.stars)}</span>}
  </div>
  <h2 id={`result-${result.slug}`} class="result-headline" tabIndex={-1} ref={heading}>{isolateRuns(result.headline)}</h2>
  {result.detail&&<p class="result-detail">{isolateRuns(result.detail)}</p>}
  {result.score&&<p class="result-score"><span>{result.score.label}</span> <strong><bdi dir="ltr">{scoreText(result.score)}</bdi></strong></p>}
  <div class="result-actions">
   <a class="game-btn is-primary" href={xIntentUrl(t(result.shareText),url)} target="_blank" rel="noopener noreferrer">Share on X</a>
   <button type="button" class="game-btn" onClick={async()=>setStatus(await copy(url)?'Link copied.':'Could not copy the link.')}>Copy link</button>
   <button type="button" class="game-btn" onClick={save}>Save image</button>
   <button type="button" class="game-btn" onClick={onReplay}>Play again</button>
  </div>
  <p class="result-status" role="status">{status}</p>
  {next&&<a class="result-next" href={`/chapters/${next.slug}/#play`}>{`Next: ${next.year} · ${next.title}`} <span class="dir-arrow" aria-hidden="true">→</span></a>}
 </section>;
}
