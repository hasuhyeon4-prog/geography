'use strict';
// 대륙별 합계 출산율 세 시점 (round two: data/fertility-un-regions.json, 2024학년도 수능 14번).
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const root = path.resolve(__dirname, '..');
const K = require(path.join(root, 'assets/entity-kb.js')), T = require(path.join(root, 'assets/exam-themes.js'));
const REL = require(path.join(root, 'data/exam-relations-fertility.json'));
const E = require(path.join(root, 'assets/exam-engine.js')).create(K, T);

test('Africa highest and Europe lowest hold around every column; 1960 라틴 아메리카 > 아시아 flips', () => {
  const rows = K.relations.filter(r => /^ctfr@/.test(r.indicator));
  assert.equal(rows.length, REL.relations.filter(r => /^ctfr@/.test(r.indicator)).reduce((n, r) => n + r.pairs.length, 0));
  for (const r of rows) {
    if (r.indicator === 'ctfr@1960' && r.hi === '라틴 아메리카' && r.lo === '아시아') { assert.equal(r.status, 'reversed'); continue; }
    assert.equal(r.status, 'active', JSON.stringify(r));
  }
  assert.deepEqual(K.relations.find(r => r.indicator === 'ctfr@1960').years, ['1955', '1965']);
  assert.deepEqual(K.relations.find(r => r.indicator === 'ctfr@2020').years, ['2015', REL.lastEstimate]);
  // Asia's outflow is the largest of the three net-outflow regions (L1-B1416).
  for (const lo of ['라틴 아메리카', '아프리카']) assert.equal(K.relations.find(r => r.indicator === 'cont-netmig' && r.hi === lo && r.lo === '아시아').status, 'active');
  // Africa's sign is not asked: WPP and WDI both show net inflow in some recent years.
  assert.notEqual(K.signs.find(s => s.indicator === 'cont-netmig' && s.entity === '아프리카').status, 'active');
});

test('questions keep the three TFR columns and mix recall with the table reading', () => {
  const kinds = {};
  for (let seed = 1; seed <= 200; seed++) {
    const q = E.build({themeId: 'continent-fertility', seed});
    assert.ok(q, 'seed ' + seed);
    for (const id of ['ctfr@1960', 'ctfr@1990', 'ctfr@2020']) assert.ok(q.shown.includes(id), id);
    for (const s of q.stage2.statements) {
      kinds[s.check.from ? 'change' : s.kind] = (kinds[s.check.from ? 'change' : s.kind] || 0) + 1;
      if (s.check.ind) assert.ok(!T.byId['continent-fertility'].noRecall.includes(s.check.ind), s.text);
    }
  }
  assert.ok(kinds.change < 400 && kinds.sign + kinds.compare > 300, JSON.stringify(kinds));
});
