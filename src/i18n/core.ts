declare const __SITE_BASE__: string;
export const siteBase = typeof __SITE_BASE__ === 'string' ? __SITE_BASE__ : '';
export function stripSiteBase(path:string) {
 return siteBase && (path === siteBase || path.startsWith(`${siteBase}/`)) ? path.slice(siteBase.length) || '/' : path;
}
export function withSiteBase(path:string) {
 if (!path.startsWith('/') || path.startsWith('//')) return path;
 return siteBase + stripSiteBase(path);
}
export type Locale = 'en' | 'zh' | 'ar';
export type Messages = Record<string,string>;
export function localeFromPath(path:string):Locale {path=stripSiteBase(path);return /^\/ar(?:\/|$)/.test(path)?'ar':/^\/zh(?:\/|$)/.test(path)?'zh':'en';}
export function basePath(path:string) {return stripSiteBase(path).replace(/^\/(?:zh|ar)(?=\/|$)/,'')||'/';}
export function localePath(path:string,locale:Locale):string {
 if(!path.startsWith('/')||path.startsWith('//')||/^\/(?:_astro|favicon|preview)/.test(path))return path;
 const base=basePath(path);return withSiteBase(locale==='en'?base:`/${locale}${base}`);
}
export const normalize=(value:string)=>value.replace(/\s+/g,' ').trim();
export function translator(messages:Messages) {
 messages=Object.fromEntries(Object.entries(messages).map(([key,value])=>[normalize(key),value]));
 const templates=Object.entries(messages).filter(([key])=>/\{\d+\}/.test(key)).map(([key,value])=>{
  const slots:number[]=[];const parts=key.split(/(\{\d+\})/g);const pattern=parts.map(part=>/^\{\d+\}$/.test(part)?(slots.push(Number(part.slice(1,-1))),'(.+?)'):part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('');
  return {regex:new RegExp(`^${pattern}$`),slots,value};
 });
 return (source:string):string=>{
  const key=normalize(source);if(!key)return source;
  let value=messages[key];
  if(value===undefined)for(const template of templates){const match=key.match(template.regex);if(match){const values:Record<number,string>={};template.slots.forEach((slot,i)=>values[slot]=messages[normalize(match[i+1]!)]??match[i+1]!);value=template.value.replace(/\{(\d+)\}/g,(_,slot)=>values[Number(slot)]??'');break;}}
  if(value===undefined)return source;
  return (source.match(/^\s*/)?.[0]??'')+value+(source.match(/\s*$/)?.[0]??'');
 };
}
let browserTranslate:ReturnType<typeof translator>|undefined;
export function t(source:string):string {
 if(typeof document==='undefined'||document.documentElement.lang==='en')return source;
 if(!browserTranslate){const data=document.getElementById('locale-messages')?.textContent;browserTranslate=translator(data?JSON.parse(data):{});}
 return browserTranslate(source);
}
export function currentLocale():Locale {return typeof document==='undefined'?'en':localeFromPath(location.pathname);}
