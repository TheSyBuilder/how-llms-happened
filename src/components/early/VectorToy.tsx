import '../../i18n/preact';
import { useState } from 'preact/hooks';
export const mapWords = [{word:'shore',x:.95,y:.15},{word:'raft',x:.8,y:.05},{word:'loan',x:.1,y:.95},{word:'coin',x:.25,y:.8}];
export function nearestWords(x: number,y: number) { return mapWords.map(item=>({...item,similarity:(x*item.x+y*item.y)/(Math.hypot(x,y)*Math.hypot(item.x,item.y))})).sort((a,b)=>b.similarity-a.similarity); }
export default function VectorToy() {
  const [x,setX]=useState(.9); const [y,setY]=useState(.2); const neighbours=nearestWords(x,y);
  return <div class="early-toy">
    <div class="toy-topline"><span class="eyebrow">A word with two worlds</span><span class="toy-label">Toy · hand-placed vectors</span></div>
    <div class="early-result" role="status"><strong>bank is closest in direction to {neighbours[0]!.word}.</strong><p>Move its two numbers. Nearby directions share a neighbourhood.</p></div>
    <svg class="vector-map" viewBox="0 0 420 350" role="img" aria-label={`Bank vector: river ${x.toFixed(2)}, money ${y.toFixed(2)}. Closest word ${neighbours[0]!.word}.`}>
      <path d="M45 20V295H405" class="early-line"/><text x="45" y="330">River-like →</text><text x="15" y="18">Money-like ↑</text>
      {mapWords.map(item=><g><path d={`M45 295L${45+item.x*330} ${295-item.y*250}`} class="vector-ray"/><circle cx={45+item.x*330} cy={295-item.y*250} r="6"/><text x={item.word==='shore' ? 404 : item.word==='raft' ? 280 : 45+item.x*330} y={item.word==='shore' ? 238 : item.word==='raft' ? 278 : 280-item.y*250} text-anchor={item.word==='shore' || item.word==='raft' ? 'end' : 'middle'} class="map-word-label">{item.word}</text></g>)}
      <path d={`M45 295L${45+x*330} ${295-y*250}`} class="vector-query"/><circle cx={45+x*330} cy={295-y*250} r="12" class="vector-bank"/><circle cx="330" cy="325" r="7" class="vector-bank"/><text x="345" y="331" class="bank-label">bank</text>
    </svg>
    <label class="early-label" for="river-coordinate">River coordinate <output>{x.toFixed(2)}</output></label><input id="river-coordinate" type="range" min="5" max="95" step="5" value={x*100} onInput={e=>setX(Number(e.currentTarget.value)/100)}/>
    <label class="early-label" for="money-coordinate">Money coordinate <output>{y.toFixed(2)}</output></label><input id="money-coordinate" type="range" min="5" max="95" step="5" value={y*100} onInput={e=>setY(Number(e.currentTarget.value)/100)}/>
    <div class="early-buttons"><button onClick={()=>{setX(.2);setY(.9);}}>Move to finance</button><button onClick={()=>{setX(.9);setY(.2);}}>Reset map</button></div>
    <ol class="vector-neighbours">{neighbours.map(n=><li><span>{n.word}</span><output>{n.similarity.toFixed(3)} cosine</output></li>)}</ol>
    <p class="early-small">Cosine compares direction. Real word vectors learn many coordinates without these named axes. A single vector for “bank” must serve different senses; this movable map illustrates that tension, not word2vec training.</p>
  </div>;
}
