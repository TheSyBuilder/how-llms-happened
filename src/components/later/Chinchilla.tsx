import '../../i18n/preact';
import '../../styles/games/chinchilla.css';
import {useState} from 'preact/hooks';
import GoalBar from '../game/GoalBar';
import ResultCard,{type GameResult} from '../game/ResultCard';
import ExperimentVisual from '../ExperimentVisual';
import {starsFor,usePlayed} from './played';

// Chinchilla's loss form L = E + A/N^α + B/D^β with the coefficients refitted by Besiroglu et al. (2024).
export const law={E:1.8172,A:482.01,B:2085.43,alpha:0.3478,beta:0.3658};
export const lossAt=(params:number,tokens:number)=>law.E+law.A/params**law.alpha+law.B/tokens**law.beta;
export const tokensFor=(compute:number,params:number)=>compute/(6*params);
export function optimalParams(compute:number){
 const {A,B,alpha,beta}=law;
 return ((alpha*A)/(beta*B))**(1/(alpha+beta))*(compute/6)**(beta/(alpha+beta));
}
// 100 for the compute-optimal size, minus 100 per factor of ten away from it.
export const roundScore=(params:number,compute:number)=>Math.max(0,Math.round(100*(1-Math.abs(Math.log10(params/optimalParams(compute))))));
export const chinchillaStars=(total:number)=>starsFor(total,[120,200,255]);
export const minLog=8,maxLog=12.3;
export const budgets=[
 {name:'A small lab’s budget',compute:1e21,real:[] as {name:string;params:number}[]},
 {name:'GPT-3’s budget',compute:3.14e23,real:[{name:'GPT-3',params:175e9}]},
 {name:'Gopher’s budget',compute:5.76e23,real:[{name:'Gopher',params:280e9},{name:'Chinchilla',params:70e9}]}
];
export const gopherScore=()=>roundScore(280e9,budgets[2]!.compute);
export function formatCount(n:number){
 for(const [size,unit] of [[1e12,'T'],[1e9,'B'],[1e6,'M']] as const)if(n>=size*.995){const x=n/size;return `${x>=10?Math.round(x):Math.round(x*10)/10}${unit}`;}
 return String(Math.round(n));
}
export const formatCompute=(c:number)=>{const e=Math.floor(Math.log10(c));const m=Math.round(c/10**e*100)/100;return `${m} × 10^${e}`;};

function LossChart({compute,pick,real}:{compute:number;pick:number;real:{name:string;params:number}[]}){
 const W=480,x0=44,x1=464,y0=24,y1=196;
 const best=optimalParams(compute),min=lossAt(best,tokensFor(compute,best)),span=.6;
 const x=(n:number)=>x0+(Math.log10(n)-minLog)/(maxLog-minLog)*(x1-x0);
 const y=(n:number)=>y1-8-Math.min(1,(lossAt(n,tokensFor(compute,n))-min)/span)*(y1-y0-8);
 const curve=Array.from({length:61},(_,i)=>10**(minLog+i/60*(maxLog-minLog))).map((n,i)=>`${i?'L':'M'}${x(n).toFixed(1)} ${y(n).toFixed(1)}`).join('');
 return <figure class="chin-chart" dir="ltr"><svg viewBox={`0 0 ${W} 236`} role="img" aria-label={`Loss across model sizes. Best: ${formatCount(best)} parameters. Yours: ${formatCount(pick)}.`}>
  <path d={`M${x0} ${y0-8}V${y1}H${x1}`} class="diagram-line"/>
  {[8,9,10,11,12].map(l=><text class="chin-tick" x={x(10**l)} y={y1+20} text-anchor="middle">{formatCount(10**l)}</text>)}
  <text class="chin-tick" x={x0+6} y={y0-10}>Loss (lower is better)</text>
  <text class="chin-tick" x={x1} y={y1+40} text-anchor="end">Model size (parameters)</text>
  <path d={curve} class="chin-curve"/>
  {real.map((m,i)=><g class="chin-real"><rect x={x(m.params)-6} y={y(m.params)-6} width="12" height="12"/><text x={x(m.params)} y={i%2?y(m.params)-34:y(m.params)-14} text-anchor="middle">{m.name}</text></g>)}
  <circle class="chin-best" cx={x(best)} cy={y(best)} r="9"/>
  <circle class="chin-pick" cx={x(pick)} cy={y(pick)} r="12"/>
 </svg><figcaption><span class="chin-key chin-key-best">Compute-optimal</span><span class="chin-key chin-key-pick">Your pick</span>{real.length>0&&<span class="chin-key chin-key-real">Published models</span>}</figcaption></figure>;
}

