import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
function logic(name) {
 const source=readFileSync(new URL(`../src/components/early/${name}.ts`,import.meta.url),'utf8');
 const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}});
 const result={};new Function('exports',outputText)(result);return result;
}
const letter=logic('letter-game'),zero=logic('zero-game'),speech=logic('speech-game'),vector=logic('vector-game'),elman=logic('elman-game'),vault=logic('vault-game');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
test('the Markov counter tallies what followed each pair and backs off on ties',()=>{
 const {predictNext,tallyPairs}=letter;
 assert.deepEqual(tallyPairs([...'ABABA']),{AA:[0,0],AB:[2,0],BA:[0,1],BB:[0,0]});
 assert.equal(predictNext([]).guess,'A');
 assert.equal(predictNext([...'ABABA']).guess,'B');
 assert.deepEqual(predictNext([...'AAB']),{guess:'A',context:'',counts:[2,1]});
 assert.deepEqual(predictNext([...'ABA']),{guess:'B',context:'A',counts:[0,1]});
 assert.equal(predictNext([...'AABBB']).guess,'B');
});
test('a strict alternator is caught almost every time, and the guess never peeks',()=>{
 const {scoreRun,predictNext}=letter,run=Array.from({length:30},(_,i)=>i%2?'B':'A');
 const scored=scoreRun(run);assert.ok(scored.rate>.85,`${scored.rate}`);
 for(let i=0;i<run.length;i++)assert.equal(predictNext(run.slice(0,i)).guess,predictNext(run.slice(0,i)).guess);
 const flipped=[...run];flipped[29]=flipped[29]==='A'?'B':'A';
 assert.equal(scoreRun(flipped).marks.slice(0,29).join(),scored.marks.slice(0,29).join());
});
test('random-choice stars need a hit rate near chance',()=>{
 const {letterStars,keyPress}=letter;
 assert.deepEqual([.5,.55,.56,.62,.63,.7,.71].map(letterStars),[3,3,2,2,1,1,0]);
 assert.deepEqual(['a','B','ArrowLeft','ArrowRight','x'].map(keyPress),['A','B','A','B',undefined]);
});
test('an unseen drink crashes the unsmoothed counter and smoothing keeps the budget at one',()=>{
 const {drinks,drinkProbability,orderBits,crashes,orderKey}=zero;
 assert.equal(orderBits(['tea','tea','coffee'],0)<Infinity,true);
 assert.equal(crashes(['tea','juice','tea']),true);
 assert.equal(orderBits(['milk','tea','tea'],0),Infinity);
 for(const r of zero.reserves)near(drinks.reduce((s,d)=>s+drinkProbability(d,r),0),1);
 near(orderBits(['tea'],0),-Math.log2(.6));
 assert.equal(orderKey(['juice','tea','tea']),orderKey(['tea','juice','tea']));
});
test('the best rescue reserve grows with the share of unseen cups',()=>{
 const {rescueTotals,zeroStars,unseenCups}=zero,best=o=>[...rescueTotals(o)].sort((a,b)=>a.bits-b.bits)[0].reserve;
 const few=[['juice','tea','tea'],['water','tea','coffee'],['milk','tea','tea']],many=[['juice','water','milk'],['juice','juice','water'],['milk','milk','water']];
 assert.equal(unseenCups(few),3);assert.equal(unseenCups(many),9);
 assert.ok(best(few)<best(many));
 assert.ok(rescueTotals(few).every(t=>Number.isFinite(t.bits)));
 assert.equal(zeroStars(best(few),few),3);
 const ranked=[...rescueTotals(few)].sort((a,b)=>a.bits-b.bits);
 assert.equal(zeroStars(ranked[1].reserve,few),2);assert.equal(zeroStars(ranked[3].reserve,few),1);
});
test('the language model fixes most sound-alike mix-ups but misreads one round',()=>{
 const {speechRounds,decodePhrase,decoderScore,speechStars}=speech;
 assert.equal(speechRounds.length,5);
 assert.equal(decoderScore(false),2);assert.equal(decoderScore(true),4);
 for(const r of speechRounds)for(const lm of [true,false]){const d=decodePhrase(r,lm);near(d.share[0]+d.share[1],1);}
 const goalie=speechRounds.find(r=>r.cue==='He is');
 assert.equal(decodePhrase(goalie,false).pick,goalie.meant);assert.notEqual(decodePhrase(goalie,true).pick,goalie.meant);
 assert.deepEqual([5,4,3,2].map(speechStars),[3,2,1,0]);
});
test('word-vector ranks put the secret first and survive rescaling',()=>{
 const {parseVectors,rankFrom,cosine}=vector;
 const vectors=new Int8Array([100,0, 90,20, 0,100, -100,0, 50,0]);
 const data=parseVectors({words:['sea','ocean','money','land','lake'],dim:2},vectors.buffer);
 const {rank,order}=rankFrom(data,0);
 assert.equal(rank[0],0);assert.equal(rank[4],1);assert.equal(order.at(-1),3);
 near(cosine(data,0,4),1);near(cosine(data,0,3),-1);
 assert.throws(()=>parseVectors({words:['a'],dim:3},new Int8Array(2).buffer));
});
test('daily secrets are deterministic, cycle through every word and guesses forgive plurals',()=>{
 const {dayNumber,secretFor,secrets,normalizeGuess}=vector;
 assert.equal(dayNumber(new Date(2026,10,1,23,30)),1);assert.equal(dayNumber(new Date(2026,10,18,0,5)),18);
 assert.equal(new Set(Array.from({length:secrets.length},(_,d)=>secretFor(d))).size,secrets.length);
 const has=w=>['cat','city','box'].includes(w);
 assert.deepEqual(['Cats',' city ','cities','boxes','dog',''].map(w=>normalizeGuess(w,has)),['cat','city','city','box',undefined,undefined]);
});
test('closest-word stars, hints and the spoiler-free strip',()=>{
 const {vectorStars,shareStrip,hintRank}=vector;
 assert.deepEqual([[true,9],[true,10],[true,24],[true,25],[false,3]].map(([s,n])=>vectorStars(s,n)),[3,2,2,1,0]);
 assert.equal(shareStrip([400,60,8,0]),'⬜🟨🟧🟩');
 assert.equal([...shareStrip(Array(40).fill(500))].length,26);
 assert.equal(hintRank(undefined,5000),100);assert.equal(hintRank(9,5000),4);assert.equal(hintRank(1,5000),1);
});
test('a clue fades through fillers, lasting longer with more copying',()=>{
 const {clueTrace,clueLife,lean,elmanRounds,LEAN}=elman;
 const lives=elmanRounds.map(r=>clueLife(r.weight));
 assert.deepEqual(lives,[2,6,12]);
 const trace=clueTrace(.5,4);near(trace[0],Math.tanh(1));near(trace[1],Math.tanh(.5*Math.tanh(1)));
 assert.ok(lean(trace[2])>=LEAN&&lean(trace[3])<LEAN);
 assert.equal(clueLife(0),0);near(lean(0),.5);
});
test('elman bets score by distance and stars need near-perfect bets',()=>{
 const {betPoints,elmanStars}=elman;
 assert.deepEqual([[6,6],[5,6],[8,6],[12,6]].map(([b,a])=>betPoints(b,a)),[3,2,1,0]);
 assert.deepEqual([9,8,7,5,4,3,2].map(elmanStars),[3,3,2,2,1,1,0]);
});
test('LSTM gates: keep protects, write adds, keep off forgets',()=>{
 const {gatedCell,vaultStep}=vault;
 near(gatedCell(1,-1,1,0,1).cell,1);near(gatedCell(1,-1,1,0,0).visible,0);near(gatedCell(1,-1,0,1,1).cell,-1);near(gatedCell(1,-1,.8,.5,1).cell,.3);
 const noise={value:4,kind:'noise'};
 assert.equal(vaultStep(7,noise,{keep:true,write:false}),7);
 assert.equal(vaultStep(7,noise,{keep:true,write:true}),11);
 assert.equal(vaultStep(7,noise,{keep:false,write:false}),0);
});
test('every vault can be opened, holding is not unlimited, and later vaults are harder',()=>{
 const {makeStream,vaultLevels,expectedCode,runVault,perfectGates,vaultStars}=vault;
 let seed=1;const random=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(let n=0;n<50;n++)for(const level of vaultLevels){
  const stream=makeStream(level.pattern,random),code=expectedCode(stream);
  assert.equal(stream.length,level.pattern.length);
  assert.equal(runVault(stream,perfectGates(stream)),code);
  assert.notEqual(runVault(stream,stream.map(()=>({keep:true,write:true}))),code);
  assert.ok(stream.filter(b=>b.kind==='noise').every(b=>b.value!==code));
 }
 const counts=vaultLevels.map(l=>l.pattern.split('').filter(c=>c==='.').length);
 assert.ok(counts[0]<counts[1]&&counts[1]<counts[2]);assert.ok(vaultLevels[2].beatMs<vaultLevels[0].beatMs);
 const replaced=makeStream('.C..N....',random);assert.equal(runVault(replaced,replaced.map(b=>({keep:true,write:b.kind!=='noise'}))),replaced.find(b=>b.kind==='code').value+expectedCode(replaced));
 assert.deepEqual([0,1,2,3].map(vaultStars),[0,1,2,3]);
});
