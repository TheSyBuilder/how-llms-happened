import '../../i18n/preact';
import '../../styles/games/tokens.css';
import {useEffect,useState} from 'preact/hooks';
import {withSiteBase} from '../../i18n/core';
import {markPlayed} from '../../lib/progress';
import GoalBar from '../game/GoalBar';
import ResultCard,{type GameResult} from '../game/ResultCard';
import {tokenize,unpackVocab,type Token,type Vocab} from './bpe';
import {decodeWords,type WordList} from './words';

export const SLUG='tokens',LONG=10,MANY=6,BOARD=5;
type Entry={word:string;tokens:number};
const letters=(word:string)=>[...word].length;

// Challenge (a): one word of 10+ letters that GPT-2 reads, after a space, as a single token.
export function longCheck(word:string,vocab:Vocab){
 word=word.trim();
 if(!word)return {done:false,note:''};
 if(!/^\p{L}+$/u.test(word))return {done:false,note:'Use one word, letters only.'};
 const n=tokenize(` ${word}`,vocab).length;
 if(letters(word)<LONG)return {done:false,note:`${letters(word)} letters. It needs ${LONG} or more.`};
 if(n>1)return {done:false,note:`${n} tokens. Keep looking.`};
 return {done:true,note:'One token. GPT-2 saw this word so often that it earned its own number.'};
}
// Challenge (b): the leaderboard keeps the best distinct dictionary words.
export function addWord(board:Entry[],word:string,vocab:Vocab,words:WordList):{board:Entry[];note:string}{
 word=word.trim().toLowerCase();
 if(!/^[a-z]+$/.test(word))return {board,note:'One word, letters a–z only.'};
 if(!words.has(word))return {board,note:`“${word}” is not in the word list.`};
 const tokens=tokenize(` ${word}`,vocab).length;
 const next=[...board.filter(entry=>entry.word!==word),{word,tokens}].sort((a,b)=>b.tokens-a.tokens||a.word.length-b.word.length||a.word.localeCompare(b.word)).slice(0,BOARD);
 return {board:next,note:tokens===1?`“${word}” costs 1 token.`:`“${word}” costs ${tokens} tokens.`};
}
export function outcome(nameTokens:number,cleared:number):GameResult{
 return {slug:SLUG,stars:Math.min(3,cleared) as 0|1|2|3,
  headline:nameTokens===1?'Your name costs 1 token.':`Your name costs ${nameTokens} tokens.`,
  detail:`You cleared ${cleared} of 3 token challenges.`,
  score:{value:cleared,max:3,label:'Challenges'},
  shareText:nameTokens===1?'My name costs 1 token.':`My name costs ${nameTokens} tokens.`};
}
const visible=(text:string)=>text.replace(/ /g,'␣').replace(/\n/g,'↵').replace(/\t/g,'⇥');
// Typed text is set as HTML (escaped) so the page's translation hook never swaps a token for a translated word.
export const raw=(text:string)=>({__html:text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')});

function Chips({tokens,label}:{tokens:Token[];label:string}){
 return <ol class="tok-chips" aria-label={label} dir="ltr">
  {tokens.map((token,i)=><li class={`tok-chip${token.partial?' is-partial':''}`} style={`--tok:var(--tok-${i%5})`}>
   <span class="tok-text" translate={false} dangerouslySetInnerHTML={raw(token.partial?token.text:visible(token.text))}/><span class="tok-id">{token.id}</span>
  </li>)}
 </ol>;
}

export default function TokensGame(){
 const [vocab,setVocab]=useState<Vocab>();const [words,setWords]=useState<WordList>();const [failed,setFailed]=useState(false);
 const [name,setName]=useState('');const [long,setLong]=useState('');const [entry,setEntry]=useState('');
 const [board,setBoard]=useState<Entry[]>([]);const [boardNote,setBoardNote]=useState('');
 const [pick,setPick]=useState<number>();const [done,setDone]=useState({long:false,many:false,count:false});
 const [result,setResult]=useState(false);const [played,setPlayed]=useState(false);
 useEffect(()=>{
  let live=true;
  Promise.all([
   fetch(withSiteBase('/data/tokens-gpt2.bin')).then(r=>{if(!r.ok)throw new Error();return r.arrayBuffer();}),
   fetch(withSiteBase('/data/tokens-words.txt')).then(r=>{if(!r.ok)throw new Error();return r.text();}),
  ]).then(([bin,text])=>{if(live){setVocab(unpackVocab(bin));setWords(decodeWords(text));}}).catch(()=>live&&setFailed(true));
  return ()=>{live=false;};
 },[]);
 const touch=()=>{if(!played){setPlayed(true);markPlayed(SLUG);}};
 const nameTokens=vocab&&name?tokenize(name,vocab):[];
 const longTokens=vocab&&long.trim()?tokenize(` ${long.trim()}`,vocab):[];
 const entryTokens=vocab&&entry.trim()?tokenize(` ${entry.trim().toLowerCase()}`,vocab):[];
 const longState=vocab?longCheck(long,vocab):{done:false,note:''};
 useEffect(()=>{if(longState.done&&!done.long)setDone(d=>({...d,long:true}));},[longState.done]);
 const cleared=Number(done.long)+Number(done.many)+Number(done.count);
 const straw=vocab?tokenize(' strawberry',vocab):[];

 const submitWord=(event:Event)=>{
  event.preventDefault();if(!vocab||!words)return;touch();
  const next=addWord(board,entry,vocab,words);setBoard(next.board);setBoardNote(next.note);
  if((next.board[0]?.tokens??0)>=MANY&&!done.many)setDone(d=>({...d,many:true}));
 };
 const choose=(n:number)=>{touch();setPick(n);if(n===3&&!done.count)setDone(d=>({...d,count:true}));};
 const replay=()=>{setName('');setLong('');setEntry('');setBoard([]);setBoardNote('');setPick(undefined);setDone({long:false,many:false,count:false});setResult(false);};

 const n=nameTokens.length,status=!n?'Type your name to start':n===1?'Your name: 1 token':`Your name: ${n} tokens`;
 return <div class="tok-game">
  <GoalBar goal="Clear three token challenges, then see what your name costs." status={status} score={{value:cleared,max:3,label:'Challenges'}}/>
  {failed&&<p class="tok-error" role="alert">Could not load GPT-2’s vocabulary. Check your connection and reload the page.</p>}
  {!vocab&&!failed&&<p class="tok-loading" role="status">Loading GPT-2’s vocabulary…</p>}
  {result?<ResultCard result={outcome(nameTokens.length,cleared)} onReplay={replay}/>:<>
  <section class="tok-name" aria-labelledby="tok-name-title">
   <h3 id="tok-name-title">How many tokens is your name?</h3>
   <label class="tok-label" for="tok-name-input">Your name, or anything at all</label>
   <input id="tok-name-input" class="tok-input" dir="auto" autocomplete="off" maxLength={300} placeholder="Type your name" value={name} onInput={event=>{touch();setName((event.target as HTMLInputElement).value);}}/>
   <p class="tok-count" aria-live="polite"><b dir="ltr">{nameTokens.length}</b> {nameTokens.length===1?'token':'tokens'} <span>{letters(name)===1?'1 character':`${letters(name)} characters`}</span></p>
   <Chips tokens={nameTokens} label="Tokens in your name"/>
   <button type="button" class="game-btn is-primary tok-finish" disabled={!nameTokens.length} onClick={()=>setResult(true)}>See my result</button>
  </section>
  <ol class="tok-challenges">
   <li class={`tok-challenge${done.long?' is-done':''}`}>
    <h3><span class="tok-tick" aria-hidden="true">{done.long?'✓':'1'}</span>Find a word of 10 or more letters that is a single token.</h3>
    <p class="tok-hint">GPT-2 reads a word with the space in front of it, so this tests “ word”.</p>
    <input class="tok-input" lang="en" dir="ltr" autocomplete="off" aria-label="A long word" placeholder="A long word" value={long} onInput={event=>{touch();setLong((event.target as HTMLInputElement).value);}}/>
    <Chips tokens={longTokens} label="Tokens in your word"/>
    <p class="tok-note" aria-live="polite">{done.long&&!longState.done?'Challenge cleared.':longState.note}</p>
   </li>
   <li class={`tok-challenge${done.many?' is-done':''}`}>
    <h3><span class="tok-tick" aria-hidden="true">{done.many?'✓':'2'}</span>Find a real English word that costs 6 or more tokens.</h3>
    <form class="tok-row" onSubmit={submitWord}>
     <input class="tok-input" lang="en" dir="ltr" autocomplete="off" aria-label="A real English word" placeholder="A real English word" value={entry} onInput={event=>setEntry((event.target as HTMLInputElement).value)}/>
     <button type="submit" class="game-btn" disabled={!words||!entry.trim()}>Add</button>
    </form>
    <Chips tokens={entryTokens} label="Tokens in your word"/>
    <p class="tok-note" aria-live="polite">{boardNote}</p>
    {board.length>0&&<ol class="tok-board" aria-label="Your best words">{board.map(item=><li><span lang="en" dir="ltr" translate={false} dangerouslySetInnerHTML={raw(item.word)}/><b dir="ltr">{item.tokens}</b></li>)}</ol>}
    {done.many&&words&&<p class="tok-record">{`The record in this word list: “${words.meta.record.word}”, ${words.meta.record.tokens} tokens.`}</p>}
   </li>
   <li class={`tok-challenge${done.count?' is-done':''}`}>
    <h3><span class="tok-tick" aria-hidden="true">{done.count?'✓':'3'}</span>How many r’s are in “strawberry”?</h3>
    <div class="game-choices tok-choices" role="group" aria-label="Number of r’s">{[1,2,3,4].map(n=><button type="button" class={pick===n?(n===3?'is-right':'is-wrong'):''} onClick={()=>choose(n)}>{n}</button>)}</div>
    {pick!==undefined&&<div class="tok-reveal" aria-live="polite">
     <p class="tok-note">{pick===3?'Three. Easy for you, because you can see the letters.':'Not quite. Count the highlighted letters, then try again.'}</p>
     <div class="tok-sees"><span>What GPT-2 sees</span><Chips tokens={straw} label="GPT-2’s tokens for strawberry"/></div>
     <div class="tok-sees"><span>What you see</span><ol class="tok-letters" dir="ltr" aria-label="The letters of strawberry">{[...'strawberry'].map(c=><li class={c==='r'?'is-r':''}>{c}</li>)}</ol></div>
     <p>{straw.length===1?`GPT-2 reads “ strawberry” as one token, number ${straw[0]!.id}. The letters are not in its input at all, so to count the r’s a model has to have learned how that token is spelled.`:''}</p>
    </div>}
   </li>
  </ol>
  </>}
  <p class="toy-note">Real GPT-2 tokens, worked out in your browser from OpenAI’s published vocabulary. Newer models use larger vocabularies, so their counts differ.</p>
 </div>;
}
