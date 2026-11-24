import '../../i18n/preact';
import '../../styles/games/dpo.css';
import {useEffect,useState} from 'preact/hooks';
import GoalBar from '../game/GoalBar';
import ResultCard,{type GameResult} from '../game/ResultCard';
import {starsFor,usePlayed} from './played';

// The model is a log-linear policy over two answer traits: helpful (h) and pirate flair (f).
// Its reference is the starting policy. DPO's gradient for one pair is β(1 − σ(βΔ))(φ_chosen − φ_rejected),
// where Δ is how much more the model favours the chosen answer than the reference does.
export type Traits={h:0|1;f:0|1};
export type Policy={h:number;f:number};
export const BETA=1,RATE=2,ROUNDS=10;
export const reference:Policy={h:0,f:-.4};
export const sigma=(x:number)=>1/(1+Math.exp(-x));
export const traitOdds=(p:Policy)=>({helpful:sigma(p.h),pirate:sigma(p.f)});
export const margin=(p:Policy,chosen:Traits,rejected:Traits)=>(p.h-reference.h)*(chosen.h-rejected.h)+(p.f-reference.f)*(chosen.f-rejected.f);
export function dpoStep(p:Policy,chosen:Traits,rejected:Traits):Policy{
 const g=RATE*BETA*(1-sigma(BETA*margin(p,chosen,rejected)));
 return {h:p.h+g*(chosen.h-rejected.h),f:p.f+g*(chosen.f-rejected.f)};
}
// Each round contrasts one trait, or trades one against the other. The shared trait follows the model's current habit.
export const contrasts=['f','h','trade','f','h','trade','f','h','f','h'] as const;
export function pairFor(p:Policy,round:number):[Traits,Traits]{
 const odds=traitOdds(p),h:0|1=odds.helpful>=.5?1:0,f:0|1=odds.pirate>=.5?1:0,kind=contrasts[round%contrasts.length];
 if(kind==='f')return [{h,f:1},{h,f:0}];
 if(kind==='h')return [{h:1,f},{h:0,f}];
 return [{h:1,f:1},{h:0,f:0}];
}
export const plainHelpful=(p:Policy)=>Math.round(100*traitOdds(p).helpful*(1-traitOdds(p).pirate));
export const dpoStars=(score:number)=>starsFor(score,[40,62,80]);
export const prompts=[
 {q:'How do I boil an egg?',a:'Put the egg in boiling water for 9 minutes, then cool it in cold water.'},
 {q:'Why is the sky blue?',a:'Air scatters blue sunlight more than red, so blue reaches your eyes from every direction.'},
 {q:'How long should a nap be?',a:'About 20 minutes. Longer naps can leave you groggy.'},
 {q:'What is 15% of 80?',a:'12. Ten percent is 8 and five percent is 4.'},
 {q:'How do I keep basil fresh?',a:'Trim the stems and stand them in a glass of water, outside the fridge.'},
 {q:'How do I fix a squeaky door?',a:'Put a few drops of oil on the hinge, then swing the door a few times.'},
 {q:'When was the Eiffel Tower finished?',a:'In 1889, for the World’s Fair in Paris.'},
 {q:'What is the capital of Australia?',a:'Canberra, not Sydney.'},
 {q:'How do I get coffee out of a shirt?',a:'Blot it, rinse cold water through the back of the stain, then wash with a little dish soap.'},
 {q:'How many legs does a spider have?',a:'Eight. Insects have six.'}
];
const vague=['Great question! It depends on many factors, so trust your instincts.','There are lots of ways to look at this, and every situation is different.','That is a big topic. You might want to look into it further.'];
const flair=[{start:'Arr, matey! ',end:' Yo-ho!'},{start:'Shiver me timbers, ye landlubber! ',end:' Now hoist the mainsail, arr!'}];
export function answerText(round:number,traits:Traits,p:Policy){
 const body=traits.h?prompts[round]!.a:vague[round%vague.length]!;
 if(!traits.f)return {start:'',body,end:''};
 const style=flair[traitOdds(p).pirate>.8?1:0]!;
 return {start:style.start,body,end:style.end};
}
const randomFlips=()=>Array.from({length:ROUNDS},()=>Math.random()<.5);

