const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const F = require('../assets/fact-statements.js');

test('statements are well formed, uniquely identified, and cited', () => {
  const topics = new Set(F.topics.map(t => t.id));
  const ids = new Set();
  for (const it of F.items) {
    assert.ok(!ids.has(it.id), 'duplicate ' + it.id); ids.add(it.id);
    assert.ok(topics.has(it.topic), it.id + ' topic');
    assert.equal(typeof it.answer, 'boolean', it.id);
    for (const k of ['claim', 'explain', 'source']) assert.ok(it[k] && it[k].trim().length > 3, it.id + ' ' + k);
  }
  assert.equal(new Set(F.items.map(i => i.claim)).size, F.items.length, 'duplicate claim');
});

test('every topic mixes true and false statements so guessing one side fails', () => {
  for (const t of F.topics) {
    const rows = F.items.filter(i => i.topic === t.id);
    assert.ok(rows.length >= 8, t.id + ' has too few items');
    const o = rows.filter(i => i.answer).length;
    assert.ok(o >= 2 && rows.length - o >= 2, t.id + ' needs both O and X');
  }
});

test('net trade and ranking anchors match the lecture', () => {
  const get = claimPart => F.items.find(i => i.claim.includes(claimPart));
  assert.equal(get('아시아와 아프리카는 순수입').answer, true);
  assert.equal(get('중국은 아시아의 대표 곡물 순수출국').answer, false);
  assert.equal(get('쌀 수출량은 중국이 인도보다').answer, false);
  assert.equal(get('세계 최대 석탄 생산국').answer, false);
  assert.equal(get('세계 최대 카카오').answer, true);
});

test('the OX page parses, loads its data, and is linked from the classification page', () => {
  const root = path.join(__dirname, '..');
  const page = fs.readFileSync(path.join(root, 'facts.html'), 'utf8');
  for (const [, src] of page.matchAll(/<script src="([^"?]+)/g)) assert.ok(fs.existsSync(path.join(root, src)), src);
  const inline = [...page.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  assert.equal(inline.length, 1);
  new vm.Script(inline[0]);
  assert.match(fs.readFileSync(path.join(root, 'classify.html'), 'utf8'), /href="facts\.html"/);
});
