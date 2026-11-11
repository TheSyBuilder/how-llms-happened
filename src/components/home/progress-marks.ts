// Paints saved progress onto the static home page: [data-progress] items and [data-progress-count] counters.
import {getProgress,onProgress} from '../../lib/progress';
import {t} from '../../i18n/core';
function paint(){
 const all=getProgress(),slugs=new Set<string>(),played=new Set<string>();
 for(const node of document.querySelectorAll<HTMLElement>('[data-progress]')){
  const slug=node.dataset.progress!,entry=all[slug],done=!!entry?.completed;
  slugs.add(slug);if(done||entry?.played)played.add(slug);
  node.classList.toggle('is-played',played.has(slug));
  node.classList.toggle('is-done',done);
  const stars=node.querySelector<HTMLElement>('[data-stars]'),count=done?entry!.stars:undefined;
  if(!stars)continue;
  stars.hidden=count===undefined;
  if(count!==undefined){stars.textContent='★'.repeat(count)+'☆'.repeat(3-count);stars.setAttribute('aria-label',t(`${count} of 3 stars`));}
 }
 for(const counter of document.querySelectorAll('[data-progress-count]'))counter.textContent=t(`You've played ${played.size} / ${slugs.size}`);
}
paint();
onProgress(paint);
