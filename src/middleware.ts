import {defineMiddleware} from 'astro:middleware';
import {localizeHTML} from './i18n/server';
export const onRequest=defineMiddleware(async(context,next)=>{
 const response=await next();
 if(!/^\/(ar|zh)(\/|$)/.test(context.url.pathname)||!response.headers.get('content-type')?.includes('text/html'))return response;
 return new Response(localizeHTML(await response.text(),context.url.pathname),{status:response.status,headers:response.headers});
});
