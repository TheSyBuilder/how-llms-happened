import '../../i18n/preact';
import '../../styles/games/eliza.css';
import {useLayoutEffect,useRef,useState} from 'preact/hooks';
import {markPlayed} from '../../lib/progress';
import GoalBar from '../game/GoalBar';
import ResultCard,{type GameResult} from '../game/ResultCard';
import {OPENING,createState,elizaStars,respond,type Reply,type Tell} from './engine';
import {presets} from './presets';

export const SLUG='eliza';
// Chat text is set as escaped HTML so the page's translation hook never rewrites what was typed.
const raw=(text:string)=>({__html:text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')});
type Line={who:'you'|'eliza';text:string;reply?:Reply};
const tells:{id:Tell;name:string;hint:string}[]=[
 {id:'fallback',name:'Generic fallback',hint:'Say something with no word ELIZA has a rule for, like a list of foods.'},
 {id:'reflection',name:'Broken reflection',hint:'ELIZA swaps “you” for “I” without grammar. Put “you” after a word like “at” or “to”: “I feel angry at you.”'},
 {id:'repeat',name:'Repeated reply',hint:'Each rule has only a few replies. Say hello twice, or keep pressing the same topic.'},
];
const caughtText:Record<Tell,string>={fallback:'Caught: generic fallback. It found no keyword, so it said something that fits anything.',reflection:'Caught: broken reflection. Swapping pronouns word by word produced',repeat:'Caught: repeated reply. It had already said exactly this.'};
const suggestions=['My mother worries about me.','I am sad.','Are you a computer?'];

export function outcome(messages:number):GameResult{
 return {slug:SLUG,stars:elizaStars(messages),
  headline:messages===1?'You caught ELIZA out in 1 message.':`You caught ELIZA out in ${messages} messages.`,
  detail:'It never understood a word. It matched keywords, swapped pronouns and replied from a short list.',
  score:{value:messages,label:'Messages'},
  shareText:messages===1?'I caught ELIZA (1966) out in 1 message.':`I caught ELIZA (1966) out in ${messages} messages.`};
}
function how(reply:Reply){
 if(reply.kind==='memory')return 'No keyword, so it used its memory of something you said earlier.';
 if(reply.kind==='fallback')return `No keyword found. Stock reply ${reply.choice![0]} of ${reply.choice![1]}.`;
 if(reply.kind==='keyword')return `Keyword “${reply.keyword==='xforeign'?'another language':reply.keyword}” (rank ${reply.rank}). Pattern “${reply.pattern}”, reply ${reply.choice![0]} of ${reply.choice![1]}.`;
 return '';
}

export default function ElizaGame(){
 const engine=useRef(createState()),log=useRef<HTMLDivElement>(null),input=useRef<HTMLInputElement>(null);
 const [lines,setLines]=useState<Line[]>([{who:'eliza',text:OPENING}]);
 const [draft,setDraft]=useState('');
 const [found,setFound]=useState<Partial<Record<Tell,number>>>({});
 const [sent,setSent]=useState(0);
 const [preset,setPreset]=useState(0);
 const caught=tells.filter(tell=>found[tell.id]!==undefined).length,done=caught===3;
 useLayoutEffect(()=>{const node=log.current;if(node)node.scrollTop=node.scrollHeight;},[lines]);

 const send=(text:string)=>{
  text=text.trim();if(!text||done)return;
  if(sent===0)markPlayed(SLUG);
  const reply=respond(text,engine.current),count=sent+1,next={...found};
  for(const tell of reply.tells)next[tell]??=count;
  setLines([...lines,{who:'you',text},{who:'eliza',text:reply.text,reply}]);setSent(count);setFound(next);setDraft('');
 };
 const replay=()=>{engine.current=createState();setLines([{who:'eliza',text:OPENING}]);setFound({});setSent(0);setDraft('');requestAnimationFrame(()=>input.current?.focus());};
 const last=Math.max(0,...Object.values(found).map(Number));
 const live=respond(presets[preset]!.message,createState());

 return <div class="eliza-game">
  <GoalBar goal="Catch ELIZA out three ways: a generic fallback, a broken reflection and a repeated reply." status={sent===1?'1 message sent':`${sent} messages sent`} score={{value:caught,max:3,label:'Tells caught'}}/>
  <ul class="eliza-tells" aria-label="ELIZA’s tells">
   {tells.map(tell=><li class={found[tell.id]!==undefined?'is-caught':''}>
    <span class="eliza-tell-mark" aria-hidden="true">{found[tell.id]!==undefined?'✓':''}</span>
    <details><summary><span>{tell.name}</span>{found[tell.id]!==undefined&&<span class="eliza-sr">Caught</span>}</summary><p>{tell.hint}</p></details>
   </li>)}
  </ul>
  <div class="eliza-terminal">
   <div class="eliza-log" ref={log} tabIndex={0} role="log" aria-live="polite" aria-label="Conversation with ELIZA"><ol class="eliza-lines">
    {lines.map(line=><li class={`eliza-line is-${line.who}`}>
     <span class="eliza-who">{line.who==='you'?'You':'ELIZA'}</span>
     <p class="eliza-text" lang="en" dir="ltr" translate={false} dangerouslySetInnerHTML={raw(line.text)}/>
     {line.reply&&<p class="eliza-how">{how(line.reply)}</p>}
     {line.reply?.tells.map(tell=><p class={`eliza-caught is-${tell}`}>{tell==='reflection'?<>{caughtText.reflection} <q lang="en" dir="ltr" translate={false}>{line.reply!.broken}</q>.</>:caughtText[tell]}</p>)}
    </li>)}
   </ol></div>
   {done?<ResultCard result={outcome(last)} onReplay={replay}/>:<>
    <form class="eliza-form" onSubmit={event=>{event.preventDefault();send(draft);}}>
     <label class="eliza-sr" for="eliza-input">Your message</label>
     <input id="eliza-input" ref={input} lang="en" dir="ltr" autocomplete="off" maxLength={200} placeholder="Type to ELIZA…" value={draft} onInput={event=>setDraft((event.target as HTMLInputElement).value)}/>
     <button type="submit" class="game-btn is-primary" disabled={!draft.trim()}>Send</button>
    </form>
    <div class="eliza-suggest" role="group" aria-label="Try saying"><span>Try</span>{suggestions.map(text=><button type="button" class="game-btn" lang="en" dir="ltr" translate={false} onClick={()=>send(text)}>{text}</button>)}</div>
   </>}
  </div>
  <p class="toy-note">A re-creation of ELIZA’s 1966 method, with rules written for this page in the style of the original script.</p>
  <section class="eliza-ff" aria-labelledby="eliza-ff-title">
   <h2 id="eliza-ff-title">Fast-forward 60 years</h2>
   <p>Pick a message. ELIZA answers it live; next to it is how a model from 2026 might reply.</p>
   <div class="eliza-presets" role="group" aria-label="Messages">
    {presets.map((item,i)=><button type="button" lang="en" dir="ltr" translate={false} aria-pressed={i===preset} onClick={()=>setPreset(i)}>{item.message}</button>)}
   </div>
   <div class="eliza-compare">
    <figure class="eliza-card is-1966"><figcaption><b>ELIZA, 1966</b><span>Live reply from this page</span></figcaption><p lang="en" dir="ltr" translate={false}>{live.text}</p><p class="eliza-how">{how(live)}</p></figure>
    <figure class="eliza-card is-2026"><figcaption><b>A 2026 model</b><span>Written by Claude for this page in November 2026</span></figcaption><p lang="en" dir="ltr" translate={false}>{presets[preset]!.modern}</p></figure>
   </div>
  </section>
 </div>;
}
