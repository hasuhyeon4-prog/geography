// Independent check of the 기출형 questions against the raw yearly data.
// It does not use the knowledge base's verdicts: it reads data/*.json and the whitelist
// itself, so a wrong margin, a missed year, or a relation outside the whitelist fails here
// even when the builder and the engine agree with each other.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const data = f => require(path.join(ROOT, f));
const K = require('../assets/entity-kb.js');
const T = require('../assets/exam-themes.js');
const E = require('../assets/exam-engine.js');
const C = require('../assets/classification-sets.js');
const R = require('../assets/rankings.js');
const REL = data('data/exam-relations.json');
const countries = data('data/country-indicators.json');
const groups = data('data/group-series.json');
const electricity = data('data/electricity-mix.json');
const religion = data('data/religion-composition.json');
const engine = E.create(K, T);
const SEEDS = 300;
const [Y0, Y1] = REL.check.window;
const MIN_YEARS = REL.check.minYears;

// Yearly values in the unit of the shown table, straight from the data files.
const GROUP = {'bloc-pop': ['pop', 1e8], 'bloc-gdp': ['gdp', 1e12], 'bloc-trade': ['trade', 1e12], 'bloc-gdppc': ['gdppc', 1e3],
  'cont-pop': ['pop', 1e8], 'cont-urban': ['urban', 1], 'cont-old': ['old', 1], 'cont-young': ['young', 1], 'cont-nir': ['nir', 1], 'cont-netmig': ['netmig', 1e4]};
const area = id => Object.fromEntries(R.rankings.find(r => r.id === id).items.map(i => [i.name, i.value * 1e6]));
const MEMBERS = {2023: {EU: 27, ASEAN: 10, MERCOSUR: 4, USMCA: 3}, 2026: {EU: 27, ASEAN: 11, MERCOSUR: 5, USMCA: 3}};
function raw(ind, name) {
  if (countries.countries[name] && !GROUP[ind] && !ind.includes('-')) return countries.countries[name].series[ind] || {};
  if (ind === 'bloc-members') return {2023: MEMBERS[2023][name], 2026: MEMBERS[2026][name]};
  if (ind.endsWith('-area')) return {2024: area(ind)[name] / 1e6};  // UN Demographic Yearbook 2024, fixed
  const g = groups.groups[name].series;
  if (ind === 'cont-density' || ind === 'bloc-density') {
    const a = area(ind.replace('density', 'area'))[name];
    return Object.fromEntries(Object.entries(g.pop).map(([y, v]) => [y, v / a]));
  }
  const [key, scale] = GROUP[ind];
  return Object.fromEntries(Object.entries(g[key] || {}).map(([y, v]) => [y, v / scale]));
}
const STATIC = ind => ind === 'bloc-members' || ind.endsWith('-area');
const inWindow = (ind, y) => STATIC(ind) || (y >= Y0 && y <= Y1);
// Years in which `hi` is above `lo`, and years in which it is not.
function yearly(ind, hi, lo) {
  const a = raw(ind, hi), b = raw(ind, lo), years = Object.keys(a).filter(y => y in b && inWindow(ind, y));
  return {years, reversed: years.filter(y => !(a[y] > b[y]))};
}

