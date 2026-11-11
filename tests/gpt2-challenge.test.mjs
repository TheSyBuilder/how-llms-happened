import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createRequire} from './helpers/component-require.mjs';
import test from 'node:test';
import ts from 'typescript';
const data=JSON.parse(readFileSync(new URL('../src/data/gpt2-challenge.json',import.meta.url),'utf8'));
const stubs={'../../styles/gpt2-challenge.css':{},'../../i18n/core':{t:s=>s},'../../lib/progress':{markPlayed(){}},'../game/GoalBar':{default:()=>null},'../game/ResultCard':{default:()=>null},'../../data/gpt2-challenge.json':data};
const {outputText}=ts.transpileModule(readFileSync(new URL('../src/components/hero/Gpt2Challenge.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,jsxImportSource:'preact',esModuleInterop:true}});
const api={};new Function('require','exports',outputText)(id=>stubs[id]??createRequire(import.meta.url)(id),api);

test('recorded data has 30 four-option items with normalised GPT-2 probabilities',()=>{
 assert.equal(data.items.length,30);assert.match(data.model,/gpt2/);assert.match(data.library,/@huggingface\/transformers \d/);
 assert.equal(new Set(data.items.map(item=>item.id)).size,30);
 for(const item of data.items){
  assert.equal(item.options.length,4,item.id);assert.equal(new Set(item.options).size,4,item.id);
  assert.ok(Number.isInteger(item.answer)&&item.options[item.answer]!==undefined,item.id);
  assert.equal(item.probs.length,4,item.id);assert.ok(item.probs.every(p=>p>=0&&p<=1),item.id);
  assert.ok(Math.abs(item.probs.reduce((a,b)=>a+b,0)-1)<.002,item.id);
  assert.equal(typeof item.top1,'string');
 }
 const right=data.items.filter(item=>api.gpt2Pick(item.probs)===item.answer).length;
 assert.ok(right>5&&right<25,`GPT-2 should win some rounds and lose others (right on ${right})`);
});
test('English example words never match a translation key, so they stay English',()=>{
 for(const locale of ['zh','ar']){
  const dir=new URL(`../src/i18n/${locale}/`,import.meta.url);
  const keys=new Set(readdirSync(dir).filter(f=>f.endsWith('.json')).flatMap(f=>Object.keys(JSON.parse(readFileSync(new URL(f,dir),'utf8')).text??{})));
  for(const item of data.items)for(const text of [item.prefix,...item.options])assert.ok(!keys.has(text),`${locale}: ${text}`);
 }
});
test('round selection is seedable, distinct and can lead with a fixed opener',()=>{
 const a=api.pickRounds(7),b=api.pickRounds(7);
 assert.deepEqual(a,b);assert.equal(a.length,10);assert.equal(new Set(a).size,10);assert.ok(a.every(i=>i>=0&&i<30));
 assert.notDeepEqual(api.pickRounds(8),a);
 const led=api.pickRounds(3,10,30,api.OPENING);assert.equal(led[0],api.OPENING);assert.equal(new Set(led).size,10);
 assert.equal(data.items[api.OPENING].id,'canberra');
 assert.equal(new Set(api.pickRounds(1,30,30)).size,30);
});
test('GPT-2 picks the most probable option and scoring counts both players',()=>{
 assert.equal(api.gpt2Pick([.1,.6,.2,.1]),1);assert.equal(api.gpt2Pick([.4,.4,.1,.1]),0);
 const rounds=[{answer:0,probs:[.7,.1,.1,.1]},{answer:2,probs:[.7,.1,.1,.1]},{answer:3,probs:[0,0,0,1]}];
 assert.deepEqual(api.score(rounds,[0,2,-1]),{you:2,gpt:2});
 assert.deepEqual(api.score(rounds,[1]),{you:0,gpt:1});
});
test('stars and the result card reflect who won',()=>{
 assert.equal(api.stars(9,10),3);assert.equal(api.stars(10,4),3);assert.equal(api.stars(7,5),2);assert.equal(api.stars(5,5),1);assert.equal(api.stars(4,6),0);
 const win=api.outcome(7,5);
 assert.equal(win.slug,'gpt-2');assert.equal(win.headline,'You 7 · GPT-2 5. You beat GPT-2.');assert.equal(win.stars,2);
 assert.equal(win.shareText,'I scored 7/10 vs GPT-2\'s 5/10 on "Are you smarter than GPT-2?"');
 assert.equal(api.outcome(3,6).headline,'You 3 · GPT-2 6. GPT-2 wins this time.');
 assert.equal(api.outcome(5,5).headline,"You 5 · GPT-2 5. It's a tie.");
});
