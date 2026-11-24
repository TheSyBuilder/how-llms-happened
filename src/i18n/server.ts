import {parseHTML} from 'linkedom';
import {units} from './units.mjs';
import {translator,clientMessages,localeFromPath,localePath,normalize,type Messages} from './core';
import {chapterMeta,eras} from '../lib/chapter-meta';
// `static: true` marks a catalog of static page copy (story text, first steps): its keys ship to the client
// only when an island rendered them, never as runtime-only fallbacks.
type Catalog={rich:Messages;text:Messages;static?:boolean};
const files=import.meta.glob<Catalog>('./{ar,zh}/*.json',{eager:true,import:'default'});
// The game kit renders these after play (result card era badge, next-chapter link), so every route ships them
// along with shared-game.json.
const gameKit=[...chapterMeta.map(meta=>meta.title),...eras.map(era=>era.label)];
const noTranslate='script,style,code,pre,.katex,math,[translate="no"]';
export function localizeHTML(html:string,path:string):string {
 const locale=localeFromPath(path);if(locale==='en')return html;
 const slug=path.match(/\/chapters\/([^/]+)/)?.[1];
 const common=files[`./${locale}/common.json`]??{rich:{},text:{}};
 const chapter=slug?files[`./${locale}/${slug}.json`]:undefined;
 const shared=Object.entries(files).filter(([file])=>file.startsWith(`./${locale}/shared-`)).map(([,catalog])=>catalog);
 const rich=Object.assign({},...shared.map(c=>c.rich),chapter?.rich,common.rich),text=Object.assign({},...shared.map(c=>c.text),chapter?.text,common.text);
 // Track which keys reach the static page and which reach SSR island markup, to size the client catalog.
 const applied=new Set<string>(),island=new Set<string>();let inIsland=false;
 const lookup=translator(text,key=>{applied.add(key);if(inIsland)island.add(key);});
 const translate=(source:string,node?:Element|null)=>{inIsland=!!node?.closest('astro-island');const value=lookup(source);inIsland=false;return value;};
 const {document}=parseHTML(html);
 for(const option of document.querySelectorAll('option:not([value])'))option.setAttribute('value',option.textContent??'');
 for(const output of document.querySelectorAll('output'))if(/^[\d\s.,%/+−–-]+$/.test(output.textContent??''))output.setAttribute('dir','ltr');
 const all=units(document);
 for(const {node,key} of all.rich){const value=rich[key];if(value!==undefined)node.innerHTML=value;}
 // Recollect plain nodes after rich replacements, which are already in the target language.
 for(const element of document.querySelectorAll('*')){
  if(element.children.length===0&&!element.closest(noTranslate)){
   const source=element.textContent??'';
   if(text[source.trim()]!==undefined)element.textContent=translate(source,element);
  }
 }
 const plain=units(document);
 for(const {node} of plain.text)node.textContent=translate(node.textContent??'',node.parentElement);
 for(const {node,name} of plain.attrs)node.setAttribute(name,translate(node.getAttribute(name)??'',node));
 for(const node of document.querySelectorAll('a[href]'))if(!node.hasAttribute('data-language'))node.setAttribute('href',localePath(node.getAttribute('href')!,locale));
 for(const node of document.querySelectorAll('[data-search]'))node.setAttribute('data-search',`${node.getAttribute('data-search')} ${node.textContent}`.toLowerCase());
 for(const node of document.querySelectorAll('meta[name="description"],meta[property="og:description"],meta[property="og:title"],meta[property="og:image:alt"]')){const value=node.getAttribute('content')??'';node.setAttribute('content',value.endsWith(' — LLM Lineage')?translate(value.slice(0,-14))+' — LLM Lineage':translate(value));}
 const title=document.querySelector('title');if(title){const original=title.textContent??'';const label=original.replace(/ — LLM Lineage$/,'');title.textContent=translate(label)+(original.endsWith(' — LLM Lineage')?' — LLM Lineage':'');}
 // Arabic sentences quote English example words; isolate “word” so its quotes stay in reading order
 // (islands do the same through game/bidi.tsx after hydration).
 if(locale==='ar'){
  // Keep whole copy leaves intact through exact lookup, then isolate mixed-script runs in the chapter brief.
  const briefRuns = /(«[^«»\u0600-\u06ff]*[A-Za-z0-9][^«»\u0600-\u06ff]*»|“[^“”\u0600-\u06ff]*[A-Za-z0-9][^“”\u0600-\u06ff]*”|"[^"\u0600-\u06ff]*[A-Za-z0-9][^"\u0600-\u06ff]*"|[A-Za-z0-9]+(?:[.,]\d+)*(?:[ .'’:/+%-]+[A-Za-z0-9]+)*(?:[%٪])?)/;
  for (const element of document.querySelectorAll('.chapter-brief-copy,.chapter-brief-how-to')) {
   const nodes: Text[] = [];
   const collect = (node: Node) => {
    if (node.nodeType === 3) { if (!node.parentElement?.closest('bdi')) nodes.push(node as Text); return; }
    for (const child of node.childNodes) collect(child);
   };
   collect(element);
   for (const node of nodes) {
    const parts = (node.textContent ?? '').split(briefRuns);
    if (parts.length > 1) node.replaceWith(...parts.map((part, index) => {
     if (index % 2 === 0) return document.createTextNode(part);
     const bdi = document.createElement('bdi'); bdi.setAttribute('dir', 'ltr'); bdi.textContent = part; return bdi;
    }));
   }
  }
  const quoted=/(“[^“”\u0600-\u06ff]*[A-Za-z][^“”\u0600-\u06ff]*”)/;const nodes:Text[]=[];
  const walk=(node:Node)=>{if(node.nodeType===3){if(quoted.test(node.textContent??'')&&!node.parentElement?.closest(`${noTranslate},astro-island,head,title,option,textarea,bdi,svg`))nodes.push(node as Text);return;}for(const child of node.childNodes)walk(child);};
  walk(document.body);
  for(const node of nodes){const parts=(node.textContent??'').split(quoted);node.replaceWith(...parts.map((part,i)=>{if(i%2===0)return document.createTextNode(part);const bdi=document.createElement('bdi');bdi.setAttribute('dir','ltr');bdi.textContent=part;return bdi;}));}
 }
 document.documentElement.lang=locale==='zh'?'zh-CN':'ar';document.documentElement.dir=locale==='ar'?'rtl':'ltr';
 const play=document.querySelector('#play');
 if(play?.querySelector('astro-island')){const note=document.createElement('p');note.className='example-language-note';note.textContent=translate('Some example words stay in their original language so you can see what the toy is reading.');play.querySelector('astro-island')!.before(note);}
 const payload=document.createElement('script');payload.id='locale-messages';payload.type='application/json';
 const catalogs=[...shared,chapter,common].filter((c):c is Catalog=>!!c),dynamic=new Set(catalogs.filter(c=>!c.static).flatMap(c=>Object.keys(c.text)));
 for(const key of catalogs.filter(c=>c.static).flatMap(c=>Object.keys(c.text)))if(!dynamic.has(key))applied.add(normalize(key));
 const always=new Set([...gameKit,...Object.keys(files[`./${locale}/shared-game.json`]?.text??{})].map(normalize));
 payload.textContent=JSON.stringify(clientMessages(text,applied,island,always)).replace(/</g,'\\u003c');document.head.appendChild(payload);
 return document.toString();
}
