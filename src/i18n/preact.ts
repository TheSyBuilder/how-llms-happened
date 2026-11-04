import {options} from 'preact';
import {t,currentLocale,localePath} from './core';
// Translate at render time, including updates, so hydration and interaction use the same copy.
const previous=options.vnode;
options.vnode=vnode=>{
 previous?.(vnode);
 if(currentLocale()==='en'||typeof vnode.type!=='string')return;
 const props=vnode.props as Record<string,unknown>;
 // Translated option labels must not change the values used by toy logic.
 if(vnode.type==='option'&&props.value===undefined&&typeof props.children==='string')props.value=props.children;
 const children=(value:unknown):unknown=>{
  if(typeof value==='string')return t(value);
  if(Array.isArray(value)){
   if(value.every(item=>typeof item==='string'||typeof item==='number')){const joined=value.join(''),translated=t(joined);if(translated!==joined)return translated;}
   return value.map(children);
  }
  return value;
 };
 if(vnode.type==='output'){const value=Array.isArray(props.children)?props.children.join(''):String(props.children??'');if(/^[\d\s.,%/+−–-]+$/.test(value))props.dir='ltr';}
 props.children=children(props.children);
 for(const name of ['aria-label','aria-valuetext','title','placeholder','alt'])if(typeof props[name]==='string')props[name]=t(props[name] as string);
 if(typeof props.href==='string')props.href=localePath(props.href,currentLocale());
};
