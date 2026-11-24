import '../../i18n/preact';
import '../../styles/games/graves.css';
import {useRef,useState} from 'preact/hooks';
import GoalBar from '../game/GoalBar';
import ResultCard,{type GameResult} from '../game/ResultCard';
import {markPlayed} from '../../lib/progress';

export const sampleText=`Coffee first, then the inbox. That is the only rule I keep.
The cat sat on my keyboard again and sent a very short email.
I wanted to read one paper tonight and now I have eleven tabs open.
Small wins today: the code ran, the tea was hot, the bus was on time.
Every time I clean my desk I lose the one note I needed.
Reading old papers is like finding a map someone drew before the roads.
The best ideas show up in the shower and leave before the towel.
My plants are doing great because I forgot about them for a week.`;
export const minChars=200, maxChars=6000, order=4, triesPerGame=8, minWords=6, maxLineChars=140;
// Interpolation weights from the longest context (4 characters) down to none.
const mix=[.9,.7,.7,.7,1];
type Counts={total:number;next:Map<string,number>};
export type CharModel={table:Map<string,Counts>;starts:string[];vocab:Set<string>;chars:number};
export const wordsOf=(text:string)=>text.match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}]*(?:['’][\p{L}\p{N}][\p{L}\p{M}\p{N}]*)*/gu)??[];
/** "Training" counts which character follows each context of up to four characters. */
export function trainCharModel(raw:string):CharModel {
  // Code points, so an emoji is one symbol and is never cut in half.
  const chars=Array.from(raw.replace(/\r\n?/g,'\n')).slice(0,maxChars),text=chars.join('');
  const table=new Map<string,Counts>();
  for(let i=0;i<chars.length;i++)for(let k=0;k<=order&&k<=i;k++){
    const context=chars.slice(i-k,i).join('');let counts=table.get(context);
    if(!counts)table.set(context,counts={total:0,next:new Map()});
    counts.total++;counts.next.set(chars[i]!,(counts.next.get(chars[i]!)??0)+1);
  }
  const starts=[...text.matchAll(/(?:^|[.!?]\s+|\n)\s*([\p{L}\p{N}][\p{L}\p{M}\p{N}'’]*)/gu)].map(match=>match[1]!);
  return {table,starts:starts.length?starts:wordsOf(text).slice(0,1),vocab:new Set(wordsOf(text).map(word=>word.toLowerCase())),chars:chars.length};
}
/** Next-character probabilities: longer contexts first, with the leftover weight passed to shorter ones. */
export function nextDistribution(model:CharModel,context:string):[string,number][] {
  const p=new Map<string,number>(),recent=Array.from(context).slice(-order);let used=0;
  for(let k=recent.length;k>=0;k--){
    const counts=model.table.get(recent.slice(recent.length-k).join(''));if(!counts)continue;
    const weight=mix[order-k]!*(1-used);
    for(const [char,n] of counts.next)p.set(char,(p.get(char)??0)+weight*n/counts.total);
    used+=weight;
  }
  const total=used||1;return [...p].map(([char,q])=>[char,q/total]);
}
export function withTemperature(distribution:[string,number][],temperature:number):[string,number][] {
  const weights=distribution.map(([char,p])=>[char,Math.pow(p,1/temperature)] as [string,number]);
  const total=weights.reduce((sum,[,w])=>sum+w,0);
  return weights.map(([char,w])=>[char,w/total]);
}
export function random(seed:number){let s=seed>>>0;return ()=>{s=(s+0x6d2b79f5)>>>0;let t=Math.imul(s^(s>>>15),1|s);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};}
/** Start from a word that opens one of your lines, then sample a character at a time and feed it back in. */
export function generateLine(model:CharModel,temperature:number,seed:number):string {
  const draw=random(seed);
  let line=`${model.starts[Math.floor(draw()*model.starts.length)]??''} `;
  for(let length=Array.from(line).length;length<maxLineChars;length++){
    const choices=withTemperature(nextDistribution(model,line),temperature);
    let r=draw(),char=choices.at(-1)?.[0]??'\n';
    for(const [candidate,p] of choices){r-=p;if(r<0){char=candidate;break;}}
    if(char==='\n')break;
    line+=char;
    if(/[.!?]/.test(char))break;
  }
  return line.replace(/\s+/g,' ').trim();
}
export function checkLine(model:CharModel,line:string){
  const words=wordsOf(line).map(word=>({word,real:model.vocab.has(word.toLowerCase())}));
  return {words,count:words.length,invented:words.filter(item=>!item.real).map(item=>item.word),allReal:words.every(item=>item.real)};
}
export function lineStars(count:number,temperature:number,allReal:boolean):0|1|2|3 {
  if(!allReal||count<minWords)return 0;
  return temperature>=1.2&&count>=8?3:temperature>=1?2:1;
}
export type Attempt={line:string;temperature:number;count:number;invented:string[];stars:0|1|2|3};
/** Best line: most stars, then more words, then a hotter temperature. */
export function bestAttempt(attempts:Attempt[]):Attempt|undefined {
  const realShare=(a:Attempt)=>a.count?(a.count-a.invented.length)/a.count:0;
  return [...attempts].sort((a,b)=>b.stars-a.stars||(b.stars?b.count-a.count:realShare(b)-realShare(a))||b.temperature-a.temperature)[0];
}
export const quote=(line:string,limit=90)=>{const chars=Array.from(line);return chars.length>limit?`${chars.slice(0,limit-1).join('').trimEnd()}…`:line;};
const temp=(t:number)=>t.toFixed(1);
// Rendering the sentence with a placeholder lets the i18n hook translate it without ever looking up the typed words.
const SLOT='\uE000';
const withWords=(sentence:string,words:string)=><>{String((<span>{sentence}</span>).props.children).split(SLOT).map((part,i)=><>{i>0&&<bdi translate={false}>{words}</bdi>}{part}</>)}</>;

export default function GravesToy() {
  const [text,setText]=useState(sampleText);
  const [model,setModel]=useState<CharModel|null>(null);
  const [temperature,setTemperature]=useState(.6);
  const [attempts,setAttempts]=useState<Attempt[]>([]);
  const [done,setDone]=useState(false);
  const played=useRef(false);
  const touch=()=>{if(!played.current){played.current=true;markPlayed('graves');}};
  const enough=text.trim().length>=minChars;
  const train=()=>{touch();setModel(trainCharModel(text));setAttempts([]);};
  const write=()=>{
    if(!model)return;touch();
    const line=generateLine(model,temperature,Math.floor(Math.random()*4294967296));
    const check=checkLine(model,line);
    const next=[...attempts,{line,temperature,count:check.count,invented:check.invented,stars:lineStars(check.count,temperature,check.allReal)}];
    setAttempts(next);
    if(next.length>=triesPerGame)setDone(true);
  };
  const replay=()=>{setAttempts([]);setDone(false);};
  const latest=attempts.at(-1);
  const best=bestAttempt(attempts);
  const winning=best&&best.stars>0;
  const result:GameResult|null=best?{
    slug:'graves',
    headline:winning?`My bot wrote ${best.count} real words at temperature ${temp(best.temperature)}.`:'My bot never wrote a fully real line.',
    detail:`“${quote(best.line,140)}”`,
    ...(winning?{score:{value:best.count,label:'Real words'}}:{}),
    stars:best.stars,
    shareText:winning?`My bot, trained on my own text, says: “${quote(best.line)}” (${best.count} real words at temperature ${temp(best.temperature)})`:`My bot, trained on my own text, mumbled: “${quote(best.line)}”`,
  }:null;

  return <div class="graves-game">
    <GoalBar goal={`Train a bot on your text. Find a temperature where it writes a line of ${minWords}+ words, every one a real word from your text.`} status={!model?'Not trained yet':done?'Finished':`Line ${attempts.length} / ${triesPerGame}`} {...(model&&best?{score:{value:best.stars,max:3,label:'Best stars'}}:{})}/>
    {done&&result?<ResultCard result={result} onReplay={replay}/>:!model?<div class="graves-train">
      <label class="graves-label" for="graves-text">Paste a few of your posts or a paragraph you wrote</label>
      <textarea id="graves-text" dir="auto" translate={false} rows={8} maxLength={maxChars} value={text} onInput={e=>setText(e.currentTarget.value)}/>
      <p class="graves-count"><span dir="ltr">{`${text.length} / ${maxChars}`}</span> characters{enough?'':` · at least ${minChars} needed`}</p>
      <div class="graves-actions">
        <button type="button" class="game-btn is-primary" disabled={!enough} onClick={train}>Train my bot</button>
        <button type="button" class="game-btn" disabled={text===sampleText} onClick={()=>setText(sampleText)}>Use the sample</button>
      </div>
    </div>:<div class="graves-play">
      <p class="graves-stats">{`Trained on ${model.chars} characters and ${model.vocab.size} different words.`} <button type="button" class="graves-link" onClick={()=>{setModel(null);setAttempts([]);}}>Change text</button></p>
      <label class="graves-label" for="graves-temperature">Temperature <output dir="ltr">{temp(temperature)}</output></label>
      <input id="graves-temperature" class="graves-range" type="range" min=".2" max="2" step=".1" value={temperature} onInput={e=>{touch();setTemperature(Number(e.currentTarget.value));}}/>
      <div class="graves-ends"><span>Safe copying</span><span>Wild guesses</span></div>
      <p class="graves-hint">★ any real line · ★★ at 1.0 or hotter · ★★★ at 1.2 or hotter with 8+ words</p>
      <div class="graves-actions">
        <button type="button" class="game-btn is-primary" onClick={write}>Write a line</button>
        {winning&&<button type="button" class="game-btn" onClick={()=>setDone(true)}>Finish with my best line</button>}
      </div>
      <div class="graves-paper" aria-live="polite">
        {latest?<>
          <p class="graves-line" dir="auto" translate={false}>{latest.line.split(/(\s+)/).map((piece,i)=>{const bad=wordsOf(piece).some(word=>latest.invented.includes(word));return bad?<mark key={i} translate={false}>{piece}</mark>:piece;})}</p>
          <p class="graves-verdict">{latest.stars?`${latest.count} real words at ${temp(latest.temperature)}. ${'★'.repeat(latest.stars)}`:latest.invented.length?withWords(`Invented: ${SLOT}`,latest.invented.slice(0,4).join(', ')):`Only ${latest.count} words. It needs ${minWords}.`}</p>
        </>:<p class="graves-empty">Your bot’s lines appear here.</p>}
      </div>
      {attempts.length>1&&<ol class="graves-history" aria-label="Earlier lines">{attempts.slice(0,-1).reverse().map((attempt,i)=><li key={i}><span dir="ltr">{temp(attempt.temperature)}</span> <span dir="auto" translate={false}>{quote(attempt.line,60)}</span> <b aria-label={`${attempt.stars} stars`}>{'★'.repeat(attempt.stars)||'·'}</b></li>)}</ol>}
    </div>}
    <p class="toy-note">Your bot is a small letter counter trained in this tab, not Graves’s LSTM, but it writes with the same loop: predict, pick, feed back. Your text never leaves the page.</p>
  </div>;
}
