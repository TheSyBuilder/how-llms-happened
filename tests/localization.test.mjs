import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const {outputText}=ts.transpileModule(readFileSync(new URL('../src/i18n/core.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}});
const api={};new Function('exports',outputText)(api);
test('locale links preserve chapters and anchors without rewriting external sources',()=>{
 assert.equal(api.localePath('/ar/chapters/bert/#play','zh'),'/zh/chapters/bert/#play');
 assert.equal(api.localePath('/zh/chapters/bert/','en'),'/chapters/bert/');
 for(const path of ['https://arxiv.org/a','#play','/_astro/a.js','//example.org'])assert.equal(api.localePath(path,'ar'),path);
 assert.equal(api.localeFromPath('/archive/'),'en');
});
test('translated results retain variable values and surrounding spacing',()=>{
 const t=api.translator({'Keep {0} of {1} messages':'保留 {1} 条中的 {0} 条','Read?':'نقرأ؟'});
 assert.equal(t('Keep 2 of 4 messages'),'保留 4 条中的 2 条');
 assert.equal(t(' Read? '),' نقرأ؟ ');
 assert.equal(t('untranslated data'),'untranslated data');
});
