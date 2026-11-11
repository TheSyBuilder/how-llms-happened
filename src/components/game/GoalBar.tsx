import '../../i18n/preact';
import '../../styles/game.css';
import {scoreText} from '../../lib/share';
import {isolateRuns} from './bidi';
type Score={value:number;max?:number;label:string};
// The goal is read once as the group's content; only the status and score regions are live.
export default function GoalBar({goal,status,score}:{goal:string;status?:string;score?:Score}){
 return <div class="goal-bar" role="group" aria-label="Goal">
  <span class="goal-label" aria-hidden="true">Goal</span>
  <p class="goal-text">{isolateRuns(goal)}</p>
  <span class="goal-status" role="status">{isolateRuns(status??'')}</span>
  {score&&<span class="goal-score" aria-live="polite" aria-atomic="true"><span>{score.label}</span> <strong><bdi dir="ltr">{scoreText(score)}</bdi></strong></span>}
 </div>;
}
