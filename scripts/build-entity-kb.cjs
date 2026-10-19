/* Build assets/entity-kb.js: one knowledge card per country, economic bloc, and continent,
 * plus the verdict on every whitelisted relation.
 *
 * Usage: node scripts/build-entity-kb.cjs [--report]
 * Inputs (all committed): assets/country-boundaries.js, assets/classification-sets.js,
 * assets/rankings.js, data/country-indicators.json, data/group-series.json,
 * data/electricity-mix.json, data/religion-composition.json, data/entity-facts.json,
 * data/exam-relations.json. --report lists the relations that did not pass and why.
 * The 기출형 engine (assets/exam-engine.js) reads only this file and assets/exam-themes.js.
 *
 * Nothing here is inferred: categorical facts copy graded entries of the classification
 * sets (mixed or reference entries stay out), numbers copy the statistics files with their
 * year and source, and hemispheres come from the largest polygon of each country. A
 * relation from data/exam-relations.json is 'active' only if it holds, with the
 * indicator's margin, in every year of the whitelist's window (docs/EXAM-FRAMEWORK.md 2절).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const shapes = require(path.join(ROOT, 'assets/country-boundaries.js'));
const C = require(path.join(ROOT, 'assets/classification-sets.js'));
const R = require(path.join(ROOT, 'assets/rankings.js'));
const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const stats = read('data/country-indicators.json');
const groupSeries = read('data/group-series.json');
const extra = read('data/entity-facts.json');
const electricity = read('data/electricity-mix.json');
const religion = read('data/religion-composition.json');
const REL = read('data/exam-relations.json');

// Margins a recalled relation must keep in every year of REL.check.window, not just once.
const COUNTRY_INDICATORS = {
  pop: {label: '총인구', unit: '만 명', more: '총인구가 많다', compare: {type: 'ratio', min: 1.2}},
  urban: {label: '도시화율', unit: '%', more: '도시화율이 높다', compare: {type: 'diff', min: 5}},
  old: {label: '노년층(65세 이상) 인구 비율', unit: '%', more: '노년층 인구 비율이 높다', compare: {type: 'diff', min: 3}},
  young: {label: '유소년층(0~14세) 인구 비율', unit: '%', more: '유소년층 인구 비율이 높다', compare: {type: 'diff', min: 5}},
  nir: {label: '인구 자연 증가율', unit: '‰', more: '인구 자연 증가율이 높다', compare: {type: 'diff', min: 3}, sign: {neg: '인구의 자연 감소가 나타난다', pos: '인구의 자연 증가가 나타난다', min: 1}},
  gdp: {label: 'GDP', unit: '십억 달러', more: 'GDP가 많다', compare: {type: 'ratio', min: 1.3}},
  gdppc: {label: '1인당 GDP', unit: '천 달러', more: '1인당 GDP가 많다', compare: {type: 'ratio', min: 1.3}},
  exports: {label: '상품 수출액', unit: '십억 달러', more: '상품 수출액이 많다', compare: {type: 'ratio', min: 1.3}},
};
// Bloc and continent tables of assets/rankings.js: yearly series key in data/group-series.json
// and its scale to the table unit. Static tables have no yearly series.
const GROUP_INDICATORS = {
  'bloc-pop': {key: 'pop', scale: 1e8, compare: {type: 'ratio', min: 1.1}},
  'bloc-gdp': {key: 'gdp', scale: 1e12, compare: {type: 'ratio', min: 1.3}},
  'bloc-trade': {key: 'trade', scale: 1e12, compare: {type: 'ratio', min: 1.3}},
  'bloc-gdppc': {key: 'gdppc', scale: 1e3, compare: {type: 'ratio', min: 1.3}},
  'bloc-members': {static: true, compare: {type: 'diff', min: 1}},
  'bloc-area': {static: true, compare: {type: 'ratio', min: 1.1}},
  'bloc-density': {density: 'bloc-area', compare: {type: 'ratio', min: 1.15}},
  'cont-pop': {key: 'pop', scale: 1e8, compare: {type: 'ratio', min: 1.1}},
  'cont-area': {static: true, compare: {type: 'ratio', min: 1.1}},
  'cont-density': {density: 'cont-area', compare: {type: 'ratio', min: 1.15}},
  'cont-urban': {key: 'urban', scale: 1, compare: {type: 'diff', min: 3}},
  'cont-old': {key: 'old', scale: 1, compare: {type: 'diff', min: 3}},
  'cont-young': {key: 'young', scale: 1, compare: {type: 'diff', min: 3}},
  'cont-nir': {key: 'nir', scale: 1, compare: {type: 'diff', min: 2}, sign: {neg: '인구의 자연 감소가 나타난다', pos: '인구의 자연 증가가 나타난다', min: 1}},
  'cont-netmig': {key: 'netmig', scale: 1e4, compare: {type: 'diff', min: 50}, sign: {pos: '인구의 순유입이 나타난다', neg: '인구의 순유출이 나타난다', min: 10}},
  'cont-gdp': {key: 'gdp', scale: 1e12, compare: {type: 'ratio', min: 1.3}},
  'cont-gdppc': {key: 'gdppc', scale: 1e3, compare: {type: 'ratio', min: 1.3}},
};
// Member counts change with accessions; both counts keep the same order (rankings audit warning).
const MEMBERS_2026 = {EU: 27, ASEAN: 11, MERCOSUR: 5, USMCA: 3};
// Set facts that may be stated about a country. Dated rank memberships (e.g. 2016~2020
// export top 3) and wheat-only net trade stay out; see docs/EXAM-FRAMEWORK.md.
const FACT_SETS = ['religion', 'christianity', 'islam', 'buddhism', 'bloc', 'apec', 'euro', 'latinLanguage',
  'exportType', 'grainProductionTop', 'minerals', 'fossil', 'beverage', 'capitalCity'];
// Absence is meaningful only where the set lists every member of its universe.
const NEGATION_SAFE = {bloc: 'all', apec: 'all', religion: 'all'};
// A false statement may claim another option only where options exclude each other
// and the set decides every listed country. '대표 산지'-type sets never yield a false claim.
const EXCLUSIVE = ['religion', 'christianity', 'islam', 'buddhism', 'bloc', 'apec', 'euro', 'latinLanguage', 'exportType', 'capitalCity'];

function ringArea(ring) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  return Math.abs(a / 2);
}
function hemispheres(name) {
  const polys = shapes.byName[name].polygons;
  const main = polys.reduce((best, p) => (ringArea(p[0]) > ringArea(best[0]) ? p : best));
  const lons = main[0].map(p => p[0]), lats = main[0].map(p => p[1]);
  const span = (lo, hi, pos, neg) => (lo >= 1 ? pos : hi <= -1 ? neg : null);
  return {
    ns: span(Math.min(...lats), Math.max(...lats), 'N', 'S'),
    ew: Math.max(...lons) - Math.min(...lons) > 180 ? null : span(Math.min(...lons), Math.max(...lons), 'E', 'W'),
  };
}

const regionName = Object.fromEntries(C.regions.map(r => [r.id, r.name]));
const entities = {};
for (const name of Object.keys(shapes.byName)) {
  const facts = {};
  for (const id of FACT_SETS) {
    const set = C.byId[id];
    if (!set || set.points) continue;
    const e = C.entry(set, name);
    if (e.status === 'graded') facts[id] = {values: e.values.slice(), note: e.note || ''};
    else if (e.status === 'other' && NEGATION_SAFE[id] === 'all' && e.values.length) facts[id] = {values: e.values.slice(), note: e.note || ''};
  }
  for (const [key, f] of Object.entries(extra.facts)) {
    if (f.values[name]) facts[key] = {values: f.values[name].slice(), note: '', source: f.source};
  }
  const s = stats.countries[name];
  entities[name] = {
    type: 'country', name, iso3: s ? s.iso3 : shapes.byName[name].code,
    region: C.regionOf[name] || null, regionName: regionName[C.regionOf[name]] || null,
    ...hemispheres(name), facts,
    // Only indicators with a comparison margin; yearly net migration of a country is too volatile.
    values: s ? Object.fromEntries(Object.entries(s.values).filter(([k]) => k in COUNTRY_INDICATORS)) : {},
  };
}

const indicators = {};
const seriesOf = {};  // seriesOf[ind][name] = {year: value} in the unit of the shown table
for (const [id, meta] of Object.entries(COUNTRY_INDICATORS)) {
  indicators[id] = {...meta, entityType: 'country', year: stats.meta.baseYear, source: stats.meta.source, disabled: false, unstablePairs: []};
  seriesOf[id] = Object.fromEntries(Object.entries(stats.countries).map(([n, c]) => [n, (c.series || {})[id] || {}]));
}
// Bloc and continent indicators reuse the audited ranking tables, including their
// disabled tables and pairs whose order flips between years.
function predicate(phrase) { return phrase.endsWith('큰') ? phrase.slice(0, -1) + '크다' : phrase.replace(/은$/, '다'); }
const tables = Object.fromEntries(R.rankings.map(r => [r.id, r]));
for (const r of R.rankings) {
  if (!['bloc', 'continent'].includes(r.group)) continue;
  const type = r.group, g = GROUP_INDICATORS[r.id];
  if (!g) throw new Error('no margin for ranking ' + r.id);
  indicators[r.id] = {
    label: r.title, unit: r.unit, more: predicate(r.phrase), entityType: type, year: r.year, source: r.source,
    compare: g.compare, static: !!g.static, disabled: !!(r.audit && r.audit.quizDisabled), unstablePairs: (r.audit && r.audit.unstablePairs) || [],
  };
  if (g.sign) indicators[r.id].sign = g.sign;
  seriesOf[r.id] = {};
  for (const it of r.items) {
    const e = entities[it.name] || (entities[it.name] = {type, name: it.name, facts: {}, values: {}});
    e.values[r.id] = it.value;
    const gs = (groupSeries.groups[it.name] || {}).series || {};
    let ser = {};
    if (g.key) ser = Object.fromEntries(Object.entries(gs[g.key] || {}).map(([y, v]) => [y, v / g.scale]));
    else if (g.density) {
      const area = tables[g.density].items.find(x => x.name === it.name).value * 1e6;
      ser = Object.fromEntries(Object.entries(gs.pop || {}).map(([y, v]) => [y, v / area]));
    } else if (r.id === 'bloc-members') ser = {[r.year]: it.value, 2026: MEMBERS_2026[it.name]};
    else ser = {[String(r.year).slice(0, 4)]: it.value};
    seriesOf[r.id][it.name] = ser;
  }
}

// --- multi-year check of the whitelist (data/exam-relations.json) ---
const [Y0, Y1] = REL.check.window, MIN_YEARS = REL.check.minYears;
const gapOf = (cmp, hi, lo) => (cmp.type === 'ratio' ? (hi > 0 && lo > 0 ? hi / lo : 0) : hi - lo);
const gapText = (cmp, g) => (cmp.type === 'ratio' ? g.toFixed(2) + '배' : (Math.round(g * 10) / 10) + '');
function windowYears(m, a, b) {
  return Object.keys(a).filter(y => y in b && (m.static || (y >= Y0 && y <= Y1))).sort();
}
function checkPair(ind, hi, lo, directed) {
  const m = indicators[ind], out = {indicator: ind, hi, lo};
  const no = reason => Object.assign(out, {status: 'excluded', reason});
  if (!m) return no('지표 없음');
  if (m.disabled) return no('순위표 감사에서 문제 출제 제외 지표');
  const shown = n => ((entities[n] || {}).values || {})[ind];
  if (shown(hi) == null || shown(lo) == null) return no('표시 값 없음');
  if (!directed && shown(hi) < shown(lo)) { out.hi = lo; out.lo = hi; [hi, lo] = [lo, hi]; }
  const va = entities[hi].values, vb = entities[lo].values;
  if (m.unstablePairs.some(p => p.includes(hi) && p.includes(lo))) return no('순위표 감사의 불안정 쌍');
  const a = seriesOf[ind][hi] || {}, b = seriesOf[ind][lo] || {}, years = windowYears(m, a, b);
  if (!m.static && years.length < MIN_YEARS) return no(`${Y0}~${Y1}년 자료 ${years.length}개 연도(${MIN_YEARS}개 미만)`);
  const flipped = years.filter(y => a[y] <= b[y]);
  if (flipped.length) return Object.assign(out, {status: directed ? 'conflict' : 'excluded', reason: `${flipped.join('·')}년에 ${lo} ≥ ${hi}` + (directed ? ' (강의 방향과 다름)' : ' (연도에 따라 순서가 바뀜)')});
  const gaps = years.map(y => [y, gapOf(m.compare, a[y], b[y])]).concat([['표시값', gapOf(m.compare, va[ind], vb[ind])]]);
  const least = gaps.reduce((x, y) => (y[1] < x[1] ? y : x));
  Object.assign(out, {years: [years[0], years[years.length - 1]], n: years.length, minGap: gapText(m.compare, least[1])});
  if (least[1] < m.compare.min) return no(`${least[0]}${least[0] === '표시값' ? '' : '년'} 차이 ${gapText(m.compare, least[1])} < 기준 ${m.compare.min}`);
  return Object.assign(out, {status: 'active'});
}
function checkSign(ind, name) {
  const m = indicators[ind], out = {indicator: ind, entity: name};
  const no = reason => Object.assign(out, {status: 'excluded', reason});
  if (!m || !m.sign) return no('방향 진술이 없는 지표');
  if (m.disabled) return no('순위표 감사에서 문제 출제 제외 지표');
  const v = ((entities[name] || {}).values || {})[ind];
  if (v == null) return no('표시 값 없음');
  out.positive = v > 0;
  const a = seriesOf[ind][name] || {}, years = windowYears(m, a, a);
  if (years.length < MIN_YEARS) return no(`${Y0}~${Y1}년 자료 ${years.length}개 연도`);
  const bad = years.filter(y => (a[y] > 0) !== out.positive || Math.abs(a[y]) < m.sign.min);
  if (Math.abs(v) < m.sign.min) bad.push('표시값');
  Object.assign(out, {years: [years[0], years[years.length - 1]], n: years.length, minAbs: Math.round(Math.min(...years.map(y => Math.abs(a[y])), Math.abs(v)) * 10) / 10});
  if (bad.length) return no(`${bad.join('·')}에서 부호가 바뀌거나 |값| < ${m.sign.min}`);
  return Object.assign(out, {status: 'active'});
}
const relations = [], signs = [];
for (const r of REL.relations) {
  const add = (hi, lo, directed, form) => relations.push(Object.assign(checkPair(r.indicator, hi, lo, directed), {form, basis: r.basis}));
  for (const [hi, lo] of r.pairs || []) add(hi, lo, true, 'pairs');
  (r.tiers || []).forEach((tier, i) => r.tiers.slice(i + 1).flat().forEach(lo => tier.forEach(hi => add(hi, lo, true, 'tiers'))));
  const g = r.group || [];
  g.forEach((a, i) => g.slice(i + 1).forEach(b => add(a, b, false, 'group')));
  for (const n of r.signs || []) signs.push(Object.assign(checkSign(r.indicator, n), {basis: r.basis}));
}

// Compositions used as identification data. Shares are percentages of the stated total;
// `orderMargin` is the gap every year must keep between ranked categories.
const compositions = {
  electricity: {year: electricity.meta.baseYear, source: electricity.meta.source, unit: '% (발전량 비중)', orderMargin: 10, rankExclude: [],
    categories: [['coal', '석탄'], ['gas', '천연가스'], ['oil', '석유'], ['nuclear', '원자력'], ['hydro', '수력'], ['wind', '풍력'], ['solar', '태양광'], ['other', '기타(바이오·지열 등)']],
    values: Object.fromEntries(Object.entries(electricity.countries).map(([n, c]) => [n, c.values]))},
  religion: {year: religion.meta.baseYear, source: religion.meta.source, unit: '% (인구 대비)', orderMargin: 2, rankExclude: ['unaffiliated', 'other'],
    categories: [['christianity', '크리스트교'], ['islam', '이슬람교'], ['hinduism', '힌두교'], ['buddhism', '불교'], ['judaism', '유대교'], ['unaffiliated', '무종교'], ['other', '기타 종교']],
    values: Object.fromEntries(Object.entries(religion.countries).map(([n, c]) => [n, c.values])),
    // Same year and source as the shares, so share × total is a valid head count.
    total: {label: '총인구', unit: '만 명', year: religion.meta.baseYear, source: religion.meta.source,
      values: Object.fromEntries(Object.entries(religion.countries).map(([n, c]) => [n, c.population]))}},
};
const compositionSeries = {
  electricity: Object.fromEntries(Object.entries(electricity.countries).map(([n, c]) => [n, c.series])),
  religion: Object.fromEntries(Object.entries(religion.countries).map(([n, c]) => [n, c.series])),
};
function checkOrder(cid, name, order) {
  const c = compositions[cid], out = {composition: cid, entity: name, order};
  const no = reason => Object.assign(out, {status: 'excluded', reason});
  const ser = compositionSeries[cid][name];
  if (!ser || !c.values[name]) return no('구성 자료 없음');
  const years = Object.keys(ser).filter(y => cid === 'religion' || (y >= Y0 && y <= Y1)).sort();
  if (cid !== 'religion' && years.length < MIN_YEARS) return no(`${Y0}~${Y1}년 자료 ${years.length}개 연도`);
  const rows = years.map(y => [y, ser[y]]).concat([['표시값', c.values[name]]]);
  const rest = c.categories.map(x => x[0]).filter(k => !order.includes(k) && !c.rankExclude.includes(k));
  let least = [null, Infinity];
  for (const [y, v] of rows) {
    const gaps = order.map((k, i) => v[k] - (i + 1 < order.length ? v[order[i + 1]] : Math.max(...rest.map(o => v[o] || 0))));
    const g = Math.min(...gaps);
    if (g < least[1]) least = [y, g];
  }
  Object.assign(out, {years: [years[0], years[years.length - 1]], n: years.length, minGap: Math.round(least[1] * 10) / 10});
  if (least[1] < c.orderMargin) return no(`${least[0]}${least[0] === '표시값' ? '' : '년'} 간격 ${Math.round(least[1] * 10) / 10}%p < 기준 ${c.orderMargin}%p`);
  return Object.assign(out, {status: 'active'});
}
const orders = [];
for (const o of REL.orders) {
  const list = o.fromSet
    ? Object.keys(compositions[o.composition].values).filter(n => C.byId[o.fromSet] && C.entry(C.byId[o.fromSet], n).status === 'graded' && C.entry(C.byId[o.fromSet], n).values.length === 1)
      .map(n => [n, C.entry(C.byId[o.fromSet], n).values.slice()])
    : Object.entries(o.orders);
  for (const [n, order] of list) orders.push(Object.assign(checkOrder(o.composition, n, order), {basis: o.basis}));
}

const out = {
  generated: 'scripts/build-entity-kb.cjs',
  sources: {countries: stats.meta, groups: groupSeries.meta, extraFacts: extra.about, rankingsCheckedAt: R.checkedAt || null},
  check: REL.check,
  factSets: Object.fromEntries(FACT_SETS.filter(id => C.byId[id]).map(id => [id, {
    title: C.byId[id].title, multi: !!C.byId[id].multi, negationSafe: NEGATION_SAFE[id] === 'all', exclusive: EXCLUSIVE.includes(id),
    options: Object.fromEntries(C.optionsFor(C.byId[id]).map(o => [o.id, o.label])),
  }])),
  extraFacts: Object.fromEntries(Object.entries(extra.facts).map(([k, f]) => [k, {label: f.label, complete: f.complete, source: f.source}])),
  indicators, entities, compositions, relations, signs, orders,
};
fs.writeFileSync(process.env.KB_OUT || path.join(ROOT, 'assets/entity-kb.js'),
  '/* Generated by scripts/build-entity-kb.cjs. Do not edit by hand. */\n' +
  "(function(root,data){if(typeof module==='object'&&module.exports)module.exports=data;else root.WGEntityKB=data})" +
  "(typeof globalThis!=='undefined'?globalThis:this," + JSON.stringify(out) + ');\n');
const counts = {};
Object.values(entities).forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1; });
console.log('entities', counts, 'indicators', Object.keys(indicators).length);
for (const [label, list] of [['relations', relations], ['signs', signs], ['orders', orders]]) {
  const by = {};
  list.forEach(x => { by[x.status] = (by[x.status] || 0) + 1; });
  console.log(label, by);
  if (process.argv.includes('--report')) for (const x of list) if (x.status !== 'active') console.log('  ', x.status, x.indicator || x.composition, x.hi ? x.hi + ' > ' + x.lo : x.entity + (x.order ? ' ' + x.order.join('>') : ''), '—', x.reason);
}
