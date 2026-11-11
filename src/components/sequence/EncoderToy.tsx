import '../../i18n/preact';
import '../../styles/games/sequence-to-sequence.css';
import {useRef,useState} from 'preact/hooks';
import GoalBar from '../game/GoalBar';
import ResultCard,{type GameResult} from '../game/ResultCard';
import {markPlayed} from '../../lib/progress';

export type Slot='size'|'colour'|'who'|'action'|'object'|'place'|'time';
export const slotOrder:Slot[]=['size','colour','who','action','object','place','time'];
export type Sentence=Partial<Record<Slot,string>>;
export const noteSize=3;
export const sentences:Sentence[]=[
  {colour:'red',who:'fox',action:'runs',time:'at night'},
  {colour:'grey',who:'cat',action:'swims',place:'in the lake',time:'today'},
  {size:'small',colour:'brown',who:'dog',action:'barks',object:'at the mail carrier',time:'on Monday'},
];
// The decoder's habits: when the note is silent, it writes what usually goes with what it already has.
const whoFromAction:Record<string,string>={barks:'dog',runs:'fox'};
const actionFromWho:Record<string,string>={fox:'runs',dog:'barks',cat:'sleeps'};
const colourFromWho:Record<string,string>={fox:'red'};
const placeFromAction:Record<string,string>={sleeps:'on the mat',swims:'in the lake'};
const objectFromAction:Record<string,string>={barks:'at the mail carrier'};
export type Written={slot:Slot;value?:string;from:'note'|'guess'};
/** The encoder keeps only the packed slots; the decoder rebuilds the rest from its habits, in sentence order. */
export function decodeNote(sentence:Sentence,packed:Slot[]):Written[] {
  const note:Sentence={};for(const slot of packed.slice(0,noteSize))if(sentence[slot])note[slot]=sentence[slot];
  const out:Partial<Record<Slot,string|undefined>>={...note};
  out.who??=whoFromAction[note.action??'']??'cat';
  out.action??=actionFromWho[out.who];
  out.colour??=colourFromWho[out.who];
  out.place??=placeFromAction[out.action??''];
  out.object??=objectFromAction[out.action??''];
  return slotOrder.filter(slot=>out[slot]!==undefined||sentence[slot]!==undefined).map(slot=>{
    const value=out[slot];
    return value===undefined?{slot,from:'guess'}:{slot,value,from:note[slot]?'note':'guess'};
  });
}
export function survivors(sentence:Sentence,packed:Slot[]) {
  return decodeNote(sentence,packed).filter(item=>item.value!==undefined&&item.value===sentence[item.slot]).length;
}
export const factCount=(sentence:Sentence)=>slotOrder.filter(slot=>sentence[slot]).length;
/** The best any choice of three facts can do (the third sentence cannot keep everything). */
export function bestSurvivors(sentence:Sentence) {
  const facts=slotOrder.filter(slot=>sentence[slot]);let best=0;
  for(let a=0;a<facts.length;a++)for(let b=a+1;b<facts.length;b++)for(let c=b+1;c<facts.length;c++)best=Math.max(best,survivors(sentence,[facts[a]!,facts[b]!,facts[c]!]));
  return best;
}
export const maxTotal=sentences.reduce((sum,sentence)=>sum+bestSurvivors(sentence),0);
export const factTotal=sentences.reduce((sum,sentence)=>sum+factCount(sentence),0);
export function telephoneStars(total:number):0|1|2|3 {return total>=maxTotal?3:total>=maxTotal-1?2:total>=maxTotal-3?1:0;}
export const sentenceText=(sentence:Sentence)=>`The ${slotOrder.flatMap(slot=>sentence[slot]?[sentence[slot]]:[]).join(' ')}.`;