const start=maxLog;
export default function Chinchilla(){
 const touch=usePlayed('chinchilla');
 const [round,setRound]=useState(0);const [logN,setLogN]=useState(start);const [locked,setLocked]=useState(false);
 const [scores,setScores]=useState<number[]>([]);const [result,setResult]=useState<GameResult|null>(null);
 const budget=budgets[round]!,params=10**logN,tokens=tokensFor(budget.compute,params),best=optimalParams(budget.compute);
 const total=scores.reduce((a,b)=>a+b,0);
 const move=(value:number)=>{touch();setLogN(Math.min(maxLog,Math.max(minLog,Math.round(value*20)/20)));};
 const lock=()=>{touch();setLocked(true);setScores(s=>[...s,roundScore(params,budget.compute)]);};
 const next=()=>{
  if(round<budgets.length-1){setRound(round+1);setLogN(start);setLocked(false);return;}
  const stars=chinchillaStars(total),mine=scores[2]??0,beat=mine>gopherScore();
  setResult({slug:'chinchilla',stars,score:{value:total,max:300,label:'Score'},
   headline:beat?`I split Gopher’s budget better than Gopher did. ${total} / 300.`:`Gopher overspent, and so did I. ${total} / 300.`,
   detail:`On Gopher’s budget the best split is about ${formatCount(optimalParams(budgets[2]!.compute))} parameters. Gopher used 280B and scored ${gopherScore()} / 100 here.`,
   shareText:beat?`I beat DeepMind’s Gopher at splitting a training budget: ${total}/300 in the Chinchilla game.`:`I tried to split a training budget like Chinchilla: ${total}/300.`});
 };
 const replay=()=>{setRound(0);setLogN(start);setLocked(false);setScores([]);setResult(null);};
 const ratio=tokens/params;
 return <div class="later-game chin-game">
  <GoalBar goal="Split each compute budget between model size and training tokens to get the lowest loss." status={result?'Done':`Budget ${round+1} / 3`} score={{value:total,max:300,label:'Score'}}/>
  {result?<ResultCard result={result} onReplay={replay}/>:<>
   <div class="chin-budget"><strong>{budget.name}</strong> <span dir="ltr">{`${formatCompute(budget.compute)} FLOPs`}</span></div>
   <ExperimentVisual position={(logN-minLog)/(maxLog-minLog)} params={formatCount(params)} tokens={formatCount(tokens)}/>
   <div class="chin-readout"><span><b dir="ltr">{formatCount(params)}</b> parameters</span><span><b dir="ltr">{formatCount(tokens)}</b> training tokens</span><span><b dir="ltr">{ratio>=10?Math.round(ratio):ratio>=1?ratio.toFixed(1):ratio.toPrecision(1)}</b> tokens per parameter</span></div>
   <label class="chin-slider" for="chin-size"><span>Model size</span>
    <input id="chin-size" type="range" min={minLog} max={maxLog} step={0.05} value={logN} disabled={locked} aria-valuetext={`${formatCount(params)} parameters, ${formatCount(tokens)} tokens`} onInput={e=>move(+e.currentTarget.value)}/>
   </label>
   <div class="chin-actions">
    <button type="button" class="game-btn" disabled={locked||logN<=minLog} onClick={()=>move(logN-.05)}>Smaller model</button>
    <button type="button" class="game-btn" disabled={locked||logN>=maxLog} onClick={()=>move(logN+.05)}>Bigger model</button>
    {!locked&&<button type="button" class="game-btn is-primary" onClick={lock}>Lock in this split</button>}
   </div>
   {locked&&<div class="chin-reveal">
    <p class="chin-verdict" aria-live="polite"><strong>{`${scores[round]} / 100`}</strong> {`Best split: ${formatCount(best)} parameters on ${formatCount(tokensFor(budget.compute,best))} tokens, about ${Math.round(tokensFor(budget.compute,best)/best)} tokens per parameter.`}</p>
    <LossChart compute={budget.compute} pick={params} real={budget.real}/>
    {round===2&&<p class="chin-history">Gopher: 280B parameters, 300B tokens. Chinchilla: 70B parameters, 1.4T tokens. Same compute, and Chinchilla won.</p>}
    <button type="button" class="game-btn is-primary" onClick={next}>{round<2?'Next budget':'See my result'}</button>
   </div>}
  </>}
  <p class="toy-note">Loss uses the Chinchilla paper’s formula with the 2024 refit by Besiroglu et al. Real training runs vary.</p>
 </div>;
}
