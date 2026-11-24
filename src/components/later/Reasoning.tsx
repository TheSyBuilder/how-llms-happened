import '../../i18n/preact';
import '../../styles/games/reasoning.css';
import {useEffect,useRef,useState} from 'preact/hooks';
import GoalBar from '../game/GoalBar';
import ResultCard,{type GameResult} from '../game/ResultCard';
import {useGameActive} from '../game/useGameActive';
import {usePlayed} from './played';

export const SECONDS=45;
export type Op={label:string;kind:'+'|'×'|'−';by:number};
const op=(label:string):Op=>({label,kind:label[0] as Op['kind'],by:Number(label.slice(1))});
export const applyOp=(value:number,o:Op)=>o.kind==='+'?value+o.by:o.kind==='×'?value*o.by:value-o.by;
// Each puzzle has exactly one sequence of moves that lands on the target.
export const puzzles=[
 {start:2,target:10,moves:2,ops:['+3','×2','−1'].map(op)},
 {start:3,target:19,moves:3,ops:['+4','×3','−2'].map(op)},
 {start:4,target:36,moves:4,ops:['+5','×2','−3'].map(op)}
];
export type Puzzle=typeof puzzles[number];
export const solutions=(p:Puzzle)=>{
 const out:string[][]=[];
 const walk=(v:number,path:string[])=>{if(path.length===p.moves){if(v===p.target)out.push(path);return;}for(const o of p.ops)walk(applyOp(v,o),[...path,o.label]);};
 walk(p.start,[]);return out;
};
export const treeSize=(p:Puzzle)=>(p.ops.length**(p.moves+1)-1)/(p.ops.length-1);
// Depth-first search in button order: go deeper, check at the last move, back up from dead ends, stop at the first hit.
export type SearchNode={id:number;parent:number;depth:number;value:number;onPath:boolean};
export function depthFirst(p:Puzzle):SearchNode[]{
 const nodes:SearchNode[]=[];
 const visit=(value:number,depth:number,parent:number):boolean=>{
  const id=nodes.length;nodes.push({id,parent,depth,value,onPath:false});
  const hit=depth===p.moves?value===p.target:p.ops.some(o=>visit(applyOp(value,o),depth+1,id));
  if(hit)nodes[id]!.onPath=true;return hit;
 };
 visit(p.start,0,-1);return nodes;
}
export const puzzlePoints=(solved:boolean,remaining:number)=>solved?50+Math.round(Math.min(SECONDS,Math.max(0,remaining))):0;
export const reasoningStars=(solved:number,points:number):0|1|2|3=>solved===3&&points>=200?3:solved===3?2:solved>=1?1:0;

function SearchTree({puzzle}:{puzzle:Puzzle}){
 const nodes=depthFirst(puzzle),x=new Map<number,number>();let leaf=0;
 const place=(id:number):number=>{const kids=nodes.filter(n=>n.parent===id);const v=kids.length?kids.map(k=>place(k.id)).reduce((a,b)=>a+b)/kids.length:leaf++;x.set(id,v);return v;};
 place(0);
 const W=480,pad=24,rowH=(176-pad)/puzzle.moves,sx=(id:number)=>pad+(leaf>1?(x.get(id)!/(leaf-1))*(W-pad*2):(W-pad*2)/2),sy=(d:number)=>pad+d*rowH;
 return <figure class="rs-tree" dir="ltr"><svg viewBox={`0 0 ${W} 200`} role="img" aria-label={`A depth-first search checked ${nodes.length} of ${treeSize(puzzle)} possible states.`}>
  {nodes.filter(n=>n.parent>=0).map(n=><line x1={sx(n.parent)} y1={sy(n.depth-1)} x2={sx(n.id)} y2={sy(n.depth)} class={n.onPath?'rs-edge is-path':'rs-edge'}/>)}
  {nodes.map(n=>n.onPath||n.depth===0?<g><circle cx={sx(n.id)} cy={sy(n.depth)} r="12" class="rs-node is-path"/><text x={sx(n.id)} y={sy(n.depth)+5} text-anchor="middle">{n.value}</text></g>:<circle cx={sx(n.id)} cy={sy(n.depth)} r={n.depth===puzzle.moves?4:5} class="rs-node"/>)}
 </svg><figcaption>{`Depth-first search checked ${nodes.length} of ${treeSize(puzzle)} possible states before it found the path.`}</figcaption></figure>;
}

