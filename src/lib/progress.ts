export type ChapterProgress={played:boolean;completed:boolean;best?:string;stars?:0|1|2|3};
const key='lineage-progress-v1';
const listeners=new Set<()=>void>();
function storage():Storage|undefined {try{return typeof localStorage==='undefined'?undefined:localStorage;}catch{return undefined;}}
export function getProgress():Record<string,ChapterProgress> {
 try{const value=JSON.parse(storage()?.getItem(key)??'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}
}
function update(slug:string,change:(entry:ChapterProgress)=>ChapterProgress){
 const all=getProgress();all[slug]=change(all[slug]??{played:false,completed:false});
 try{storage()?.setItem(key,JSON.stringify(all));}catch{}
 for(const listener of [...listeners])try{listener();}catch{}
}
export function markPlayed(slug:string):void {update(slug,entry=>({...entry,played:true}));}
export function markCompleted(slug:string,result:{best?:string;stars?:0|1|2|3}):void {
 update(slug,entry=>{
  const keepOld=entry.stars!==undefined&&(result.stars===undefined||entry.stars>=result.stars);
  const next:ChapterProgress={...entry,played:true,completed:true};
  if(!keepOld&&result.stars!==undefined){next.stars=result.stars;if(result.best!==undefined)next.best=result.best;}
  else if(entry.best===undefined&&result.best!==undefined)next.best=result.best;
  return next;
 });
}
// Other tabs write the same key; the storage event keeps every open page in step.
function onStorage(event:StorageEvent){if(event.key===key||event.key===null)for(const listener of [...listeners])try{listener();}catch{}}
export function onProgress(listener:()=>void):()=>void {
 if(!listeners.size&&typeof window!=='undefined')window.addEventListener('storage',onStorage);
 listeners.add(listener);
 return ()=>{listeners.delete(listener);if(!listeners.size&&typeof window!=='undefined')window.removeEventListener('storage',onStorage);};
}