export default function Dpo(){
 const touch=usePlayed('dpo');
 const [policy,setPolicy]=useState<Policy>(reference);const [round,setRound]=useState(0);
 // The first render is fixed so the server and hydration agree; the order is shuffled once mounted.
 const [flip,setFlip]=useState<boolean[]>(()=>Array.from({length:ROUNDS},()=>false));
 useEffect(()=>setFlip(randomFlips()),[]);
 const [last,setLast]=useState('');const [result,setResult]=useState<GameResult|null>(null);
 const odds=traitOdds(policy),score=plainHelpful(policy);
 const pair=pairFor(policy,round),shown=flip[round]?[pair[1],pair[0]]:pair;
 const choose=(i:number)=>{
  touch();const chosen=shown[i]!,rejected=shown[1-i]!,next=dpoStep(policy,chosen,rejected),o=traitOdds(next);
  setPolicy(next);
  setLast(`Update: helpful ${Math.round(o.helpful*100)}%, pirate ${Math.round(o.pirate*100)}%.`);
  if(round+1<ROUNDS){setRound(round+1);return;}
  const final=plainHelpful(next),h=Math.round(o.helpful*100),f=Math.round(o.pirate*100);
  setResult({slug:'dpo',stars:dpoStars(final),score:{value:final,max:100,label:'Helpful and plain'},
   headline:f>50?`I DPO-trained a pirate: ${f}% pirate, ${h}% helpful.`:`My model ended ${h}% helpful and only ${f}% pirate.`,
   detail:'Every pick moved the model toward the answer you chose and away from the one you passed over, measured against where it started.',
   shareText:f>50?`10 clicks of preference training turned my model ${f}% pirate.`:`I preference-trained a model in 10 clicks: ${h}% helpful, ${f}% pirate.`});
 };
 const replay=()=>{setPolicy(reference);setRound(0);setFlip(randomFlips());setLast('');setResult(null);};
 return <div class="later-game dpo-game">
  <GoalBar goal="Pick the better answer 10 times. Finish with a model that is helpful and plain." status={result?'Done':`Round ${round+1} / ${ROUNDS}`} score={{value:score,max:100,label:'Helpful and plain'}}/>
  <div class="dpo-meters">
   <div class="game-meter is-good"><span class="game-meter-label">Helpful <b dir="ltr">{`${Math.round(odds.helpful*100)}%`}</b></span><span class="game-meter-track"><span class="game-meter-fill" style={`--value:${odds.helpful}`}/></span></div>
   <div class="game-meter is-bad"><span class="game-meter-label">Pirate flair <b dir="ltr">{`${Math.round(odds.pirate*100)}%`}</b></span><span class="game-meter-track"><span class="game-meter-fill" style={`--value:${odds.pirate}`}/></span></div>
  </div>
  {result?<ResultCard result={result} onReplay={replay}/>:<>
   <p class="dpo-prompt"><span>Prompt</span> {prompts[round]!.q}</p>
   <div class="dpo-answers" role="group" aria-label="Choose the better answer">{shown.map((traits,i)=>{const text=answerText(round,traits,policy);
    return <button type="button" class="dpo-answer" onClick={()=>choose(i)}><span class="dpo-tag">{i?'Answer B':'Answer A'}</span><span class="dpo-text">{text.start&&<em>{text.start}</em>}<span>{text.body}</span>{text.end&&<em>{text.end}</em>}</span></button>;})}</div>
   <p class="dpo-last" aria-live="polite">{last}</p>
  </>}
  <p class="toy-note">A two-trait model trained with the real DPO update. Real DPO adjusts billions of weights from many pairs.</p>
 </div>;
}
