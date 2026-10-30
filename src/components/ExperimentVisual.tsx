type Props={kind:string;value:number;bits:number;toggle:boolean;price:number|null;total:number|null;probability:number;routeData:{expert:number;accepted:boolean}[];paths:{path:string;value:number}[]};
export default function ExperimentVisual({kind,value,bits,toggle,price,total,probability,routeData,paths}:Props){
 if(kind==='chinchilla'){
  const width=22*Math.sqrt(value),height=220/Math.sqrt(value);
  return <figure class="experiment-visual budget-visual"><svg viewBox="0 0 440 270" role="img" aria-label={`${value} model units and ${(100/value).toFixed(2)} token units use the same budget.`}>
   <text x="20" y="28">100 compute units. Change the shape.</text>
   <path d="M50 40V225H400" class="diagram-line"/>
   <rect x="70" y={225-height} width={width} height={height} class="diagram-fill"/>
   <text x={Math.max(130,80+width)} y="180">{(100/value).toFixed(1)} tokens</text>
   <text x="70" y="255">{value} model units →</text>
  </svg><figcaption>Side lengths use a square-root scale; area remains constant. The allocation changes, the compute does not.</figcaption></figure>;
 }
 if(kind==='open-models'){
  const size=value*bits/8;
  return <figure class="experiment-visual memory-visual"><div class="visual-caption"><strong>WEIGHT MEMORY</strong><span>16 slots × 1 GB</span></div><div class="memory-rack" aria-label={`${size} GB of weights in a 16 GB rack`}>{Array.from({length:16},(_,i)=><span><i style={{height:`${Math.min(1,Math.max(0,size-i))*100}%`}}/><small>{i+1}</small></span>)}</div><figcaption>{size>16?`${(size-16).toFixed(1)} GB outside the rack. The weights do not fit.`:`${(16-size).toFixed(1)} GB remains after weights. Runtime needs some of that space too.`}</figcaption></figure>;
 }
 if(kind==='mixture-of-experts')return <figure class="experiment-visual"><svg viewBox="0 0 440 210" role="img" aria-label="Each numbered token connects to its assigned expert. Dashed paths overflow.">
  {routeData.map((r,i)=><g><path d={`M${35+i*74} 46C${35+i*74} 100 ${75+r.expert*145} 100 ${75+r.expert*145} 155`} class={r.accepted?'diagram-route':'diagram-line'} stroke-dasharray={r.accepted?undefined:'5 5'} opacity={r.accepted?1:.4}/><circle cx={35+i*74} cy="28" r="17" class="diagram-outline"/><text x={35+i*74} y="35" text-anchor="middle">{i+1}</text></g>)}
  {['A','B','C'].map((e,i)=><g><rect x={25+i*145} y="156" width="100" height="44" class="diagram-fill"/><text x={75+i*145} y="184" text-anchor="middle">Expert {e}</text></g>)}
 </svg><figcaption>Solid paths run. Dashed paths overflow. The tokens keep their original expert assignments.</figcaption></figure>;
 if(kind==='tools-and-agents')return <div class="tool-trace experiment-visual" aria-label="Tool observations"><div class={price===null?'trace-pending':'trace-ready'}><span>01 · LOOKUP</span><code>catalogue("notebook")</code><strong>{price===null?'Waiting for a call':`← $${price} per notebook`}</strong></div><div class={total===null?'trace-pending':'trace-ready'}><span>02 · CALCULATE</span><code>{price===null?'quantity × ?':`${value} × $${price}`}</code><strong>{total===null?'Waiting for a calculation':`← $${total} total`}</strong></div></div>;
 if(kind==='dpo')return <figure class="experiment-visual odds-visual"><div class="odds-answers"><span>Plain answer<br/><strong>{Math.round(probability*100)}%</strong></span><span>Technical answer<br/><strong>{Math.round((1-probability)*100)}%</strong></span></div><div class="odds-track"><span style={{width:`${probability*100}%`}}/><i/></div><figcaption>The notch is the fixed 50:50 reference. Training moves the model’s answer probabilities.</figcaption></figure>;
 if(kind==='chain-of-thought')return <figure class="experiment-visual receipt-visual"><div><span>A · DELIVERY ONCE</span><div class="notebook-row">{Array.from({length:value},()=> <span aria-label="One $4 notebook">▤</span>)}</div><strong>{toggle?`$${value*4} + $3`:'Subtotal hidden'}</strong></div><div><span>B · DELIVERY PER ITEM</span><div class="notebook-row">{Array.from({length:value},()=> <span aria-label="One notebook plus delivery">▤<small>+$3</small></span>)}</div><strong>{toggle?`${value} × ($4 + $3)`:'Subtotal hidden'}</strong></div><figcaption>{toggle?'Count the delivery charges. Which diagram matches the question?':'Reveal the working to compare what each solution charged.'}</figcaption></figure>;
 if(kind==='reasoning')return <figure class="experiment-visual search-visual"><svg viewBox="0 0 440 250" role="img" aria-label={`${value} search paths checked. Target ${toggle?11:10}.`}>
  <text x="220" y="26" text-anchor="middle">Start at 2 · target {toggle?11:10}</text>
  {paths.map((p,i)=><g opacity={i<value?1:.2}><path d={`M220 55L${35+i*74} 150`} class={i<value && p.value===(toggle?11:10)?'diagram-route':'diagram-line'}/><circle cx={35+i*74} cy="172" r="22" class={i<value && p.value===(toggle?11:10)?'diagram-fill':'diagram-outline'}/><text x={35+i*74} y="179" text-anchor="middle">{i<value?p.value:'?'}</text><text x={35+i*74} y="218" text-anchor="middle">#{i+1}</text></g>)}
  <circle cx="220" cy="55" r="18" class="diagram-fill"/><text x="220" y="62" text-anchor="middle">2</text>
 </svg><figcaption>Each branch is one complete two-move candidate. Unchecked branches stay hidden.</figcaption></figure>;
 return null;
}
