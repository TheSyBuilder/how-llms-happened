// "How long does a clue last?": one recurrent hidden number, h = tanh(w·h + x), fading through filler words.
export const fillers=['the','old','man','said','that','he','would','walk','down','to','the','far','end','of','the','long','road','and','then','wait','by','the','old'];
export const MAX_BET=15,LEAN=.6;
export const elmanRounds=[{clue:'river',weight:.5},{clue:'river',weight:.75},{clue:'river',weight:.88}] as const;
// The clue word injects +1; every filler injects 0, so only the copied state carries the clue.
export function clueTrace(weight:number,fillerCount:number):number[] {
 const trace=[Math.tanh(1)];
 for(let i=0;i<fillerCount;i++)trace.push(Math.tanh(weight*trace.at(-1)!));
 return trace;
}
// Fixed readout: how strongly the reader leans to the clue's meaning ("water" for river).
export const lean=(state:number)=>1/(1+Math.exp(-4*state));
// The number of filler words after which the reader still leans at least 60% toward the clue.
export function clueLife(weight:number,limit=fillers.length):number {
 const trace=clueTrace(weight,limit);let k=0;
 while(k+1<trace.length&&lean(trace[k+1]!)>=LEAN)k++;
 return k;
}
export function betPoints(bet:number,actual:number):number {return Math.max(0,3-Math.abs(bet-actual));}
export function elmanStars(points:number):0|1|2|3 {return points>=8?3:points>=5?2:points>=3?1:0;}