// The whitelist, read here without the builder.
const allowedPairs = new Map(), allowedSigns = new Set(), lectureDirected = [];
for (const r of REL.relations) {
  const allow = (a, b) => allowedPairs.set(r.indicator + '|' + [a, b].sort().join('|'), r.basis);
  for (const [hi, lo] of r.pairs || []) { allow(hi, lo); lectureDirected.push([r.indicator, hi, lo]); }
  (r.tiers || []).forEach((tier, i) => r.tiers.slice(i + 1).flat().forEach(lo => tier.forEach(hi => { allow(hi, lo); lectureDirected.push([r.indicator, hi, lo]); })));
  (r.group || []).forEach((a, i) => r.group.slice(i + 1).forEach(b => allow(a, b)));
  for (const n of r.signs || []) allowedSigns.add(r.indicator + '|' + n);
}
const allowedOrders = {};
for (const o of REL.orders) {
  const c = allowedOrders[o.composition] || (allowedOrders[o.composition] = {});
  if (o.fromSet) {
    for (const n of o.entities) {
      const e = C.entry(C.byId[o.fromSet], n);
      if (e.status === 'graded' && e.values.length === 1) (c[n] || (c[n] = [])).push(e.values);
    }
  } else for (const [n, order] of Object.entries(o.orders)) (c[n] || (c[n] = [])).push(order);
}
const compositionSeries = {
  electricity: n => Object.fromEntries(Object.entries(electricity.countries[n].series).filter(([y]) => y >= Y0 && y <= Y1)),
  religion: n => religion.countries[n].series,
};
const EXCLUDE = {electricity: [], religion: ['unaffiliated', 'other']};
function orderHoldsEveryYear(cid, name, order) {
  const ser = compositionSeries[cid](name);
  return Object.values(ser).every(v => {
    const rest = Object.keys(v).filter(k => !order.includes(k) && !EXCLUDE[cid].includes(k));
    return order.every((k, i) => (i + 1 < order.length ? v[k] > v[order[i + 1]] : rest.every(o => v[k] > v[o])));
  }) && (cid === 'religion' ? Object.keys(ser).length === 2 : Object.keys(ser).length >= MIN_YEARS);
}

function* questions() {
  for (const t of engine.themes) for (let seed = 1; seed <= SEEDS; seed++) yield engine.build({themeId: t.id, seed});
}
const num = cell => Number(String(cell).replace(/,/g, ''));

test('recalled comparisons are whitelisted and hold in every year of the window', () => {
  let n = 0;
  for (const q of questions()) {
    for (const s of q.stage2.statements.filter(x => x.kind === 'compare')) {
      const {ind, subject, object} = s.check, key = ind + '|' + [subject, object].sort().join('|');
      assert.ok(allowedPairs.has(key), 'not in data/exam-relations.json: ' + key + ' — ' + s.text);
      const [hi, lo] = s.truth ? [subject, object] : [object, subject];
      const {years, reversed} = yearly(ind, hi, lo);
      assert.deepEqual(reversed, [], `${ind} ${hi} > ${lo} reverses in ${reversed}`);
      if (!STATIC(ind)) assert.ok(years.length >= MIN_YEARS, `${ind} ${hi}/${lo}: only ${years.length} years`);
      n++;
    }
  }
  assert.ok(n > 500, 'too few comparisons were exercised: ' + n);
});

test('recalled directions are whitelisted and keep their sign in every year', () => {
  for (const q of questions()) {
    for (const s of q.stage2.statements.filter(x => x.kind === 'sign')) {
      const {ind, entity, positive} = s.check;
      assert.ok(allowedSigns.has(ind + '|' + entity), 'sign not whitelisted: ' + ind + ' ' + entity);
      const ser = raw(ind, entity), years = Object.keys(ser).filter(y => inWindow(ind, y));
      assert.ok(years.length >= MIN_YEARS, ind + ' ' + entity);
      for (const y of years) assert.equal(ser[y] > 0 === positive, s.truth, `${s.text} (${y}: ${ser[y]})`);
    }
  }
});

