import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import {createRequire} from './helpers/component-require.mjs';
const real=createRequire(import.meta.url);
function load(path){const {outputText}=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,jsxImportSource:'preact'}});const exports={};new Function('require','exports',outputText)(id=>id==='./played'?load('../src/components/later/played.ts'):/\.css$|\/game\/|\/lib\/progress/.test(id)?{default:()=>null,markPlayed(){}}:real(id),exports);return exports;}
const api=load('../src/components/later/ToolsAndAgents.tsx');
const pick=(agent,tool,match)=>api.callTool(agent,tool,api.toolOptions(agent,tool).find(o=>o.input.includes(match)));
test('search, calculate, convert reaches the right bill in three calls',()=>{
 let a=api.newAgent(3);
 assert.equal(api.toolOptions(a,'converter').length,0);
 assert.ok(api.toolOptions(a,'calculator').every(o=>o.note));
 a=pick(a,'search','omakase');assert.ok(a.knowsPrice);
 a=pick(a,'calculator','3 × ¥4,300 × 1.10');assert.deepEqual(a.yen,[14190]);
 a=pick(a,'converter','¥14,190');assert.deepEqual(a.usd,[94.6]);
 assert.equal(api.correctUsd(3),94.6);assert.notEqual(api.noToolsAnswer(3),api.correctUsd(3));
 assert.equal(api.agentStars(a.calls.length,true),3);
});
test('skipping the lookup forces a guess, and the step limit holds',()=>{
 let a=api.newAgent(2);a=pick(a,'calculator','¥3,500');a=api.callTool(a,'converter',api.toolOptions(a,'converter')[0]);
 assert.notEqual(a.usd[0],api.correctUsd(2));
 for(let i=0;i<10;i++)a=pick(a,'search','best');
 assert.equal(a.calls.length,api.MAX_CALLS);
 assert.deepEqual([4,5,6].map(n=>api.agentStars(n,true)),[2,1,1]);assert.equal(api.agentStars(3,false),0);
});
