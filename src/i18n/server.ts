import {parseHTML} from 'linkedom';
import {units} from './units.mjs';
import {translator,localeFromPath,localePath,type Messages} from './core';
type Catalog={rich:Messages;text:Messages};
const files=import.meta.glob<Catalog>('./{ar,zh}/*.json',{eager:true,import:'default'});
export function localizeHTML(html:string,path:string):string {
 const locale=localeFromPath(path);if(locale==='en')return html;
 const slug=path.match(/\/chapters\/([^/]+)/)?.[1];
 const common=files[`./${locale}/common.json`]??{rich:{},text:{}};
 const chapter=slug?files[`./${locale}/${slug}.json`]:undefined;
 const rich={...chapter?.rich,...common.rich},text={...chapter?.text,...common.text};
 const translate=translator(text);const {document}=parseHTML(html);
 for(const option of document.querySelectorAll('option:not([value])'))option.setAttribute('value',option.textContent??'');
 for(const output of document.querySelectorAll('output'))if(/^[\d\s.,%/+−–-]+$/.test(output.textContent??''))output.setAttribute('dir','ltr');
 const all=units(document);
 for(const {node,key} of all.rich){const value=rich[key];if(value!==undefined)node.innerHTML=value;}
 // Recollect plain nodes after rich replacements, which are already in the target language.
 for(const element of document.querySelectorAll('*')){
  if(element.children.length===0&&!element.closest('script,style,code,pre,.katex,math')){
   const source=element.textContent??'';
   if(text[source.trim()]!==undefined)element.textContent=translate(source);
  }
 }
 const plain=units(document);
 for(const {node} of plain.text)node.textContent=translate(node.textContent??'');
 for(const {node,name} of plain.attrs)node.setAttribute(name,translate(node.getAttribute(name)??''));
 for(const node of document.querySelectorAll('a[href]'))if(!node.hasAttribute('data-language'))node.setAttribute('href',localePath(node.getAttribute('href')!,locale));
 for(const node of document.querySelectorAll('[data-search]'))node.setAttribute('data-search',`${node.getAttribute('data-search')} ${node.textContent}`.toLowerCase());
 for(const node of document.querySelectorAll('meta[name="description"],meta[property="og:description"],meta[property="og:title"]')){const value=node.getAttribute('content')??'';node.setAttribute('content',value.endsWith(' — LLM Lineage')?translate(value.slice(0,-14))+' — LLM Lineage':translate(value));}
 const title=document.querySelector('title');if(title){const original=title.textContent??'';const label=original.replace(/ — LLM Lineage$/,'');title.textContent=translate(label)+(original.endsWith(' — LLM Lineage')?' — LLM Lineage':'');}
 document.documentElement.lang=locale==='zh'?'zh-CN':'ar';document.documentElement.dir=locale==='ar'?'rtl':'ltr';
 const play=document.querySelector('#play');
 if(play?.querySelector('astro-island')){const note=document.createElement('p');note.className='example-language-note';note.textContent=translate('Some example words stay in their original language so you can see what the toy is reading.');play.querySelector('astro-island')!.before(note);}
 const payload=document.createElement('script');payload.id='locale-messages';payload.type='application/json';payload.textContent=JSON.stringify(text).replace(/</g,'\\u003c');document.head.appendChild(payload);
 return document.toString();
}
