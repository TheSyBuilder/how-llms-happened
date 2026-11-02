import { useState } from 'preact/hooks';
export function decodeCream(sound: number, prior: number, useLanguage: boolean) {
  const likelihood = [sound / 100, 1 - sound / 100];
  const language = useLanguage ? [prior / 100, 1 - prior / 100] : [.5,.5];
  const scores = likelihood.map((p,i) => p * language[i]!);
  const total = scores[0]! + scores[1]!;
  return { likelihood, language, scores, posterior: scores.map(p => p / total) };
}
export default function SpeechToy() {
  const [sound,setSound]=useState(40); const [prior,setPrior]=useState(80); const [useLanguage,setUseLanguage]=useState(true);
  const result=decodeCream(sound,prior,useLanguage);
  const winner=Math.abs(result.posterior[0]! - result.posterior[1]!) < 1e-12 ? 'A tie. The decoder cannot choose.' : result.posterior[0]! > result.posterior[1]! ? 'ice cream' : 'I scream';
  return <div class="early-toy">
    <div class="toy-topline"><span class="eyebrow">The phrase mixing desk</span><span class="toy-label">Toy · no audio recognition</span></div>
    <div class="speech-caption" role="status"><span>Decoder chooses</span><strong>{winner}</strong></div>
    <label class="early-label" for="sound-match">Sound evidence for “ice cream” <output>{sound}%</output></label><input id="sound-match" type="range" min="5" max="95" step="5" value={sound} onInput={e=>setSound(Number(e.currentTarget.value))}/>
    <div class="early-ends"><span>More like “I scream”</span><span>More like “ice cream”</span></div>
    <label class="early-label" for="phrase-prior">Language prior for “ice cream” <output>{prior}%</output></label><input id="phrase-prior" type="range" min="5" max="95" step="5" value={prior} disabled={!useLanguage} onInput={e=>setPrior(Number(e.currentTarget.value))}/>
    <div class="early-buttons"><button onClick={()=>setPrior(80)}>At the dessert counter</button><button onClick={()=>setPrior(20)}>In a ghost story</button></div>
    <label class="early-toggle"><input type="checkbox" checked={useLanguage} onChange={e=>setUseLanguage(e.currentTarget.checked)}/> Use the language model</label>
    <div class="speech-candidates">{['ice cream','I scream'].map((phrase,i)=><div><strong>{phrase}</strong><span>Sound {result.likelihood[i]!.toFixed(2)} × prior {result.language[i]!.toFixed(2)}</span><div class="early-bar"><span style={{width:`${result.posterior[i]!*100}%`}}/></div><output>{(result.posterior[i]!*100).toFixed(1)}% of the two-candidate score</output></div>)}</div>
    <div class="early-buttons"><button onClick={()=>{setSound(40);setPrior(80);setUseLanguage(true);}}>Reset decoder</button></div>
    <p class="early-small">The sliders supply invented likelihoods and priors. Both candidates stay possible. A strong prior can help ambiguous sound—or pull a clear signal toward the wrong phrase.</p>
  </div>;
}
