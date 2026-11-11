// Shared extraction rules keep prose translations separate from model data and formulas.
export const normalize = value => value.replace(/<!--[^]*?-->/g, '').replace(/\s+/g, ' ').trim();
const skip = 'script,style,code,pre,.katex,math,[translate="no"],.paper-credit,.source-list > li > a';
const hasWords = value => /[A-Za-z]{2}/.test(value);
export function units(root) {
 const rich=[], text=[], attrs=[], covered=new Set();
 for(const node of root.querySelectorAll('p,h1,h2,h3,h4,figcaption,summary,li')) {
  if(node.closest(skip)||node.closest('astro-island')||node.querySelector('p,h1,h2,h3,h4,ul,ol,button,input,select,astro-island,svg,details')||node.querySelector('a[href^="http"]'))continue;
  const key=normalize(node.innerHTML);
  // Prose around a single <code> (mostly formulas) is catalogued as plain text pieces, not as one rich unit.
  if(!hasWords(node.textContent)||!key.includes('<')||!node.textContent.trim()||node.children.length===1&&node.firstElementChild?.tagName==='CODE')continue;
  rich.push({node,key});for(const child of node.querySelectorAll('*'))covered.add(child);covered.add(node);
 }
 const walk=node=>{if(node.nodeType===3){if(!covered.has(node.parentElement)&&!node.parentElement?.closest(skip)){const key=normalize(node.textContent);if(hasWords(key))text.push({node,key});}return;}for(const child of node.childNodes??[])walk(child);};walk(root);
 for(const node of root.querySelectorAll('*'))for(const name of ['aria-label','aria-valuetext','title','placeholder','alt']){const key=normalize(node.getAttribute(name)||'');if(hasWords(key)&&!node.closest(skip))attrs.push({node,key,name});}
 return {rich,text,attrs};
}
