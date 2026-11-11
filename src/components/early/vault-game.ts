// "Vault keeper": the player is the gates of one LSTM-style memory cell, c = f·c + i·g, read through the output gate.
export function gatedCell(previous:number,candidate:number,forget:number,input:number,output:number) {
 const kept=forget*previous,written=input*candidate,cell=kept+written;
 return {kept,written,cell,visible:output*Math.tanh(cell)};
}
export type Gates={keep:boolean;write:boolean};
export type Beat={value:number;kind:'code'|'new-code'|'noise'};
// C: the code arrives. N: a new code replaces it. .: a distractor.
export const vaultLevels=[{pattern:'C...',beatMs:1700},{pattern:'.C.....',beatMs:1400},{pattern:'.C..N....',beatMs:1150}] as const;
export const READ_WINDOW_MS=3000;
export function makeStream(pattern:string,random:()=>number=Math.random):Beat[] {
 const digit=(not:number[])=>{let d=0;do d=1+Math.floor(random()*9);while(not.includes(d));return d;};
 const codes:number[]=[];
 for(const ch of pattern)if(ch!=='.')codes.push(digit(codes));
 let next=0;
 return Array.from(pattern,ch=>ch==='.'?{value:digit(codes),kind:'noise'}:{value:codes[next++]!,kind:next===1?'code':'new-code'});
}
export const expectedCode=(stream:readonly Beat[])=>[...stream].reverse().find(b=>b.kind!=='noise')?.value??0;
export function vaultStep(cell:number,beat:Beat,gates:Gates):number {return gatedCell(cell,beat.value,gates.keep?1:0,gates.write?1:0,1).cell;}
export function runVault(stream:readonly Beat[],gates:readonly Gates[]):number {
 return stream.reduce((cell,beat,i)=>vaultStep(cell,beat,gates[i]??{keep:true,write:false}),0);
}
// The ideal gate plan: write each code, forget on a replacement, keep everything else out.
export function perfectGates(stream:readonly Beat[]):Gates[] {return stream.map(b=>({keep:b.kind!=='new-code',write:b.kind!=='noise'}));}
export function vaultStars(opened:number):0|1|2|3 {return Math.max(0,Math.min(3,opened)) as 0|1|2|3;}
