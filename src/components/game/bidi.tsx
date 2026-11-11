import {t,currentLocale} from '../../i18n/core';
// In Arabic, an English word in curly quotes or a score like "85 / 100" sits between right-to-left
// letters and gets reordered ("100 / 85", ”word“). Isolating each run keeps it in reading order.
const runs=/(“[^“”؀-ۿ]*[A-Za-z][^“”؀-ۿ]*”|\d[\d.,]*(?:\s*\/\s*\d[\d.,]*)+)/;
export function isolateRuns(text:string){
 if(currentLocale()!=='ar')return text;
 const parts=t(text).split(runs);
 return parts.length===1?parts[0]!:parts.map((part,i)=>i%2?<bdi dir="ltr">{part}</bdi>:part);
}
