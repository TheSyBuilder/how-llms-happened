import {useRef} from 'preact/hooks';
import {markPlayed} from '../../lib/progress';
// Returns a function to call from every input handler; it records the chapter as played once.
export function usePlayed(slug:string){
 const done=useRef(false);
 return ()=>{if(!done.current){done.current=true;markPlayed(slug);}};
}
// 0–3 stars from ascending thresholds: [one, two, three].
export const starsFor=(value:number,[one,two,three]:[number,number,number]):0|1|2|3=>value>=three?3:value>=two?2:value>=one?1:0;
export const reducedMotion=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
