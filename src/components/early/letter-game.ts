// "Can you be random?": a Markov-style counter predicts each A/B press from the two presses before it.
export type Press='A'|'B';
export const ROUNDS=30;
export const contexts=['AA','AB','BA','BB'] as const;
export type Tally=Record<string,[number,number]>;
// Count what followed every pair of presses so far, like Markov counting what followed vowels.
export function tallyPairs(history:readonly Press[]):Tally {
 const tally:Tally={AA:[0,0],AB:[0,0],BA:[0,0],BB:[0,0]};
 for(let i=2;i<history.length;i++)tally[history[i-2]!+history[i-1]!]![history[i]==='A'?0:1]++;
 return tally;
}
function countAfter(history:readonly Press[],size:number){
 const counts:[number,number]=[0,0],context=history.slice(history.length-size).join('');
 for(let i=size;i<history.length;i++)if(history.slice(i-size,i).join('')===context)counts[history[i]==='A'?0:1]++;
 return counts;
}
// The guess is committed before the press. Ties back off to a shorter context: last two, last one, all presses.
export function predictNext(history:readonly Press[]):{guess:Press;context:string;counts:[number,number]} {
 for(const size of [2,1,0]){
  if(history.length<size)continue;
  const counts=countAfter(history,size);
  if(counts[0]!==counts[1])return {guess:counts[0]>counts[1]?'A':'B',context:history.slice(history.length-size).join(''),counts};
 }
 return {guess:'A',context:'',counts:[0,0]};
}
// Replays a finished sequence and scores every committed guess.
export function scoreRun(history:readonly Press[]):{hits:number;total:number;rate:number;marks:boolean[]} {
 const marks=history.map((press,i)=>predictNext(history.slice(0,i)).guess===press);
 const hits=marks.filter(Boolean).length;
 return {hits,total:history.length,rate:history.length?hits/history.length:0,marks};
}
export function letterStars(rate:number):0|1|2|3 {return rate<=.55?3:rate<=.62?2:rate<=.70?1:0;}
export function keyPress(key:string):Press|undefined {
 const k=key.toLowerCase();
 return k==='a'||k==='arrowleft'?'A':k==='b'||k==='arrowright'?'B':undefined;
}
