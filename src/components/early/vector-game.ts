// "Closest word": a daily guessing puzzle scored by cosine similarity between real GloVe word vectors.
export type VectorData={words:string[];dim:number;vectors:Int8Array;norms:Float32Array;index:Map<string,number>};
export function parseVectors(json:{words:string[];dim:number},buffer:ArrayBuffer):VectorData {
 const vectors=new Int8Array(buffer),{words,dim}=json;
 if(vectors.length!==words.length*dim)throw new Error('Vector file does not match the word list.');
 const norms=new Float32Array(words.length);
 for(let w=0;w<words.length;w++){let s=0;for(let k=0;k<dim;k++){const v=vectors[w*dim+k]!;s+=v*v;}norms[w]=Math.sqrt(s)||1;}
 return {words,dim,vectors,norms,index:new Map(words.map((w,i)=>[w,i]))};
}
export function cosine(data:VectorData,a:number,b:number):number {
 let s=0;const {dim,vectors}=data;
 for(let k=0;k<dim;k++)s+=vectors[a*dim+k]!*vectors[b*dim+k]!;
 return s/(data.norms[a]!*data.norms[b]!);
}
// rank[i] is 0 for the secret, 1 for its nearest neighbour, and so on.
export function rankFrom(data:VectorData,secret:number):{sims:Float32Array;rank:Int32Array;order:number[]} {
 const sims=new Float32Array(data.words.length);
 for(let i=0;i<sims.length;i++)sims[i]=i===secret?1:cosine(data,secret,i);
 const order=Array.from(sims.keys()).sort((a,b)=>a===secret?-1:b===secret?1:sims[b]!-sims[a]!);
 const rank=new Int32Array(sims.length);order.forEach((w,r)=>{rank[w]=r;});
 return {sims,rank,order};
}
export const secrets=['ocean','river','music','coffee','horse','winter','garden','doctor','island','money','train','church','forest','school','movie','soldier','summer','bridge','castle','mountain','rain','snow','storm','beach','sugar','wine','dinner','hospital','airport','baby','king','queen','bird','fish','moon','star','ship','boat','car','road','city','village','farm','apple','water','fire','ice','gold','silver','prison','police','army','heart','blood','brain','science','book','letter','newspaper','radio','television','phone','computer','football','tennis','dance','song','film','museum','artist','teacher','student','family','mother','friend','holiday','market','bank','engine','plane','rocket','space','earth','wind','sun','night','morning','dream','cat','dog','cheese','chocolate','kitchen','bread','flower','breakfast','lion','tiger','planet','fruit','chicken','milk','diamond','poetry','painting','wedding','birthday','sky','cloud','sleep','guitar','piano','camera','desert','pizza','robot','internet'];
// Puzzle 1 is 1 November 2026, counted in the player's own calendar day.
export function dayNumber(date:Date):number {
 return Math.round((Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())-Date.UTC(2026,10,1))/86400000)+1;
}
// 37 is coprime with the list length, so consecutive days walk through every word before repeating.
export function secretFor(day:number):string {const n=secrets.length;return secrets[((day*37)%n+n)%n]!;}
export function normalizeGuess(raw:string,has:(word:string)=>boolean):string|undefined {
 const w=raw.toLowerCase().trim().replace(/[^a-z]/g,'');
 if(!w)return undefined;
 for(const form of [w,w.replace(/ies$/,'y'),w.replace(/es$/,''),w.replace(/s$/,'')])if(form&&has(form))return form;
 return undefined;
}
export const closeness=(sim:number)=>Math.round(sim*100);
export type Tier='found'|'hot'|'warm'|'cold';
export const tierOf=(rank:number):Tier=>rank===0?'found':rank<=10?'hot':rank<=100?'warm':'cold';
const blocks:Record<Tier,string>={found:'🟩',hot:'🟧',warm:'🟨',cold:'⬜'};
// A spoiler-free strip in guess order; long games keep the first 24 and the last.
export function shareStrip(ranks:readonly number[]):string {
 const cells=ranks.map(r=>blocks[tierOf(r)]);
 return cells.length>25?cells.slice(0,24).join('')+'…'+cells.at(-1):cells.join('');
}
// With no guesses yet, the first hint is the 100th-nearest word.
export function hintRank(bestRank:number|undefined,size:number):number {return Math.max(1,Math.floor(Math.min(bestRank??200,size)/2));}
export function vectorStars(solved:boolean,guesses:number):0|1|2|3 {return !solved?0:guesses<10?3:guesses<25?2:1;}
