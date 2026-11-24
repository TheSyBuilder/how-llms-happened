import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import {createRequire} from './helpers/component-require.mjs';
const compile=(file,jsx=false)=>ts.transpileModule(readFileSync(new URL(`../src/${file}`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,...(jsx?{jsx:ts.JsxEmit.ReactJSX,jsxImportSource:'preact',esModuleInterop:true}:{})}}).outputText;
const load=(file,stubs={},jsx=false)=>{const api={};new Function('require','exports',compile(file,jsx))(id=>stubs[id]??createRequire(import.meta.url)(id),api);return api;};
const eliza=load('components/eliza/engine.ts'),{presets}=load('components/eliza/presets.ts');
const game=load('components/eliza/ElizaGame.tsx',{'../../styles/games/eliza.css':{},'../../lib/progress':{markPlayed(){}},'../game/GoalBar':{default:()=>null},'../game/ResultCard':{default:()=>null},'./engine':eliza,'./presets':{presets}},true);
const chat=(...lines)=>{const state=eliza.createState();return lines.map(line=>eliza.respond(line,state));};

test('the highest-ranked keyword wins and pronouns are swapped',()=>{
 const [computer]=chat('My computer is broken.');assert.equal(computer.keyword,'computer');assert.equal(computer.rank,50);
 const [hate]=chat('You hate me.');assert.equal(hate.text,'Why do you think I hate you?');assert.deepEqual(hate.tells,[]);
 const [clause]=chat('Hmm, well, I remember the sea');assert.equal(clause.keyword,'remember');assert.equal(clause.text,'Do you often think of the sea?');
});
test('"you are X" quotes X, and words naming Object members are not substituted',()=>{
 assert.equal(chat('You are smart.')[0].text,'What makes you think I am smart?');
 assert.equal(chat('my constructor')[0].text,'Your constructor?');
});
test('nothing after "you are" never prints "I are", across every reply in the cycle',()=>{
 const {replies}=eliza.script.you.rules.find(rule=>rule.pattern==='* i are');
 for(const input of ['You are.','I know you are.','My friend says you are.']){
  const seen=new Set(chat(...Array(replies.length*2).fill(input)).map(reply=>reply.text));
  assert.deepEqual([...seen].sort(),[...replies].sort(),input);
  for(const text of seen)assert.doesNotMatch(text,/\bI are\b/i);
 }
});
test('reassembly rules are used in turn and "my" fills the memory queue',()=>{
 const replies=chat('I am sad.','I am sad.','My mother worries about me.','Pizza and chips.');
 assert.notEqual(replies[0].text,replies[1].text);assert.deepEqual(replies[1].choice,[2,4]);
 assert.equal(replies[3].kind,'memory');assert.match(replies[3].text,/your mother worries about you/);
});
test('each tell is detected from the rule that fired',()=>{
 const [broken]=chat('I feel angry at you.');assert.equal(broken.text,'Do you often feel angry at I?');assert.deepEqual(broken.tells,['reflection']);assert.equal(broken.broken,'at I');
 const fallbacks=chat('Pizza.','Chips.','Salad.','Soup.','Bread.');
 assert.ok(fallbacks.every(r=>r.kind==='fallback'&&r.tells.includes('fallback')));assert.deepEqual(fallbacks[4].tells,['fallback','repeat']);
 assert.deepEqual(chat('Hello','Hello')[1].tells,['repeat']);
 assert.equal(chat('你好')[0].text,'I am sorry, I only speak English.');
});
test('templates are grammatical, so a broken phrase always comes from the user’s words',()=>{
 for(const [name,entry] of Object.entries(eliza.script))for(const rule of [...entry.rules??[],...(entry.memory?[entry.memory]:[])])for(const reply of rule.replies)
  assert.equal(eliza.brokenPhrase(reply.toLowerCase().replace(/\$\d/g,'x')),undefined,`${name}: ${reply}`);
});
test('stars reward fewer messages and the share text names the year',()=>{
 assert.deepEqual([3,5,6,8,9].map(eliza.elizaStars),[3,3,2,2,1]);
 assert.equal(game.outcome(4).shareText,'I caught ELIZA (1966) out in 4 messages.');assert.equal(game.outcome(4).stars,3);
 assert.equal(presets.length,5);for(const item of presets)assert.ok(eliza.respond(item.message,eliza.createState()).text);
});
test('ELIZA’s English lines never match a translation key, so they stay English',()=>{
 const lines=[eliza.OPENING,...presets.flatMap(p=>[p.message,p.modern]),...Object.values(eliza.script).flatMap(e=>(e.rules??[]).flatMap(r=>r.replies))].filter(s=>!s.includes('$')&&!s.startsWith('='));
 for(const locale of ['zh','ar']){
  const dir=new URL(`../src/i18n/${locale}/`,import.meta.url);
  const keys=new Set(readdirSync(dir).filter(f=>f.endsWith('.json')).flatMap(f=>Object.keys(JSON.parse(readFileSync(new URL(f,dir),'utf8')).text??{})));
  for(const line of lines)assert.ok(!keys.has(line),`${locale}: ${line}`);
 }
});
