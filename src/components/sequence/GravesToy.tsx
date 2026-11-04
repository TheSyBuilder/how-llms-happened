import {useState} from 'preact/hooks';

export const toyText = 'the cat sat. the cat slept. the cat ran. the car rolled. the dog ran. the dog slept. ';
export const alphabet = [...new Set(toyText)].sort();
export const generationLimit = 80;
export function characterDistribution(text: string, temperature: number) {
  let context = '';
  for (let length = Math.min(3, text.length); length >= 1; length--) {
    const candidate = text.slice(-length);
    if (toyText.slice(0, -1).includes(candidate)) { context = candidate; break; }
  }
  const counts = alphabet.map(() => .05);
  for (let i = context.length; i < toyText.length; i++) {
    if (!context || toyText.slice(i - context.length, i) === context) counts[alphabet.indexOf(toyText[i]!)]!++;
  }
  const t = Math.max(.25, Math.min(2, temperature));
  const weights = counts.map(n => Math.pow(n, 1 / t));
  const total = weights.reduce((a,b) => a+b, 0);
  return {context, probabilities: alphabet.map((char,i) => ({char, p:weights[i]! / total}))};
}
export type Generation = {text:string; seed:number; generated:number; last:string};
export function freshGeneration(prefix = 'the ca'): Generation { return {text:prefix,seed:42,generated:0,last:''}; }
export function sampleCharacter(state: Generation, temperature: number): Generation {
  if (state.generated >= generationLimit) return state;
  const seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
  const draw = seed / 4294967296;
  const distribution = characterDistribution(state.text, temperature).probabilities;
  let cumulative = 0, char = distribution.at(-1)!.char;
  for (const candidate of distribution) { cumulative += candidate.p; if (draw < cumulative) { char=candidate.char; break; } }
  return {text:state.text+char, seed, generated:state.generated+1, last:char};
}
const displayChar = (char:string) => char === ' ' ? 'space' : char;
export default function GravesToy() {
  const [state,setState] = useState(() => freshGeneration());
  const [temperature,setTemperature] = useState(1);
  const distribution = characterDistribution(state.text, temperature);
  const top = [...distribution.probabilities].sort((a,b) => b.p-a.p).slice(0,4);
  const sample = (n:number) => setState(previous => { let next=previous; for(let i=0;i<n;i++) next=sampleCharacter(next,temperature); return next; });
  return <div class="early-toy generation-toy">
    <div class="toy-topline"><span class="eyebrow">Predict → pick → feed back</span><span class="toy-label">Toy · tiny count predictor</span></div>
    <div class="generation-paper" aria-label="Generated text"><span>{state.text.slice(0,-1)}</span><b>{state.text.slice(-1)}</b><span class="generation-cursor" aria-hidden="true">▏</span></div>
    <p class="sequence-status" role="status">{state.generated ? `Picked “${displayChar(state.last)}”. It is now part of the input.` : 'Start with “the ca”. What comes next?'} <span>{state.generated} / {generationLimit} characters</span></p>
    <div class="early-buttons"><button class="early-primary" disabled={state.generated>=generationLimit} onClick={()=>sample(1)}>Sample one character</button><button disabled={state.generated>=generationLimit} onClick={()=>sample(12)}>Sample twelve</button><button onClick={()=>setState(freshGeneration())}>Restart same draw sequence</button></div>
    <label class="early-label" for="generation-temperature">Temperature <output>{temperature.toFixed(2)}</output></label>
    <input id="generation-temperature" type="range" min=".25" max="2" step=".05" value={temperature} onInput={e=>setTemperature(Number(e.currentTarget.value))}/>
    <div class="early-ends"><span>Favour the likely</span><span>Spread the chances</span></div>
    <div class="character-chances" aria-label="Most likely next characters">{top.map(item=><div key={item.char}><span>{displayChar(item.char)}</span><div class="early-bar"><span style={{width:`${item.p*100}%`}}/></div><output>{(item.p*100).toFixed(1)}%</output></div>)}</div>
    <p class="early-small">Current context: <code>“{distribution.context || 'none'}”</code>. Other characters share {((1-top.reduce((sum,item)=>sum+item.p,0))*100).toFixed(1)}%. Temperature changes the next draw, not text already printed.</p>
    <details class="sequence-inside"><summary>Inside this toy</summary><p>The predictor counts following characters after the longest matching suffix of up to three characters, adds 0.05 to every count, then raises counts to 1/T and normalizes. It uses the six short sentences below, not an LSTM. The sampling loop is the idea illustrated. A repeatable random sequence makes temperature comparisons possible.</p><p class="toy-corpus">{toyText}</p></details>
  </div>;
}
