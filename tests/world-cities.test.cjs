'use strict';
// 세계 도시 theme (data/exam-world-cities.json, rebuilt after the 2026-10-23 audit).
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..'), read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const K = require(path.join(root, 'assets/entity-kb.js')), T = require(path.join(root, 'assets/exam-themes.js'));
const E = require(path.join(root, 'assets/exam-engine.js')).create(K, T);
const WC = read('data/exam-world-cities.json'), theme = T.byId['world-city-clues'];
const COUNTRY = /영국|프랑스|일본|미국|캐나다|오스트레일리아/;

test('clues name no city, and name a country only where the lecture has no other sentence', () => {
  for (const [n, c] of Object.entries(WC.cities)) {
    assert.equal(K.entities[n].type, 'site', n);
    assert.ok(theme.pool.includes(n), n);
    for (const k of c.clues) {
      for (const other of Object.keys(WC.cities)) assert.ok(!k.text.includes(other), n + ' clue names ' + other);
      if (COUNTRY.test(k.text)) assert.ok(['도쿄', '토론토'].includes(n), n + ' clue names its country: ' + k.text);
      assert.match(k.source, /^강의 1권 P05 \/ L1-B\d{4}$/);
    }
  }
  assert.deepEqual(K.entities['토론토'].label, read('data/toronto-clues-round3.json').place);
  // 싱가포르 is a country 대상; a city of the same name would overwrite it.
  assert.equal(K.entities['싱가포르'].type, 'country');
});

test('every city has its capital status with the real capital named, and one UN fact', () => {
  for (const n of theme.pool) {
    const cap = WC.facts.cityCapital.values[n], un = WC.facts.cityUN.values[n];
    assert.ok(cap && un, n);
    if (cap.value === 'notCapital') assert.match(cap.note, /수도는 /, n);
    assert.equal(un.value === 'un', n === '뉴욕', n);
  }
});

test('<보기> truth does not follow their wording, and no "모두" pair is asked', () => {
  const by = {};
  let built = 0;
  for (let seed = 1; seed <= 400; seed++) {
    const q = E.build({themeId: 'world-city-clues', seed});
    if (!q) continue;
    built++;
    for (const s of q.stage2.statements) {
      assert.ok(['fact', 'concept'].includes(s.kind), s.text);
      if (s.kind === 'fact') {
        assert.equal(K.entities[s.check.entity].facts[s.check.set].values.includes(s.check.value), s.truth, s.text);
        if (!s.truth) assert.ok(q.entities.some(n => n !== s.check.entity && ((K.entities[n].facts[s.check.set] || {}).values || []).includes(s.check.value)), s.text);
      }
      const w = s.kind === 'fact' ? s.check.set + ':' + s.check.value : 'concept';
      (by[w] = by[w] || [0, 0])[s.truth ? 0 : 1]++;
    }
  }
  assert.ok(built >= 390, 'built ' + built);
  // Nothing may be always true or always false. UN 본부 has one holder (뉴욕) among three cities, so
  // its wordings stay near 1:3; the others near even.
  for (const [w, [t, f]] of Object.entries(by)) { const lim = w.startsWith('cityUN') ? 0.2 : 0.3; assert.ok(t / (t + f) >= lim && t / (t + f) <= 1 - lim, w + ' ' + t + '/' + f); }
  // The climate theme draws no city facts though 런던·파리·로스앤젤레스 are its stations too.
  for (let seed = 1; seed <= 100; seed++) {
    const q = E.build({themeId: 'climate-graphs', seed});
    if (q) for (const s of q.stage2.statements) assert.ok(!/^city/.test((s.check || {}).set || '') && s.kind !== 'concept', s.text);
  }
});
