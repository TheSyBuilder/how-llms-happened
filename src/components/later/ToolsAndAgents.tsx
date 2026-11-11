import '../../i18n/preact';
import '../../styles/games/tools-and-agents.css';
import {useState} from 'preact/hooks';
import GoalBar from '../game/GoalBar';
import ResultCard,{type GameResult} from '../game/ResultCard';
import {usePlayed} from './played';

export const PRICE=4300,RATE=150,SERVICE=1.1,MAX_CALLS=6;
export type Tool='search'|'calculator'|'converter';
export type Call={tool:Tool;input:string;output:string};
export type Agent={sets:number;calls:Call[];knowsPrice:boolean;yen:number[];usd:number[]};
export type Option={input:string;note?:string;output:string;effect:{price?:boolean;yen?:number;usd?:number}};
const yenText=(n:number)=>`¥${n.toLocaleString('en-US')}`;
export const correctYen=(sets:number)=>Math.round(sets*PRICE*SERVICE);
export const toUsd=(yen:number)=>Math.round(yen/RATE*100)/100;
export const correctUsd=(sets:number)=>toUsd(correctYen(sets));
// The no-tools model guesses a price and an exchange rate, then answers with confidence.
export const noToolsAnswer=(sets:number)=>Math.round(sets*3500*SERVICE/148*100)/100;
export const newAgent=(sets:number):Agent=>({sets,calls:[],knowsPrice:false,yen:[],usd:[]});
export function toolOptions(agent:Agent,tool:Tool):Option[]{
 if(tool==='search')return [
  {input:'Sushi Kanda omakase price',output:'Sushi Kanda menu: omakase set ¥4,300.',effect:{price:true}},
  {input:'yen to dollar rate',output:'About ¥150 to the dollar. The converter already uses this rate.',effect:{}},
  {input:'best sushi in Tokyo',output:'Ten lists of sushi bars. No prices.',effect:{}}
 ];
 const q=agent.sets;
 if(tool==='calculator')return agent.knowsPrice?[
  {input:`${q} × ¥4,300 × 1.10`,output:yenText(correctYen(q)),effect:{yen:correctYen(q)}},
  {input:`${q} × ¥4,300 + 10`,output:yenText(q*PRICE+10),effect:{yen:q*PRICE+10}},
  {input:'¥4,300 × 1.10',output:yenText(Math.round(PRICE*SERVICE)),effect:{yen:Math.round(PRICE*SERVICE)}}
 ]:[{input:`${q} × ¥3,500 × 1.10`,note:'Guessed price',output:yenText(Math.round(q*3500*SERVICE)),effect:{yen:Math.round(q*3500*SERVICE)}}];
 const amounts=[...new Set([...agent.yen,...(agent.knowsPrice?[PRICE]:[])])];
 return amounts.map(yen=>({input:`${yenText(yen)} → USD`,output:`$${toUsd(yen).toFixed(2)}`,effect:{usd:toUsd(yen)}}));
}
export function callTool(agent:Agent,tool:Tool,option:Option):Agent{
 if(agent.calls.length>=MAX_CALLS)return agent;
 const {price,yen,usd}=option.effect;
 return {...agent,calls:[...agent.calls,{tool,input:option.input,output:option.output}],knowsPrice:agent.knowsPrice||!!price,
  yen:yen===undefined||agent.yen.includes(yen)?agent.yen:[...agent.yen,yen],usd:usd===undefined||agent.usd.includes(usd)?agent.usd:[...agent.usd,usd]};
}
export const agentStars=(calls:number,correct:boolean):0|1|2|3=>!correct?0:calls<=3?3:calls===4?2:1;
const tools:{id:Tool;label:string}[]=[{id:'search',label:'Search'},{id:'calculator',label:'Calculator'},{id:'converter',label:'Converter'}];
// The first puzzle is fixed so the server and the first client render agree; Play again picks 2, 3 or 4 sets at random.
const FIRST_SETS=3,randomSets=()=>2+Math.floor(Math.random()*3);

