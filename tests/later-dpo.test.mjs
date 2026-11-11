import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import {createRequire} from './helpers/component-require.mjs';
const real=createRequire(import.meta.url);
function load(path){const {outputText}=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,jsxImportSource:'preact'}});const exports={};new Function('require','exports',outputText)(id=>id==='./played'?load('../src/components/later/played.ts'):/\.css$|\/game\/|\/lib\/progress/.test(id)?{default:()=>null,markPlayed(){}}:real(id),exports);return exports;}
const api=load('../src/components/later/Dpo.tsx');
const good=(pair,round)=>{const k=api.contrasts[round];return k==='f'?1:0;};
function play(choose){let p=api.reference;for(let r=0;r<api.ROUNDS;r++){const pair=api.pairFor(p,r),i=choose(pair,r);p=api.dpoStep(p,pair[i],pair[1-i]);}return p;}
test('a DPO step moves the model toward the chosen answer, and less once it already agrees',()=>{
 const chosen={h:1,f:0},rejected={h:0,f:0};
 assert.equal(api.margin(api.reference,chosen,rejected),0);
 const one=api.dpoStep(api.reference,chosen,rejected),two=api.dpoStep(one,chosen,rejected);
 assert.ok(api.traitOdds(one).helpful>.5);assert.ok(two.h-one.h<one.h-api.reference.h);assert.equal(one.f,api.reference.f);
});
test('rewarding flair drifts into pirate-speak, careful picks earn three stars',()=>{
 const pirate=play(()=>0);assert.ok(api.traitOdds(pirate).pirate>.75);assert.equal(api.answerText(0,{h:1,f:1},pirate).start,'Shiver me timbers, ye landlubber! ');
 const careful=play((pair,r)=>good(pair,r));assert.ok(api.plainHelpful(careful)>=80,`${api.plainHelpful(careful)}`);
 assert.equal(api.dpoStars(api.plainHelpful(careful)),3);assert.ok(api.dpoStars(api.plainHelpful(pirate))<=1);
 assert.equal(api.plainHelpful(api.reference),30);
});
