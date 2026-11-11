// Home page grouping: each era with its chapters, in chronological order. Server-side only.
import {eras,chapterMeta,type ChapterMeta,type Era} from '../../lib/chapter-meta';
export type EraGroup={id:Era;label:string;years:string;stops:(ChapterMeta&{number:number})[]};
// The first era starts at its first chapter and the last one runs to today (both are open ends in `eras`).
export const eraGroups:EraGroup[]=eras.map(era=>{
 const stops=chapterMeta.map((meta,i)=>({...meta,number:i+1})).filter(meta=>meta.era===era.id);
 const from=era.from>0?era.from:stops[0]?.year??era.from;
 return {id:era.id,label:era.label,years:era.to>=9999?`${from}–today`:`${from}–${era.to}`,stops};
}).filter(group=>group.stops.length>0);