test('identification rests only on whitelisted knowledge that holds in every year, and leaves one answer', () => {
  const permutations = list => (list.length <= 1 ? [list] : list.flatMap((x, i) => permutations(list.filter((_, j) => j !== i)).map(p => [x, ...p])));
  for (const q of questions()) {
    const t = q.theme, b = q.stage1.basis, col = ind => q.display.columns.findIndex(c => c.id === ind);
    const shownValue = (name, ind) => num(q.display.rows[q.entities.indexOf(name)].cells[col(ind)]);
    for (const x of b.relations || []) {
      assert.ok(allowedPairs.has(x.indicator + '|' + [x.hi, x.lo].sort().join('|')), 'identification uses ' + x.indicator + ' ' + x.hi + '/' + x.lo);
      assert.deepEqual(yearly(x.indicator, x.hi, x.lo).reversed, [], x.indicator + ' ' + x.hi + ' > ' + x.lo);
      assert.ok(q.shown.includes(x.indicator));
    }
    for (const x of b.signs || []) {
      assert.ok(allowedSigns.has(x.indicator + '|' + x.entity));
      for (const [y, v] of Object.entries(raw(x.indicator, x.entity))) if (inWindow(x.indicator, y)) assert.equal(v > 0, x.positive, x.entity + ' ' + y);
    }
    for (const o of b.orders || []) {
      assert.ok((allowedOrders[o.composition][o.entity] || []).some(a => a.join() === o.order.join()), 'order not whitelisted: ' + o.entity);
      assert.ok(orderHoldsEveryYear(o.composition, o.entity, o.order), o.composition + ' ' + o.entity + ' ' + o.order);
    }
    // Every wrong assignment must break some piece of that knowledge on the shown numbers.
    const comp = n => q.display.columns.reduce((v, c, i) => Object.assign(v, {[c.id]: num(q.display.rows[q.entities.indexOf(n)].cells[i])}), {});
    for (const p of permutations(q.entities)) {
      if (p.join() === q.entities.join()) continue;
      const rowOf = name => q.entities[p.indexOf(name)];
      const broken = (b.relations || []).some(x => shownValue(rowOf(x.lo), x.indicator) > shownValue(rowOf(x.hi), x.indicator)) ||
        (b.signs || []).some(x => (shownValue(rowOf(x.entity), x.indicator) > 0) !== x.positive) ||
        (b.orders || []).some(o => {
          const v = comp(rowOf(o.entity)), cats = t.show.filter(k => !EXCLUDE[o.composition].includes(k) && !o.order.includes(k));
          return o.order.some((k, i) => (i + 1 < o.order.length ? [o.order[i + 1]] : cats).some(c => v[c] > v[k]));
        }) ||
        (b.items || []).some(x => t.items[rowOf(x.entity)][0][0] !== x.top);
      assert.ok(broken, `${t.id}: assignment ${p.join(',')} is not ruled out`);
    }
  }
});

test('share × total uses one year and one source, and both numbers are in the table', () => {
  for (const q of questions()) {
    if (q.theme.composition === 'religion') {
      assert.equal(q.display.columns.at(-1).id, 'total');
      assert.match(q.display.source, /2020/);
      for (const n of q.entities) assert.equal(num(q.display.rows[q.entities.indexOf(n)].cells.at(-1)), religion.countries[n].population, n);
    }
    for (const s of q.stage2.statements.filter(x => x.kind === 'data')) {
      const c = s.check;
      let amount;
      if (c.category) {
        assert.equal(q.theme.composition, 'religion');
        amount = n => religion.countries[n].series['2020'][c.category] * religion.countries[n].populationSeries['2020'];
      } else {
        const v = (n, ind) => raw(ind, n)[countries.countries[n] && !ind.includes('-') ? countries.meta.baseYear : '2023'];
        amount = n => v(n, c.total) * v(n, c.rate) / c.per;
        assert.ok(q.shown.includes(c.rate) && q.shown.includes(c.total), 'derived amounts need both columns shown');
      }
      assert.equal(amount(c.subject) > amount(c.object), s.truth, s.text);
    }
  }
});

test('the table shows the data files’ base-year values', () => {
  for (const q of questions()) {
    if (q.theme.kind !== 'indicators') continue;
    q.shown.forEach((ind, j) => q.entities.forEach((n, i) => {
      const year = ind.endsWith('-area') ? '2024' : q.theme.entityType === 'country' ? countries.meta.baseYear : '2023';
      const v = raw(ind, n)[year];
      const shown = num(q.display.rows[i].cells[j]);
      assert.ok(Math.abs(shown - v) <= Math.max(0.051, Math.abs(v) * 0.006), `${n} ${ind}: shown ${shown}, data ${v}`);
    }));
  }
});