export default function Reasoning(){
 const touch=usePlayed('reasoning');
 const [index,setIndex]=useState(-1);const [path,setPath]=useState<Op[]>([]);
 const [status,setStatus]=useState<'play'|'solved'|'timeout'>('play');const [remaining,setRemaining]=useState(SECONDS);
 const [points,setPoints]=useState(0);const [solved,setSolved]=useState(0);const [gain,setGain]=useState(0);
 const [result,setResult]=useState<GameResult|null>(null);
 const clock=useRef({elapsed:0,last:0}),root=useRef<HTMLDivElement>(null),active=useGameActive(root);
 const puzzle=index>=0?puzzles[index]!:null;
 const value=puzzle?path.reduce(applyOp,puzzle.start):0;
 useEffect(()=>{
  if(!puzzle||status!=='play'||!active)return undefined;
  clock.current.last=performance.now();
  const timer=setInterval(()=>{
   const now=performance.now();clock.current.elapsed+=Math.min(.25,(now-clock.current.last)/1000);clock.current.last=now;
   const left=SECONDS-clock.current.elapsed;setRemaining(Math.max(0,left));if(left<=0)setStatus('timeout');
  },100);
  // Charge the part of a tick played before a pause, so pausing never adds time.
  return ()=>{clearInterval(timer);clock.current.elapsed+=Math.min(.25,(performance.now()-clock.current.last)/1000);};
 },[index,status,active]);
 const begin=(i:number)=>{clock.current.elapsed=0;setIndex(i);setPath([]);setStatus('play');setRemaining(SECONDS);};
 const press=(o:Op)=>{
  if(!puzzle||status!=='play'||path.length>=puzzle.moves)return;touch();
  const next=[...path,o];setPath(next);
  if(next.length===puzzle.moves&&next.reduce(applyOp,puzzle.start)===puzzle.target){
   const won=puzzlePoints(true,SECONDS-clock.current.elapsed);setGain(won);setPoints(p=>p+won);setSolved(s=>s+1);setStatus('solved');
  }
 };
 const finish=()=>{
  const stars=reasoningStars(solved,points);
  setResult({slug:'reasoning',stars,score:{value:points,max:285,label:'Points'},
   headline:solved===3?`I solved all 3 number puzzles with ${points} points.`:`I solved ${solved} of 3 number puzzles.`,
   detail:'A blind search checked dozens of dead ends on the last puzzle. Reasoning models spend that kind of effort in text before they answer.',
   shareText:solved===3?`I beat the clock on all 3 search puzzles: ${points} points. Thinking time is a budget too.`:`I solved ${solved} of 3 search puzzles against the clock. Thinking time is a budget too.`});
 };
 const replay=()=>{setIndex(-1);setPath([]);setStatus('play');setRemaining(SECONDS);setPoints(0);setSolved(0);setResult(null);};
 const left=Math.ceil(remaining),done=puzzle&&path.length===puzzle.moves&&status==='play';
 return <div class="later-game rs-game" ref={root}>
  <GoalBar goal="Reach the target number using exactly the moves allowed, before the clock runs out." status={result?'Done':index<0?'Ready':`Puzzle ${index+1} / 3`} score={{value:points,max:285,label:'Points'}}/>
  {result?<ResultCard result={result} onReplay={replay}/>:!puzzle?<div class="rs-intro"><p>Three puzzles, 45 seconds each. Undo is free. Only one path works.</p><button type="button" class="game-btn is-primary" onClick={()=>{touch();begin(0);}}>Start</button></div>:<>
   <div class="rs-board">
    <span class={`game-timer${status==='play'&&left<=10?' is-low':''}`} role="timer" aria-label={`${left} seconds left`}>{`0:${String(left).padStart(2,'0')}`}</span>
    <div class="rs-numbers" dir="ltr"><span><small>From</small><b>{puzzle.start}</b></span><span class="rs-now"><small>Now</small><b>{value}</b></span><span><small>Target</small><b>{puzzle.target}</b></span></div>
    <p class="rs-moves">{`Exactly ${puzzle.moves} moves · ${puzzle.moves-path.length} left`}</p>
    <ol class="rs-path" dir="ltr" aria-label="Your moves">{path.map(o=><li>{o.label}</li>)}{Array.from({length:puzzle.moves-path.length},()=><li class="is-empty" aria-hidden="true"/>)}</ol>
    <div class="rs-ops" role="group" aria-label="Moves">{puzzle.ops.map(o=><button type="button" class="game-btn" dir="ltr" disabled={status!=='play'||path.length>=puzzle.moves} onClick={()=>press(o)}>{o.label}</button>)}
     <button type="button" class="game-btn" disabled={status!=='play'||!path.length} onClick={()=>setPath(path.slice(0,-1))}>Undo</button></div>
    <p class="rs-message" aria-live="polite">{status==='solved'?`Solved. +${gain}`:status==='timeout'?`Time’s up. The path was ${solutions(puzzle)[0]!.join(' ')}.`:done?`That ends at ${value}, not ${puzzle.target}. Undo and try another path.`:''}</p>
   </div>
   {status!=='play'&&<div class="rs-reveal"><SearchTree puzzle={puzzle}/><button type="button" class="game-btn is-primary" onClick={()=>index<2?begin(index+1):finish()}>{index<2?'Next puzzle':'See my result'}</button></div>}
  </>}
  <p class="toy-note">The tree is a plain depth-first search. o1 and R1 learned to try, check and back up in written reasoning; they do not draw a tree like this.</p>
 </div>;
}
