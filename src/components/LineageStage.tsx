import '../i18n/preact';
import {useState} from 'preact/hooks';
import ResearchGlyph from './ResearchGlyph';
type Stop={slug:string;title:string;year:number;paper:string;url:string;verb:string};
export default function LineageStage({stops}:{stops:Stop[]}){
 const [selected,setSelected]=useState(0);const stop=stops[selected]!;
 return <section class="lineage-stage" aria-label="Explore the ideas">
  <div class="stage-main"><div class="stage-copy"><p class="eyebrow"><button class="capsule-date" data-curiosity="1913" aria-label="Open the 1913 time capsule" title="A little history is hiding here">1913</button> — today / LLM Lineage</p><h1>The ideas behind<br/><em>the intelligence.</em></h1><p class="stage-subtitle">Real research. Small games. Big discoveries.</p><div class="stage-actions"><a class="stage-play" href={`/chapters/${stop.slug}/#play`}>Play {stop.title} <span aria-hidden="true">↗</span></a><button class="stage-browse" data-open-explorer>All experiments <span aria-hidden="true">↓</span></button></div></div>
  <div class="stage-object" data-selected={stop.slug}><span class="object-index">0{selected+1} / 0{stops.length}</span><div class="object-art" key={stop.slug}><ResearchGlyph kind={stop.slug}/></div><div class="object-caption" aria-live="polite"><span>{stop.year} · {stop.verb}</span><a href={stop.url} target="_blank" rel="noopener noreferrer">{stop.paper} ↗</a></div></div></div>
  <div class="thread-stops" role="group" aria-label="Choose a turning point">{stops.map((item,i)=><button aria-pressed={selected===i} onClick={()=>setSelected(i)}><span class="thread-year">{item.year}</span><span class="thread-dot" aria-hidden="true"/><strong>{item.title}</strong></button>)}</div>
  <span class="thread-note">A path through the story. Pick a point to explore.</span>
 </section>;
}