test('regressions: unstable or unneeded comparisons are never asked', () => {
  // Nigeria's 1인당 GDP fell below Ethiopia's in 2024 although it was twice as large in 2023.
  assert.ok(yearly('gdppc', '나이지리아', '에티오피아').reversed.includes('2024'));
  const asked = new Set();
  for (const q of questions()) for (const s of q.stage2.statements) if (s.kind === 'compare') asked.add(s.check.ind + '|' + [s.check.subject, s.check.object].sort().join('|'));
  assert.ok(![...asked].some(k => k.startsWith('gdppc|') && k.includes('나이지리아') && k.includes('에티오피아')));
  assert.ok(![...asked].some(k => k.startsWith('gdp|') && k.includes('네팔') && k.includes('레바논')));
});

test('labels separate a real reversal from a gap below the margin', () => {
  // The margin filters recall questions; it must not be reported as instability.
  for (const x of K.relations) {
    if (!['belowMargin', 'reversed', 'conflict'].includes(x.status)) continue;
    const {years, reversed} = yearly(x.indicator, x.hi, x.lo);
    if (x.status === 'belowMargin') assert.deepEqual(reversed, [], `${x.indicator} ${x.hi} > ${x.lo} is labelled below margin but reverses`);
    if (x.status === 'reversed') assert.ok(reversed.length > 0 && reversed.length < years.length, `${x.indicator} ${x.hi} > ${x.lo}`);
    if (x.status === 'conflict') assert.equal(reversed.length, years.length, `${x.indicator} ${x.hi} > ${x.lo}`);
  }
  for (const x of K.signs) {
    if (!['belowMargin', 'reversed'].includes(x.status)) continue;
    const ser = raw(x.indicator, x.entity), flips = Object.keys(ser).filter(y => inWindow(x.indicator, y) && ser[y] > 0 !== x.positive);
    assert.equal(flips.length > 0, x.status === 'reversed', `${x.indicator} ${x.entity}: ${x.status}`);
  }
  // Europe stayed a net receiver in 2022 (about +4.1만 명); only the size fell below the margin.
  const europe = K.signs.find(x => x.indicator === 'cont-netmig' && x.entity === '유럽');
  assert.equal(europe.status, 'belowMargin');
  assert.ok(raw('cont-netmig', '유럽')['2022'] > 0);
});

test('a conflict with an exam table names no cause and keeps the exam values to read', () => {
  const k = K.relations.find(x => x.indicator === 'urban' && x.hi === '멕시코' && x.lo === '독일');
  assert.equal(k.status, 'conflict');
  assert.doesNotMatch(k.reason, /판본 차이|정의 차이/);
  assert.deepEqual(k.given.values, {멕시코: 79.3, 독일: 77.2, 베트남: 33.8});
  const F = require('../assets/fact-statements.js');
  const ox = F.items.find(i => i.id === 'p31');
  assert.ok(ox && ox.practice === 'reading' && ox.data.rows.some(r => r.includes('79.3')), 'the 2020학년도 6월 14번 table is kept as a reading item');
});

test('a lecture direction that the current data reverse is never active', () => {
  const conflicts = lectureDirected.filter(([ind, hi, lo]) => yearly(ind, hi, lo).reversed.length);
  for (const [ind, hi, lo] of conflicts) {
    const k = K.relations.find(x => x.indicator === ind && ((x.hi === hi && x.lo === lo) || (x.hi === lo && x.lo === hi)));
    assert.notEqual(k.status, 'active', `${ind} ${hi} > ${lo}`);
  }
  // 2020학년도 6월 14번's 2015 table had Mexico above Germany; the current WDI edition does not.
  assert.ok(conflicts.some(([ind, hi, lo]) => ind === 'urban' && hi === '멕시코' && lo === '독일'));
});
