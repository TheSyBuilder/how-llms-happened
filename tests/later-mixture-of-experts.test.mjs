import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import {createRequire} from './helpers/component-require.mjs';
const real=createRequire(import.meta.url);
function load(path){const {outputText}=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,jsxImportSource:'preact'}});const exports={};new Function('require','exports',outputText)(id=>id==='./played'?load('../src/components/later/played.ts'):/\.css$|\/game\/|\/lib\/progress/.test(id)?{default:()=>null,markPlayed(){}}:real(id),exports);return exports;}
const api=load('../src/components/later/MixtureOfExperts.tsx');
test('the token stream is seeded and arrives on a fixed beat',()=>{
 assert.deepEqual(api.makeStream(7),api.makeStream(7));
 const s=api.makeStream(7);assert.equal(s.length,43);assert.ok(s.every(t=>t.at<api.DURATION));
});
test('capacity drops overflow, and a full queue loses its oldest token',()=>{
 let sim=api.newSim(1);sim={...sim,stream:[0,0,0].map((kind,id)=>({id,kind,word:'7',at:.1}))};
 sim=api.advance(sim,.2);assert.equal(sim.queue.length,3);
 sim=api.route(api.route(sim,0),0);assert.equal(sim.points,6);assert.equal(sim.matched,2);
 sim=api.route(sim,0);assert.equal(sim.dropped,1);assert.equal(sim.processed,2);
 sim=api.advance(sim,.2+api.WORK);assert.ok(api.hasRoom(sim,0));
 let crowd=api.newSim(1);crowd={...crowd,stream:[0,1,2,0].map((kind,id)=>({id,kind,word:'x',at:.1}))};
 crowd=api.advance(crowd,.2);assert.equal(crowd.queue.length,3);assert.equal(crowd.dropped,1);assert.equal(crowd.queue[0].id,1);
});
test('the learned router beats sending every token to its specialist',()=>{
 for(const seed of [1,2,3,99]){
  const router=api.learnedRouter(seed);let greedy=api.newSim(seed);
  for(const t of greedy.stream){greedy=api.advance(greedy,t.at);greedy=api.route(greedy,t.kind);}
  assert.ok(router.points>greedy.points,`${seed}: ${router.points} vs ${greedy.points}`);assert.ok(router.dropped<greedy.dropped);
 }
 assert.deepEqual([api.moeStars(46,50),api.moeStars(38,50),api.moeStars(25,50),api.moeStars(10,50)],[3,2,1,0]);
});
