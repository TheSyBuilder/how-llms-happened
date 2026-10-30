import test from 'node:test';
import assert from 'node:assert/strict';
import {nextTokenOdds, sampleToken, letterPattern} from '../src/components/curiosity-toys.mjs';

test('temperature changes the spread without changing token order or total probability', () => {
 const cool = nextTokenOdds(1, 0.4), warm = nextTokenOdds(1, 1), hot = nextTokenOdds(1, 1.6);
 assert.ok(Math.abs(warm[0].probability - 0.6) < 1e-12);
 assert.ok(cool[0].probability > warm[0].probability && warm[0].probability > hot[0].probability);
 for(const distribution of [cool,warm,hot]) {
  assert.deepEqual(distribution.map(c=>c.word), ['model','cat','moon']);
  assert.ok(Math.abs(distribution.reduce((s,c)=>s+c.probability,0)-1) < 1e-12);
 }
 assert.deepEqual(nextTokenOdds(6), []);
});
test('sampling uses the cumulative distribution, including both ends', () => {
 const choices = nextTokenOdds(1);
 assert.equal(sampleToken(choices,0),'model');
 assert.equal(sampleToken(choices,0.7),'cat');
 assert.equal(sampleToken(choices,0.99),'moon');
 assert.equal(sampleToken([]),undefined);
});
test('letter pairs ignore punctuation and exclude the last letter as a predecessor', () => {
 assert.deepEqual(letterPattern('Ba-na-na!').following, {V:{vowels:0,total:2},C:{vowels:3,total:3}});
 assert.deepEqual(letterPattern('queue').following, {V:{vowels:3,total:3},C:{vowels:1,total:1}});
 assert.deepEqual(letterPattern('123 👋').letters, []);
 assert.deepEqual(letterPattern('A').following, {V:{vowels:0,total:0},C:{vowels:0,total:0}});
});
