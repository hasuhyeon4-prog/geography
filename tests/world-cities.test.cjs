'use strict';
// 세계 도시 기준점 theme (round two: data/exam-world-cities.json).
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..'), read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const K = require(path.join(root, 'assets/entity-kb.js')), T = require(path.join(root, 'assets/exam-themes.js'));
const E = require(path.join(root, 'assets/exam-engine.js')).create(K, T);
const WC = read('data/exam-world-cities.json'), cards = read('data/concepts/cities.json'), r2 = read('data/world-city-clues-round2.json');

test('clues are the lecture cells, and capital status matches the round-two list', () => {
  const cells = cards.sets['L1-B1706-c2'].values;
  for (const [n, c] of Object.entries(WC.cities)) {
    const fromTable = c.clues.filter(x => x.source.endsWith('L1-B1706'));
    for (const x of fromTable) assert.deepEqual([x.text], cells[n], n);
    assert.ok(!c.clues.some(x => x.text.includes(n)), n + ' named in its own clue');
    assert.equal(K.entities[n].type, 'site');
    if (n === '토론토') {
      // Round three: the lecture's own sentence (L1-B1673) with the name taken out; no capital claim.
      const t = read('data/toronto-clues-round3.json');
      assert.deepEqual(K.entities[n].label, t.place);
      assert.equal(t.verbatim, '토론토는 ' + c.clues[0].text);
      assert.ok(!(n in WC.facts.cityCapital.values) && !(n in WC.facts.cityRegion.values));
      continue;
    }
    assert.deepEqual(K.entities[n].label, cards.entities[n].place, n);
    assert.equal(WC.facts.cityCapital.values[n] === 'capital', r2.capitalStatus[n], n);
  }
  // 싱가포르 is a country 대상; a city of the same name would overwrite it.
  assert.equal(K.entities['싱가포르'].type, 'country');
  assert.ok(!T.byId['world-city-clues'].pool.includes('싱가포르'));
});

test('city <보기> are lecture facts; false ones use another city of the question; no ranks', () => {
  let built = 0;
  for (let seed = 1; seed <= 300; seed++) {
    const q = E.build({themeId: 'world-city-clues', seed});
    if (!q) continue;
    built++;
    for (const s of q.stage2.statements) {
      assert.ok(['fact', 'both'].includes(s.kind), s.text);
      assert.ok(['cityCapital', 'cityUN', 'cityRegion'].includes(s.check.set), s.text);
      if (s.kind === 'fact') {
        assert.equal(K.entities[s.check.entity].facts[s.check.set].values.includes(s.check.value), s.truth, s.text);
        if (!s.truth) assert.ok(q.entities.some(n => n !== s.check.entity && ((K.entities[n].facts[s.check.set] || {}).values || []).includes(s.check.value)), s.text);
      }
    }
    assert.ok(q.stage2.statements.some(s => !s.truth));
  }
  assert.ok(built >= 290, 'built ' + built);
  // The climate theme draws no city facts though 런던·파리 are its stations too.
  for (let seed = 1; seed <= 100; seed++) {
    const q = E.build({themeId: 'climate-graphs', seed});
    if (q) for (const s of q.stage2.statements) assert.ok(!/^city/.test((s.check || {}).set || ''), s.text);
  }
});
