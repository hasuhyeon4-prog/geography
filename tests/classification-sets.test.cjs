const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../assets/classification-sets.js');
const shapes = require('../assets/country-boundaries.js');
const names = Object.keys(shapes.byName);

test('every boundary country belongs to exactly one study region', () => {
  const seen = C.regions.flatMap(r => r.countries);
  assert.equal(new Set(seen).size, seen.length, 'duplicate region entry');
  assert.deepEqual([...seen].sort(), [...names].sort());
});

test('set entries name drawable countries, valid options, and never overlap', () => {
  for (const set of C.sets) {
    const ids = new Set(C.optionsFor(set).map(o => o.id));
    for (const [name, value] of Object.entries(set.values)) {
      assert.ok(shapes.byName[name], set.id + ': ' + name);
      assert.ok(ids.has(value), set.id + ': ' + name + ' → ' + value);
      assert.ok(!(name in set.mixed), set.id + ': ' + name + ' is both graded and mixed');
    }
    for (const name of Object.keys(set.mixed)) assert.ok(shapes.byName[name], set.id + ' mixed: ' + name);
    for (const name of Object.keys(set.notes)) assert.ok(name in set.values || name in set.mixed, set.id + ' note without entry: ' + name);
    for (const o of set.options) assert.ok(C.assignPool(set, 'all').some(n => set.values[n] === o.id), set.id + ' option unused: ' + o.id);
  }
});

test('religion covers every drawn country, graded or explicitly mixed', () => {
  const set = C.byId.religion;
  for (const name of names) assert.ok(name in set.values || name in set.mixed, name);
});

test('lecture anchors are graded as the lecture states', () => {
  const v = (set, name) => C.byId[set].values[name];
  assert.equal(v('religion', '인도'), 'hinduism');
  assert.equal(v('religion', '네팔'), 'hinduism');
  assert.equal(v('religion', '스리랑카'), 'buddhism');
  assert.equal(v('religion', '말레이시아'), 'islam');
  assert.equal(v('religion', '방글라데시'), 'islam');
  assert.equal(v('religion', '미얀마'), 'buddhism');
  assert.equal(v('religion', '필리핀'), 'christianity');
  assert.equal(v('religion', '우즈베키스탄'), 'islam');
  assert.equal(v('religion', '이스라엘'), 'judaism');
  assert.ok('나이지리아' in C.byId.religion.mixed);
  for (const n of ['포르투갈', '에스파냐', '이탈리아', '필리핀']) assert.equal(v('christianity', n), 'catholic', n);
  for (const n of ['러시아', '그리스', '세르비아']) assert.equal(v('christianity', n), 'orthodox', n);
  for (const n of ['이란', '이라크', '아제르바이잔']) assert.equal(v('islam', n), 'shia', n);
  for (const n of ['사우디아라비아', '튀르키예', '인도네시아']) assert.equal(v('islam', n), 'sunni', n);
  for (const n of ['타이', '미얀마', '캄보디아', '라오스', '스리랑카']) assert.equal(v('buddhism', n), 'theravada', n);
  assert.equal(v('latinLanguage', '브라질'), 'portuguese');
  assert.equal(v('latinLanguage', '가이아나'), 'english');
  assert.equal(v('latinLanguage', '수리남'), 'dutch');
});

test('bloc and currency membership matches the lecture counts', () => {
  const count = (set, id) => Object.values(C.byId[set].values).filter(x => x === id).length;
  assert.equal(count('bloc', 'eu'), 27);
  assert.equal(count('bloc', 'usmca'), 3);
  assert.equal(count('bloc', 'asean'), 11);
  assert.equal(count('bloc', 'mercosur'), 5);
  assert.equal(count('apec', 'member'), 20, 'APEC 21 minus 홍콩, which has no country shape');
  assert.equal(count('euro', 'euro'), 21);
  assert.equal(count('euro', 'none'), 6);
  const eu = Object.keys(C.byId.bloc.values).filter(n => C.byId.bloc.values[n] === 'eu').sort();
  assert.deepEqual(Object.keys(C.byId.euro.values).sort(), eu, 'euro set covers exactly the EU');
  assert.equal(C.byId.bloc.values['영국'], 'none');
  assert.ok('베네수엘라' in C.byId.bloc.mixed);
  assert.equal(C.byId.apec.values['카타르'], 'none');
});

test('paint grading separates correct, missed, wrong and ungraded picks', () => {
  const set = C.byId.religion;
  const r = C.gradePaint(set, 'hinduism', ['인도', '스리랑카', '나이지리아'], names, 'all');
  assert.deepEqual(r.correct, ['인도']);
  assert.deepEqual(r.missed, ['네팔']);
  assert.deepEqual(r.wrong, ['스리랑카']);
  assert.deepEqual(r.excluded, ['나이지리아']);
  const europe = C.gradePaint(set, 'hinduism', [], names, 'europe');
  assert.deepEqual(europe, {correct: [], missed: [], wrong: [], excluded: []}, 'a region can have no targets');
  const latin = C.gradePaint(C.byId.latinLanguage, 'french', ['아이티'], names, 'all');
  assert.deepEqual(latin.missed, ['프랑스'], 'listed universe includes French Guiana via France');
  assert.ok(!C.universe(C.byId.latinLanguage, names).includes('독일'));
});

test('every set can phrase its paint question and explain non-members', () => {
  for (const set of C.sets) {
    assert.match(set.paintPhrase, /\{x\}/, set.id);
    if (!set.noneOption && set.universe !== 'listed') assert.ok(set.otherLabel, set.id + ' needs otherLabel');
  }
});

test('the quiz page parses, loads existing assets, and is linked from the main app', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const vm = require('node:vm');
  const root = path.join(__dirname, '..');
  const page = fs.readFileSync(path.join(root, 'classify.html'), 'utf8');
  for (const [, src] of page.matchAll(/<script src="([^"?]+)/g)) assert.ok(fs.existsSync(path.join(root, src)), src);
  const inline = [...page.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  assert.equal(inline.length, 1);
  new vm.Script(inline[0]);
  assert.match(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /href="classify\.html"/);
});
