// The Chinchilla budget rectangle: area is the fixed compute, width is model size, height is training tokens.
// `position` runs from 0 (smallest model on the slider) to 1 (largest); both sides stay inside the axes.
const left=56,bottom=214,maxWidth=360,maxHeight=180,area=6400;
export function budgetBox(position:number){
 const p=Math.min(1,Math.max(0,position));
 const width=Math.exp(Math.log(area/maxHeight)+p*(Math.log(maxWidth)-Math.log(area/maxHeight)));
 return {width,height:area/width};
}
export default function ExperimentVisual({position,params,tokens}:{position:number;params:string;tokens:string}){
 const {width,height}=budgetBox(position);
 return <figure class="experiment-visual budget-visual" dir="ltr"><svg viewBox="0 0 440 240" role="img" aria-label={`${params} parameters trained on ${tokens} tokens, same compute.`}>
  <path d={`M${left} ${bottom-maxHeight-8}V${bottom}H${left+maxWidth+8}`} class="diagram-line"/>
  <rect x={left} y={bottom-height} width={width} height={height} class="diagram-fill"/>
  <text x={left+maxWidth} y={bottom+22} text-anchor="end">{`Model size: ${params}`}</text>
  <text x={left+8} y={bottom-maxHeight-14}>{`Tokens: ${tokens}`}</text>
 </svg></figure>;
}
