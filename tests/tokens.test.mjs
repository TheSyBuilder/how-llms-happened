import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import test from 'node:test';
import ts from 'typescript';
import {createRequire} from './helpers/component-require.mjs';
// Expected ids were confirmed with an independent GPT-2 (r50k_base) tokenizer, gpt-tokenizer 2.9.0.
const compile=(file,jsx=false)=>ts.transpileModule(readFileSync(new URL(`../src/${file}`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,...(jsx?{jsx:ts.JsxEmit.ReactJSX,jsxImportSource:'preact',esModuleInterop:true}:{})}}).outputText;
const load=(file,stubs={},jsx=false)=>{const api={};new Function('require','exports',compile(file,jsx))(id=>stubs[id]??createRequire(import.meta.url)(id),api);return api;};
const bpe=load('components/tokens/bpe.ts'),words=load('components/tokens/words.ts');
const bin=readFileSync(new URL('../public/data/tokens-gpt2.bin',import.meta.url)),list=readFileSync(new URL('../public/data/tokens-words.txt',import.meta.url),'utf8');
const vocab=bpe.unpackVocab(bin),dictionary=words.decodeWords(list);
const game=load('components/tokens/TokensGame.tsx',{'../../styles/games/tokens.css':{},'../../i18n/core':{withSiteBase:s=>s},'../../lib/progress':{markPlayed(){}},'../game/GoalBar':{default:()=>null},'../game/ResultCard':{default:()=>null},'./bpe':bpe,'./words':words},true);

test('packed data records its source and licence and stays small',()=>{
 assert.match(vocab.meta.source,/openai-community\/gpt2/);assert.match(vocab.meta.licence,/MIT/);assert.match(vocab.meta.licenceText,/Copyright \(c\) 2019 OpenAI/);
 assert.equal(vocab.left.length,50000);assert.equal(vocab.bytes.length,50256);
 assert.ok(gzipSync(bin).length+gzipSync(list).length<600*1024);
 assert.match(dictionary.meta.licence,/[Pp]ublic domain/);
});
test('GPT-2 tokenisations match the reference',()=>{
 const cases={' strawberry':[41236],'Hello world':[15496,995],'🙂':[8582,25081],'你好，世界':[19526,254,25001,121,171,120,234,10310,244,45911,234],"I'm can't we'll":[40,1101,460,470,356,1183],'  two  spaces\n':[220,734,220,9029,198],'3.14159':[18,13,1415,19707],' international':[3230],'international':[45609],' phytohemagglutinin':[872,88,1462,4411,363,4743,315,259,259]};
 for(const [text,ids] of Object.entries(cases))assert.deepEqual(bpe.encodeIds(text,vocab),ids,JSON.stringify(text));
 assert.deepEqual(bpe.tokenize('🙂',vocab).map(t=>t.partial),[true,true]);
 assert.equal(bpe.tokenize(' strawberry',vocab)[0].text,' strawberry');
});
test('byte-to-unicode map gives every byte a visible stand-in',()=>{
 const map=bpe.bytesToUnicode();assert.equal(new Set(map).size,256);
 assert.equal(map[32],'Ġ');assert.equal(map[0],'Ā');assert.equal(map[65],'A');assert.equal(map[10],'Ċ');
 assert.equal(bpe.tokenSpelling(41236,vocab),'Ġstrawberry');
});
test('word list decodes and the challenges score as described',()=>{
 assert.equal(dictionary.meta.count,172823);assert.ok(dictionary.has('strawberry')&&!dictionary.has('xqzvt'));
 assert.deepEqual(dictionary.meta.record,{word:'phytohemagglutinin',tokens:9});
 assert.equal(game.longCheck('international',vocab).done,true);
 assert.equal(game.longCheck('strawberry',vocab).done,true);
 assert.equal(game.longCheck('antidisestablishmentarianism',vocab).done,false);
 assert.equal(game.longCheck('cat',vocab).done,false);
 let {board,note}=game.addWord([],'Phytohemagglutinin',vocab,dictionary);
 assert.deepEqual(board,[{word:'phytohemagglutinin',tokens:9}]);assert.match(note,/9 tokens/);
 ({board}=game.addWord(board,'cat',vocab,dictionary));({board}=game.addWord(board,'cat',vocab,dictionary));
 assert.deepEqual(board.map(e=>e.word),['phytohemagglutinin','cat']);
 assert.equal(game.addWord(board,'qwrtzp',vocab,dictionary).board,board);
 assert.equal(game.outcome(4,2).shareText,'My name costs 4 tokens.');assert.equal(game.outcome(1,3).stars,3);
});
