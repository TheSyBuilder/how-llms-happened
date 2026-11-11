import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import {createRequire} from './helpers/component-require.mjs';
const real=createRequire(import.meta.url);
function load(path){const {outputText}=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,jsxImportSource:'preact'}});const exports={};new Function('require','exports',outputText)(id=>id==='./played'?load('../src/components/later/played.ts'):/\.css$|\/game\/|\/lib\/progress|ExperimentVisual/.test(id)?{default:()=>null,markPlayed(){}}:real(id),exports);return exports;}
const api=load('../src/components/later/Chinchilla.tsx');
const visual=load('../src/components/ExperimentVisual.tsx');
test('the refitted law puts Gopher’s budget optimum near Chinchilla, about 20 tokens per parameter',()=>{
 const c=api.budgets[2].compute,n=api.optimalParams(c),ratio=api.tokensFor(c,n)/n;
 assert.ok(n>60e9&&n<85e9,`${n}`);assert.ok(ratio>15&&ratio<25,`${ratio}`);
 assert.ok(api.lossAt(70e9,api.tokensFor(c,70e9))<api.lossAt(280e9,api.tokensFor(c,280e9)));
 for(const b of api.budgets){const best=api.optimalParams(b.compute);for(const f of [.5,2])assert.ok(api.lossAt(best,api.tokensFor(b.compute,best))<api.lossAt(best*f,api.tokensFor(b.compute,best*f)));}
});
test('the game starts far from the answer and scores by distance from the optimum',()=>{
 for(const b of api.budgets){assert.equal(api.roundScore(api.optimalParams(b.compute),b.compute),100);assert.ok(api.roundScore(10**api.maxLog,b.compute)<35);}
 assert.equal(api.roundScore(api.optimalParams(1e21)*10,1e21),0);
 assert.ok(api.gopherScore()<60&&api.gopherScore()>20);
 assert.deepEqual([api.chinchillaStars(300),api.chinchillaStars(254),api.chinchillaStars(119)],[3,2,0]);
 assert.deepEqual([api.formatCount(280e9),api.formatCount(1.4e12),api.formatCount(2.78e9)],['280B','1.4T','2.8B']);
});
test('the budget rectangle keeps a constant area inside its axes at both slider ends',()=>{
 for(const p of [0,.5,1,-1,2]){const {width,height}=visual.budgetBox(p);assert.ok(width<=360.001&&height<=180.001,`${p}`);assert.ok(Math.abs(width*height-6400)<1e-6);}
});
