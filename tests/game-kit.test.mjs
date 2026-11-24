import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const compile=file=>ts.transpileModule(readFileSync(new URL(`../src/${file}`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const load=(file,{base='',storage,window}={})=>{
 const core={};new Function('__SITE_BASE__','exports',compile('i18n/core.ts'))(base,core);
 const api={};new Function('require','exports','localStorage','window',compile(file))(id=>id==='../i18n/core'?core:{},api,storage,window);
 return api;
};
const memory=(initial={})=>{const data={...initial};return {getItem:k=>k in data?data[k]:null,setItem:(k,v)=>{data[k]=String(v);},data};};
test('progress round-trips and notifies listeners',()=>{
 const storage=memory(),progress=load('lib/progress.ts',{storage});let calls=0;
 const off=progress.onProgress(()=>calls++);
 progress.markPlayed('bert');assert.deepEqual(progress.getProgress(),{bert:{played:true,completed:false}});
 progress.markCompleted('bert',{best:'7 / 10',stars:2});off();progress.markPlayed('elman');
 assert.equal(calls,2);assert.deepEqual(JSON.parse(storage.data['lineage-progress-v1']).bert,{played:true,completed:true,best:'7 / 10',stars:2});
});
test('completing again keeps the best stars and marks the chapter played',()=>{
 const progress=load('lib/progress.ts',{storage:memory()});
 progress.markCompleted('gpt-3',{best:'great',stars:3});progress.markCompleted('gpt-3',{best:'worse',stars:1});
 assert.deepEqual(progress.getProgress()['gpt-3'],{played:true,completed:true,best:'great',stars:3});
 progress.markCompleted('gpt-3',{stars:0});assert.equal(progress.getProgress()['gpt-3'].stars,3);
 progress.markCompleted('lstm',{stars:1});progress.markCompleted('lstm',{best:'better',stars:2});
 assert.deepEqual(progress.getProgress().lstm,{played:true,completed:true,best:'better',stars:2});
});
test('blocked storage never throws and malformed JSON resets to empty',()=>{
 const blocked={getItem(){throw new Error('denied');},setItem(){throw new Error('denied');}};
 const progress=load('lib/progress.ts',{storage:blocked});
 assert.deepEqual(progress.getProgress(),{});assert.doesNotThrow(()=>{progress.markPlayed('bert');progress.markCompleted('bert',{stars:1});});
 for(const raw of ['{oops','[1,2]','null'])assert.deepEqual(load('lib/progress.ts',{storage:memory({'lineage-progress-v1':raw})}).getProgress(),{});
 const broken=memory({'lineage-progress-v1':'{oops'}),fresh=load('lib/progress.ts',{storage:broken});fresh.markPlayed('bert');
 assert.deepEqual(JSON.parse(broken.data['lineage-progress-v1']),{bert:{played:true,completed:false}});
});
test('chapter URLs are absolute, localised and include the site base',()=>{
 const share=load('lib/share.ts'),hosted=load('lib/share.ts',{base:'/how-llms-happened'}),origin='https://thesybuilder.github.io';
 assert.equal(share.chapterUrl('bert',{origin,locale:'en'}),'https://thesybuilder.github.io/chapters/bert/#play');
 assert.equal(share.chapterUrl('bert',{origin,locale:'zh'}),'https://thesybuilder.github.io/zh/chapters/bert/#play');
 assert.equal(share.chapterUrl('gpt-3',{origin,locale:'ar'}),'https://thesybuilder.github.io/ar/chapters/gpt-3/#play');
 assert.equal(hosted.chapterUrl('bert',{origin,locale:'en'}),'https://thesybuilder.github.io/how-llms-happened/chapters/bert/#play');
 assert.equal(hosted.chapterUrl('bert',{origin,locale:'ar'}),'https://thesybuilder.github.io/how-llms-happened/ar/chapters/bert/#play');
});
test('malformed stored entries are dropped and stars clamp to 0-3',()=>{
 const raw=JSON.stringify({a:{completed:true,stars:7},b:{completed:true,stars:-4},c:{played:true,stars:1.5},d:{played:true,stars:'2'},e:5,f:null});
 const stored=load('lib/progress.ts',{storage:memory({'lineage-progress-v1':raw})}).getProgress();
 assert.deepEqual(stored,{a:{played:true,completed:true,stars:3},b:{played:true,completed:true,stars:0},c:{played:true,completed:false,stars:1},d:{played:true,completed:false}});
});
test('X intent URLs survive lone surrogates and keep whole emoji',()=>{
 const {xIntentUrl}=load('lib/share.ts'),url=xIntentUrl('a\uD83C b\uDF89 🎉','https://a.io/\uD83D');
 const parsed=new URL(url);assert.equal(parsed.searchParams.get('text'),'a� b� 🎉');assert.equal(parsed.searchParams.get('url'),'https://a.io/�');
});
test('X intent URLs encode the post text and link',()=>{
 const {xIntentUrl}=load('lib/share.ts'),url=xIntentUrl('It guessed me 71% of the time & "won" #LLM — 预测','https://a.io/zh/chapters/bert/#play');
 assert.ok(url.startsWith('https://x.com/intent/post?text='));
 const parsed=new URL(url);assert.equal(parsed.searchParams.get('text'),'It guessed me 71% of the time & "won" #LLM — 预测');assert.equal(parsed.searchParams.get('url'),'https://a.io/zh/chapters/bert/#play');
 assert.ok(!url.includes('#play')&&!url.includes(' '));
});
test('result keys stay equal for rebuilt results and change with the outcome',()=>{
 const {resultKey}=load('lib/share.ts'),make=()=>({slug:'gpt-2',headline:'You beat GPT-2',stars:2,score:{value:7,max:10,label:'You'},shareText:'x',detail:'a'});
 assert.equal(resultKey(make()),resultKey({...make(),shareText:'y',detail:'b'}));
 for(const change of [{slug:'bert'},{headline:'GPT-2 wins'},{stars:3},{stars:undefined},{score:{value:8,max:10,label:'You'}},{score:{value:7,label:'You'}},{score:undefined}])assert.notEqual(resultKey({...make(),...change}),resultKey(make()));
});
