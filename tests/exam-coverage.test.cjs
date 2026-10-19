const test = require('node:test');
const assert = require('node:assert/strict');
const K = require('../assets/entity-kb.js');
const T = require('../assets/exam-themes.js');
const G = require('../data/group-series.json');
const E = require('../assets/exam-engine.js').create(K, T);
const key = x => x.indicator + '|' + [x.hi, x.lo].sort().join('|');

test('every active comparison has a real question and can be practised directly', () => {
  for (const x of K.relations.filter(x => x.status === 'active')) {
    assert.ok(x.practice > 0, 'no generated practice: ' + key(x));
    const q = E.build({targetKey: key(x), seed: 19});
    assert.ok(q && !q.readingOnly, 'no focused recall: ' + key(x));
    const basis = (q.stage1.basis.relations || []).some(r => key(r) === key(x));
    const asked = q.stage2.statements.some(s => s.kind === 'compare' && key({indicator:s.check.ind, hi:s.check.subject, lo:s.check.object}) === key(x));
    assert.ok(basis || asked, 'requested comparison is absent: ' + key(x));
  }
});

test('the formerly unreachable exam comparisons all reach a question', () => {
  for (const [ind, a, b] of [
    ['gdp', '중국', '일본'], ['gdp', '중국', '영국'], ['gdp', '프랑스', '폴란드'],
    ['gdp', '나이지리아', '보츠와나'], ['gdppc', '보츠와나', '나이지리아'],
    ['gdppc', '멕시코', '이집트'], ['exports', '사우디아라비아', '나이지리아'], ['young', '말리', '스웨덴'],
  ]) {
    const x = K.relations.find(x => x.indicator === ind && x.hi === a && x.lo === b);
    assert.ok(x && x.status === 'active' && x.practice > 0, [ind, a, b].join(' '));
  }
});

test('below-margin comparisons have named, supplied-data practice rather than recall', () => {
  for (const x of K.relations.filter(x => x.status === 'belowMargin')) {
    const q = E.build({targetKey:key(x), seed:19});
    assert.ok(q && q.readingOnly, key(x));
    assert.deepEqual(q.shown, [x.indicator]);
    assert.equal(q.stage1.options.length, 0);
    const s = q.stage2.statements[0], c = s.check;
    assert.equal(s.kind, 'data');
    assert.equal(c.indicator, x.indicator);
    assert.equal(s.truth, K.entities[c.subject].values[x.indicator] > K.entities[c.object].values[x.indicator]);
  }
});

test('ageing index uses the elderly-to-young ratio, not the elderly share', () => {
  for (const [name, e] of Object.entries(K.entities)) {
    if (e.type !== 'continent') continue;
    const g = G.groups[name].series, y = K.indicators['cont-agingIndex'].year;
    assert.equal(e.values['cont-agingIndex'], g.old[y] / g.young[y] * 100);
  }
  assert.ok(K.relations.some(x => x.indicator === 'cont-agingIndex' && x.hi === '유럽' && x.status === 'active'));
});

test('invalid or conflicting targets cannot be turned into recall questions', () => {
  assert.equal(E.build({targetKey:'gdp|네팔|레바논',seed:19}), null);
  const conflict = K.relations.find(x => x.status === 'conflict');
  assert.equal(E.build({targetKey:key(conflict),seed:19}), null);
});
