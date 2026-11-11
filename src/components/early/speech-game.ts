// "Wreck a nice beach": five ambiguous phrases, decoded by sound alone and by sound × a language-model prior.
export type SpeechRound={context:string;cue:string;sounds:string;options:[string,string];meant:0|1;acoustic:[number,number];prior:[number,number]};
// acoustic: invented P(sound | phrase); prior: invented P(phrase | the two words before the gap).
export const speechRounds:SpeechRound[]=[
 {context:'Our new lab computer listens and types what you say. At last it can ___.',cue:'it can',sounds:'wreck a nice speech',options:['wreck a nice beach','recognize speech'],meant:1,acoustic:[.6,.4],prior:[.08,.92]},
 {context:'It is so hot today. Two scoops of ___, please.',cue:'scoops of',sounds:'ice scream',options:['ice cream','I scream'],meant:0,acoustic:[.35,.65],prior:[.95,.05]},
 {context:'The power is out again. Please light the ___.',cue:'light the',sounds:'for candles',options:['fork handles','four candles'],meant:1,acoustic:[.45,.55],prior:[.1,.9]},
 {context:'Our goalie never smiles and never lets a goal in. He is ___.',cue:'He is',sounds:'an ice man',options:['a nice man','an ice man'],meant:1,acoustic:[.3,.7],prior:[.9,.1]},
 {context:'Only the very best eggs are labelled ___.',cue:'are labelled',sounds:'grey day',options:['grade A','grey day'],meant:0,acoustic:[.4,.6],prior:[.95,.05]},
];
export function decodePhrase(round:SpeechRound,useLanguage:boolean):{scores:[number,number];share:[number,number];pick:0|1} {
 const scores:[number,number]=[round.acoustic[0]*(useLanguage?round.prior[0]:.5),round.acoustic[1]*(useLanguage?round.prior[1]:.5)];
 const total=scores[0]+scores[1];
 return {scores,share:[scores[0]/total,scores[1]/total],pick:scores[0]>=scores[1]?0:1};
}
export function decoderScore(useLanguage:boolean,rounds:readonly SpeechRound[]=speechRounds):number {
 return rounds.filter(r=>decodePhrase(r,useLanguage).pick===r.meant).length;
}
export function speechStars(correct:number):0|1|2|3 {return correct>=5?3:correct===4?2:correct===3?1:0;}
