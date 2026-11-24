import '../../i18n/preact';
import '../../styles/games/word-vectors.css';
import type {ComponentChildren} from 'preact';
import {useEffect,useMemo,useRef,useState} from 'preact/hooks';
import GoalBar from '../game/GoalBar';
import ResultCard,{type GameResult} from '../game/ResultCard';
import {markPlayed} from '../../lib/progress';
import {t,withSiteBase} from '../../i18n/core';
import {closeness,dayNumber,hintRank,normalizeGuess,parseVectors,practiceSecretFor,rankFrom,secretFor,shareStrip,tierOf,vectorStars,type VectorData} from './vector-game';
const slug='word-vectors';
type Guess={word:string;rank:number;sim:number;hint:boolean};
let cache:Promise<VectorData>|undefined;
function loadVectors(){
 cache??=Promise.all([fetch(withSiteBase('/data/early-vectors.json')).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.json();}),fetch(withSiteBase('/data/early-vectors.bin')).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.arrayBuffer();})]).then(([json,bin])=>parseVectors(json,bin));
 cache.catch(()=>{cache=undefined;});
 return cache;
}
const guessesText=(n:number)=>`${n} ${n===1?'guess':'guesses'}`;
// Messages carry this placeholder for the typed word, so the catalog can translate the sentence but never the word.
const SLOT='\uE000';
const withWord=(message:string,word:string)=><>{t(message).split(SLOT).map((part,i)=><>{i>0&&<bdi translate={false}>{word}</bdi>}{part}</>)}</>;
export default function VectorToy(){
 const [data,setData]=useState<VectorData|null>(null);
 const [failed,setFailed]=useState(false);
 const [day,setDay]=useState<number|null>(null);
 const [practice,setPractice]=useState(0);
 const [guesses,setGuesses]=useState<Guess[]>([]);
 const [input,setInput]=useState('');
 const [message,setMessage]=useState<ComponentChildren>('');
 const [gaveUp,setGaveUp]=useState(false);
 const [confirmGiveUp,setConfirmGiveUp]=useState(false);
 const played=useRef(false),field=useRef<HTMLInputElement>(null);
 const load=()=>{setFailed(false);loadVectors().then(setData,()=>setFailed(true));};
 useEffect(()=>{setDay(dayNumber(new Date()));load();},[]);
 const secret=day===null?'':practice?practiceSecretFor(day,practice):secretFor(day);
 const ranking=useMemo(()=>{const i=data?.index.get(secret);return data&&i!==undefined?rankFrom(data,i):null;},[data,secret]);
 const solved=guesses.some(g=>g.rank===0),over=solved||gaveUp;
 const best=guesses.length?Math.min(...guesses.map(g=>g.rank)):undefined;
 const touch=()=>{if(!played.current){played.current=true;markPlayed(slug);}};
 const add=(word:string,hint:boolean)=>{
  if(!data||!ranking)return;
  const i=data.index.get(word)!,g={word,rank:ranking.rank[i]!,sim:ranking.sims[i]!,hint};
  setGuesses(list=>[...list,g]);
  setMessage(withWord(g.rank===0?`${SLOT}: found it.`:`${SLOT}: closeness ${closeness(g.sim)}, #${g.rank}.`,word));
 };
 const submit=(e:Event)=>{
  e.preventDefault();if(!data||over)return;touch();
  const word=normalizeGuess(input,w=>data.index.has(w));
  if(!word){setMessage(input.trim()?withWord(`“${SLOT}” is not in the ${data.words.length.toLocaleString('en')}-word list.`,input.trim()):'Type a word first.');return;}
  setInput('');
  if(guesses.some(g=>g.word===word)){setMessage(withWord(`Already guessed “${SLOT}”.`,word));return;}
  add(word,false);
 };
 const hint=()=>{
  if(!data||!ranking||over)return;touch();
  let r=hintRank(best,data.words.length);
  while(r>1&&guesses.some(g=>g.rank===r))r--;
  if(guesses.some(g=>g.rank===r)){setMessage('You already have its nearest neighbour. The secret is very close to it.');return;}
  add(data.words[ranking.order[r]!]!,true);
 };
 const replay=()=>{setPractice(p=>p+1);setGuesses([]);setGaveUp(false);setConfirmGiveUp(false);setMessage('');setInput('');requestAnimationFrame(()=>field.current?.focus());};
 const label=practice?'practice':`#${day??0}`;
 const strip=shareStrip(guesses.map(g=>g.rank)),n=guesses.length;
 const neighbours=ranking&&data?ranking.order.slice(1,6).map(i=>data.words[i]!).join(', '):'';
 const result:GameResult={slug,headline:solved?`Solved in ${guessesText(n)}.`:`Gave up after ${guessesText(n)}.`,detail:`The word was “${secret}”. Its nearest neighbours: ${neighbours}.`,score:{value:n,label:'Guesses'},stars:vectorStars(solved,n),...(!solved&&n===0?{completed:false}:{}),shareText:solved?`Closest word ${label}: solved in ${guessesText(n)}. ${strip}`:`Closest word ${label}: gave up after ${guessesText(n)}. ${strip}`};
 const sorted=[...guesses].sort((a,b)=>a.rank-b.rank),latest=guesses.at(-1);
 const row=(g:Guess,extra='')=><li key={g.word+extra} class={`vector-guess is-${tierOf(g.rank)}${extra}`}>
  <span class="vector-word" dir="ltr" translate={false}>{g.word}</span>
  <span class="vector-close" dir="ltr">{closeness(g.sim)}</span>
  <span class="vector-rank" dir="ltr">{g.rank===0?'✓':`#${g.rank}`}</span>
  <span class="vector-bar" aria-hidden="true"><span style={`--value:${Math.max(0,g.sim)}`}/></span>
  {g.hint&&<span class="vector-hint-tag">hint</span>}
 </li>;
 return <div class="vector-game">
  <GoalBar goal="Find the secret word. Each guess shows how close its vector points to the secret's." status={day===null?'':practice?`Practice word · ${guessesText(n)}`:`Puzzle #${day} · ${guessesText(n)}`}/>
  {over?<>
   <ResultCard result={result} onReplay={replay}/>
   {guesses.length>0&&<ol class="vector-list" aria-label="Your guesses, closest first">{sorted.map(g=>row(g))}</ol>}
  </>:<>
   <form class="vector-form" onSubmit={submit}>
    <label class="vector-label" for="vector-guess">Your guess</label>
    <div class="vector-entry">
     <input id="vector-guess" ref={field} type="text" dir="ltr" lang="en" autocomplete="off" autocapitalize="none" spellcheck={false} enterkeyhint="go" maxLength={24} placeholder="Type a word" value={input} disabled={!data} onInput={e=>setInput(e.currentTarget.value)}/>
     <button type="submit" class="game-btn is-primary" disabled={!data}>Guess</button>
    </div>
   </form>
   <p class="vector-message" role="status">{failed?'The word vectors did not load.':!data?'Loading 5,006 word vectors…':message}</p>
   {failed&&<button type="button" class="game-btn" onClick={load}>Try again</button>}
   {latest&&<ol class="vector-list vector-latest" aria-hidden="true">{row(latest,' is-latest')}</ol>}
   {guesses.length>0&&<ol class="vector-list" aria-label="Your guesses, closest first">{sorted.map(g=>row(g))}</ol>}
   <div class="vector-tools">
    <button type="button" class="game-btn" disabled={!data||best===1} onClick={hint}>Hint (counts as a guess)</button>
    {confirmGiveUp?<button type="button" class="game-btn" onClick={()=>{touch();setGaveUp(true);}}>Reveal the word</button>:<button type="button" class="game-btn" disabled={!data} onClick={()=>setConfirmGiveUp(true)}>Give up</button>}
   </div>
   <p class="vector-key">Closeness is the cosine between two 50-number vectors, × 100. #1 is the secret’s nearest neighbour.</p>
  </>}
  <p class="toy-note">Real GloVe vectors (Stanford, 2014; public domain), a close cousin of word2vec, cut to 5,006 common words and stored as small integers.</p>
 </div>;
}