export default function EncoderToy() {
  const [round,setRound]=useState(0);
  const [packed,setPacked]=useState<Slot[]>([]);
  const [sent,setSent]=useState(false);
  const [total,setTotal]=useState(0);
  const [done,setDone]=useState(false);
  const played=useRef(false);
  const touch=()=>{if(!played.current){played.current=true;markPlayed('sequence-to-sequence');}};
  const sentence=sentences[round]!;
  const facts=slotOrder.filter(slot=>sentence[slot]);
  const written=decodeNote(sentence,packed);
  const kept=survivors(sentence,packed);
  const last=round===sentences.length-1;
  const toggle=(slot:Slot)=>{touch();setPacked(list=>list.includes(slot)?list.filter(s=>s!==slot):list.length<noteSize?[...list,slot]:list);};
  const send=()=>{touch();setSent(true);setTotal(t=>t+kept);};
  const next=()=>{if(last){setDone(true);return;}setRound(r=>r+1);setPacked([]);setSent(false);};
  const replay=()=>{setRound(0);setPacked([]);setSent(false);setTotal(0);setDone(false);};
  const stars=telephoneStars(total);
  const result:GameResult={
    slug:'sequence-to-sequence',
    headline:`${total} of ${factTotal} facts made it through a three-fact note.`,
    detail:total>=maxTotal?`That is the most possible: no packing saves the last sentence whole. The decoder fills gaps with what usually goes together.`:`The best possible is ${maxTotal}. Pack the facts the decoder could never guess, and let it fill in the usual ones.`,
    score:{value:total,max:factTotal,label:'Facts kept'},
    stars,
    shareText:`I squeezed ${total} of ${factTotal} facts through a 2014 sequence-to-sequence bottleneck. What would you pack?`,
  };
  return <div class="s2s-game">
    <GoalBar goal="Pack three facts into the note so the decoder rebuilds as much of the sentence as it can." status={done?'Finished':`Sentence ${round+1} / ${sentences.length}`} score={{value:total,max:factTotal,label:'Facts kept'}}/>
    {done?<ResultCard result={result} onReplay={replay}/>:<>
      <p class="s2s-source"><span>The encoder reads</span> <strong dir="ltr" lang="en">{sentenceText(sentence)}</strong></p>
      <div class="s2s-facts" role="group" aria-label="Facts to pack" dir="ltr" lang="en">
        {facts.map(slot=><button type="button" key={slot} aria-pressed={packed.includes(slot)} disabled={sent||(!packed.includes(slot)&&packed.length>=noteSize)} onClick={()=>toggle(slot)}>{sentence[slot]}</button>)}
      </div>
      <div class="s2s-note" role="group" aria-label={`Note: ${packed.length} of ${noteSize} facts packed`}>
        <span class="s2s-note-label">The note</span>
        {Array.from({length:noteSize},(_,i)=><span class={`s2s-note-slot ${packed[i]?'is-full':''}`} key={i} dir="ltr" lang="en">{packed[i]?sentence[packed[i]!]:'…'}</span>)}
      </div>
      {sent&&<div class="s2s-rebuilt">
        <p class="s2s-rebuilt-label">The decoder writes</p>
        <p class="s2s-rebuilt-line" dir="ltr" lang="en">The {written.map(item=>{
          const right=item.value!==undefined&&item.value===sentence[item.slot];
          const cls=item.value===undefined?'is-lost':!right?'is-wrong':item.from==='note'?'is-note':'is-guess';
          return <span class={`s2s-word ${cls}`} key={item.slot}>{item.value??sentence[item.slot]}</span>;
        })}.</p>
        <ul class="s2s-key"><li><span class="s2s-word is-note">from the note</span></li><li><span class="s2s-word is-guess">guessed right</span></li><li><span class="s2s-word is-wrong">guessed wrong</span></li><li><span class="s2s-word is-lost">lost</span></li></ul>
      </div>}
      <p class="s2s-feedback" aria-live="polite">{sent?`${kept} of ${facts.length} facts survived.`:packed.length<noteSize?`Pick ${noteSize-packed.length} more.`:'The note is full.'}</p>
      <div class="s2s-actions">
        {sent?<button type="button" class="game-btn is-primary" onClick={next}>{last?'See my score':'Next sentence'}</button>
          :<button type="button" class="game-btn is-primary" disabled={packed.length<noteSize} onClick={send}>Send the note</button>}
      </div>
      <p class="toy-note">A toy: a three-fact note stands in for the encoder’s fixed-size vector, and hand-written habits stand in for a trained decoder. The real system wrote French.</p>
    </>}
  </div>;
}
