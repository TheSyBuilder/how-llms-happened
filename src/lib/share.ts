import {t,withSiteBase,localePath,currentLocale,type Locale} from '../i18n/core';
import type {Era} from './chapter-meta';
export function chapterUrl(slug:string,{origin=typeof location==='undefined'?'':location.origin,locale=currentLocale()}:{origin?:string;locale?:Locale}={}):string {
 return `${origin.replace(/\/$/,'')}${withSiteBase(localePath(`/chapters/${slug}/`,locale))}#play`;
}
export const xIntentUrl=(text:string,url:string)=>`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
// Light-theme values from the contract: the image is the same in either theme.
const eraHex:Record<Era,string>={counting:'#e8a33d',memory:'#4fa3a5',attention:'#8a7ff0',scale:'#e8714f',chat:'#4b95e0',agents:'#b9e64b'};
const paper='#f6f4ed',ink='#252821',muted='#64685e';
export type ResultImage={url:string;headline:string;title?:string;year?:number;era?:Era;score?:{value:number;max?:number;label:string};stars?:0|1|2|3};
// One key per distinct result, so callers that rebuild an equal result object each render don't replay the card's mount work.
export const resultKey=(result:{slug:string;headline:string;stars?:number;score?:{value:number;max?:number;label:string}})=>JSON.stringify([result.slug,result.headline,result.stars??null,result.score?[result.score.value,result.score.max??null,result.score.label]:null]);
export const scoreText=(score:{value:number;max?:number;label:string})=>`${score.value}${score.max===undefined?'':` / ${score.max}`}`;
// Words for spaced scripts, single characters for CJK so long Chinese headlines still wrap.
function wrap(ctx:CanvasRenderingContext2D,text:string,width:number):string[] {
 const units=text.match(/[　-鿿＀-￯]|[^\s　-鿿＀-￯]+\s*|\s+/g)??[];
 const lines:string[]=[];let line='';
 for(const unit of units){const next=line+unit;if(line&&ctx.measureText(next.trimEnd()).width>width){lines.push(line.trimEnd());line=unit.trimStart();}else line=next;}
 if(line.trim())lines.push(line.trimEnd());return lines;
}
export async function drawResultImage(canvas:HTMLCanvasElement,data:ResultImage):Promise<HTMLCanvasElement> {
 const W=1200,H=630,pad=80;canvas.width=W;canvas.height=H;
 try{await Promise.all([document.fonts.load('700 64px "Space Grotesk"'),document.fonts.load('500 28px "DM Sans"')]);await document.fonts.ready;}catch{}
 const ctx=canvas.getContext('2d');if(!ctx)return canvas;
 const rtl=document.documentElement.dir==='rtl',x=rtl?W-pad:pad,inner=W-pad*2;
 ctx.direction=rtl?'rtl':'ltr';ctx.textAlign='start';ctx.textBaseline='alphabetic';
 ctx.fillStyle=paper;ctx.fillRect(0,0,W,H);
 ctx.fillStyle=data.era?eraHex[data.era]:eraHex.agents;ctx.fillRect(0,0,W,28);
 ctx.fillStyle=ink;ctx.font='600 28px "Space Grotesk", sans-serif';ctx.fillText(t('LLM Lineage · How LLMs happened'),x,104,inner);
 if(data.title){ctx.fillStyle=muted;ctx.font='500 30px "DM Sans", sans-serif';ctx.fillText(data.year===undefined?t(data.title):`${data.year} · ${t(data.title)}`,x,156,inner);}
 // Shrink the headline until it fits in three lines above the score row, then clip the last one.
 // Arabic needs taller lines for its marks; the last baseline must stay above y=440.
 const headline=t(data.headline),leading=/[\u0600-\u06ff]/.test(headline)?1.3:1.12;let size=76,lines:string[]=[];
 for(;;size-=4){ctx.font=`700 ${size}px "Space Grotesk", sans-serif`;lines=wrap(ctx,headline,inner);if(size<=44||lines.length<=3&&250+(lines.length-1)*size*leading<=440)break;}
 if(lines.length>3){lines=lines.slice(0,3);let last=lines[2]!;while(last&&ctx.measureText(`${last}…`).width>inner)last=last.slice(0,-1);lines[2]=`${last.trimEnd()}…`;}
 ctx.fillStyle=ink;const lead=size*leading;lines.forEach((line,i)=>ctx.fillText(line,x,250+i*lead));
 const scoreY=250+(lines.length-1)*lead+76;
 if(data.score||data.stars!==undefined){
  let cursor=x;ctx.font='700 40px "Space Grotesk", sans-serif';
  if(data.stars!==undefined){const stars='★'.repeat(data.stars)+'☆'.repeat(3-data.stars);ctx.fillStyle=ink;ctx.fillText(stars,cursor,scoreY);const w=ctx.measureText(stars).width+36;cursor+=rtl?-w:w;}
  if(data.score){ctx.font='500 34px "DM Sans", sans-serif';ctx.fillStyle=ink;ctx.fillText(`${t(data.score.label)} \u2066${scoreText(data.score)}\u2069`,cursor,scoreY);}
 }
 ctx.fillStyle=ink;ctx.fillRect(pad,H-96,inner,2);
 ctx.fillStyle=muted;ctx.font='500 26px "DM Sans", sans-serif';ctx.direction='ltr';ctx.textAlign=rtl?'right':'left';
 ctx.fillText(data.url.replace(/^https?:\/\//,''),rtl?W-pad:pad,H-50,inner);
 return canvas;
}
export async function saveResultImage(canvas:HTMLCanvasElement,filename:string):Promise<'shared'|'downloaded'|'cancelled'> {
 const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)return 'cancelled';
 const file=typeof File==='undefined'?undefined:new File([blob],filename,{type:'image/png'});
 try{
  if(file&&navigator.canShare?.({files:[file]})){await navigator.share({files:[file]});return 'shared';}
 }catch(error){if((error as DOMException)?.name==='AbortError')return 'cancelled';}
 const href=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=href;link.download=filename;link.hidden=true;document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(href),1000);return 'downloaded';
}