export default function ToolsAndAgents(){
 const touch=usePlayed('tools-and-agents');
 const [agent,setAgent]=useState(()=>newAgent(FIRST_SETS));const [tool,setTool]=useState<Tool|'answer'|null>(null);
 const [result,setResult]=useState<GameResult|null>(null);
 const q=agent.sets,guess=noToolsAnswer(q),out=agent.calls.length>=MAX_CALLS;
 const finish=(answer:number|null,a:Agent=agent)=>{
  const right=correctUsd(a.sets),noTools=noToolsAnswer(a.sets),n=a.calls.length;
  const correct=answer!==null&&Math.abs(answer-right)<.005;
  setResult({slug:'tools-and-agents',stars:agentStars(n,correct),score:{value:n,max:MAX_CALLS,label:'Tool calls'},
   headline:correct?`I solved it in ${n} tool calls: $${right.toFixed(2)}. The no-tools model said $${noTools.toFixed(2)}.`:answer===null?`I ran out of steps. The no-tools model said $${noTools.toFixed(2)}, also wrong.`:`I answered $${answer.toFixed(2)}. The right answer was $${right.toFixed(2)}.`,
   detail:'The no-tools model guessed a price of ¥3,500 instead of looking it up. The fewest calls is 3: search, calculate, convert.',
   shareText:correct?`I played the AI agent: right answer in ${n} tool calls, while the no-tools model was confidently wrong.`:'I played the AI agent and got the bill wrong. Tools only help with the right inputs.'});
 };
 const use=(option:Option)=>{
  if(tool==='answer'||tool===null)return;touch();
  const next=callTool(agent,tool,option);setAgent(next);setTool(null);
  if(next.calls.length>=MAX_CALLS&&next.usd.length===0)finish(null,next);
 };
 const replay=()=>{setAgent(newAgent(randomSets()));setTool(null);setResult(null);};
 const options=tool&&tool!=='answer'?toolOptions(agent,tool):[];
 return <div class="later-game agent-game">
  <GoalBar goal="You are the agent. Work out the bill in US dollars with as few tool calls as you can." status={result?"Done":`${MAX_CALLS-agent.calls.length} calls left`} score={{value:agent.calls.length,max:MAX_CALLS,label:'Tool calls'}}/>
  {result?<ResultCard result={result} onReplay={replay}/>:<>
   <div class="agent-task">
    <div class="agent-receipt"><span class="agent-label">Task</span>
     <p>{`Dinner at Sushi Kanda in Tokyo: ${q} omakase sets plus a 10% service charge. What do you pay in US dollars?`}</p>
     <p class="agent-small">The receipt does not print the set price.</p></div>
    <div class="agent-rival"><span class="agent-label">No-tools model</span><p>{`“That comes to $${guess.toFixed(2)}.”`}</p><p class="agent-small">Instant and confident. Is it right?</p></div>
   </div>
   <div class="agent-tools" role="group" aria-label="Tools">
    {tools.map(item=><button type="button" class="game-btn" aria-pressed={tool===item.id} disabled={out} onClick={()=>{touch();setTool(tool===item.id?null:item.id);}}>{item.label}</button>)}
    <button type="button" class="game-btn is-primary" aria-pressed={tool==='answer'} onClick={()=>{touch();setTool(tool==='answer'?null:'answer');}}>Answer</button>
   </div>
   {tool&&tool!=='answer'&&(options.length?<div class="game-choices agent-options" role="group" aria-label="Tool input">{options.map(o=><button type="button" onClick={()=>use(o)}><code dir={tool==="search"?undefined:"ltr"}>{o.input}</code>{o.note&&<small>{o.note}</small>}</button>)}</div>:<p class="agent-hint">Nothing to convert yet. Get a yen amount first.</p>)}
   {tool==='answer'&&(agent.usd.length?<div class="game-choices agent-options" role="group" aria-label="Final answer">{agent.usd.map(v=><button type="button" onClick={()=>finish(v)}><span dir="ltr">{`$${v.toFixed(2)}`}</span></button>)}</div>:<p class="agent-hint">You have no dollar amount yet. Convert a yen total first.</p>)}
   <ol class="agent-trace" aria-label="Trace" aria-live="polite">
    {agent.calls.length===0&&<li class="agent-empty">Your actions and observations will appear here.</li>}
    {agent.calls.map(c=><li><span class="agent-label">{tools.find(x=>x.id===c.tool)!.label}</span><code dir={c.tool==="search"?undefined:"ltr"}>{c.input}</code><span class="agent-obs">{c.output}</span></li>)}
   </ol>
  </>}
  <p class="toy-note">The menu, prices and exchange rate are invented, and the tools run in your browser.</p>
 </div>;
}
