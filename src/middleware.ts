import {defineMiddleware} from 'astro:middleware';
import {parseHTML} from 'linkedom';
import {localizeHTML} from './i18n/server';
import {siteBase, stripSiteBase, withSiteBase} from './i18n/core';
export const onRequest=defineMiddleware(async(context,next)=>{
 const response=await next();
 const location=response.headers.get('location');
 if(location){
  const headers=new Headers(response.headers);headers.set('location',withSiteBase(location));
  return new Response(response.body,{status:response.status,headers});
 }
 if(!response.headers.get('content-type')?.includes('text/html'))return response;
 const path=stripSiteBase(context.url.pathname);
 let html=await response.text();
 if(/^\/(ar|zh)(\/|$)/.test(path))html=localizeHTML(html,path);
 if(siteBase){
  const {document}=parseHTML(html);
  for(const element of document.querySelectorAll('[href], [src]'))for(const name of ['href','src']){
   const value=element.getAttribute(name);if(value)element.setAttribute(name,withSiteBase(value));
  }
  html=document.toString();
 }
 return new Response(html,{status:response.status,headers:response.headers});
});
