export type ChapterProgress={played:boolean;completed:boolean;best?:string;stars?:0|1|2|3};
const key='lineage-progress-v1';
const listeners=new Set<()=>void>();
function storage():Storage|undefined {try{return typeof localStorage==='undefined'?undefined:localStorage;}catch{return undefined;}}
function validEntry(value:unknown):ChapterProgress|undefined {
 if(!value||typeof value!=='object'||Array.isArray(value))return undefined;
 const {played,completed,best,stars}=value as Record<string,unknown>;
 if(typeof played!=='boolean'&&typeof completed!=='boolean')return undefined;
 const entry:ChapterProgress={played:played===true||completed===true,completed:completed===true};
 if(typeof best==='string')entry.best=best;
 if(typeof stars==='number'&&Number.isFinite(stars))entry.stars=Math.min(3,Math.max(0,Math.floor(stars))) as 0|1|2|3;
 return entry;
}
export function getProgress():Record<string,ChapterProgress> {
 try{
  const value=JSON.parse(storage()?.getItem(key)??'{}');
  if(!value||typeof value!=='object'||Array.isArray(value))return {};
  // fromEntries defines own keys, so a stored "__proto__" cannot replace the result's prototype.
  return Object.fromEntries(Object.entries(value).flatMap(([slug,raw])=>{const entry=validEntry(raw);return entry?[[slug,entry] as const]:[];}));
 }catch{return {};}
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
