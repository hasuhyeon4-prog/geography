/* Build assets/entity-kb.js: one knowledge card per country, economic bloc, and continent,
 * plus the verdict on every whitelisted relation.
 *
 * Usage: node scripts/build-entity-kb.cjs [--report]
 * Inputs (all committed): assets/country-boundaries.js, assets/classification-sets.js,
 * assets/rankings.js, data/country-indicators.json, data/group-series.json,
 * data/electricity-mix.json, data/religion-composition.json, data/entity-facts.json,
 * data/exam-relations.json, and the agriculture bundle (data/agriculture.json,
 * data/exam-relations-agriculture.json, data/concepts/agriculture.json). --report lists the relations that did not pass and why.
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
const G = require(path.join(ROOT, 'assets/location-grading.js'));
const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const stats = read('data/country-indicators.json');
const economy = read('data/economy-indicators.json');
const groupSeries = read('data/group-series.json');
const extra = read('data/entity-facts.json');
const electricity = read('data/electricity-mix.json');
const religion = read('data/religion-composition.json');
const REL = read('data/exam-relations.json');
if (economy.meta.baseYear !== stats.meta.baseYear) throw new Error('economy and country totals have different base years');

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
  manufacturing: {label: 'GDP 중 제조업 비중', unit: '%', more: 'GDP 중 제조업 비중이 높다', compare: {type: 'diff', min: 3}},
  agriculture: {label: 'GDP 중 1차 산업 비중', unit: '%', more: 'GDP 중 1차 산업 비중이 높다', compare: {type: 'diff', min: 3}},
  industry: {label: 'GDP 중 2차 산업 비중(건설업 포함)', unit: '%', more: 'GDP 중 2차 산업 비중이 높다', compare: {type: 'diff', min: 5}},
  services: {label: 'GDP 중 서비스업 비중', unit: '%', more: 'GDP 중 서비스업 비중이 높다', compare: {type: 'diff', min: 5}},
  industryEmployment: {label: '2차 산업 종사자 비율', unit: '%', more: '2차 산업 종사자 비율이 높다', compare: {type: 'diff', min: 5}},
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
  'exportType', 'minerals', 'beverage', 'capitalCity'];
// Absence is meaningful only where the set lists every member of its universe.
const NEGATION_SAFE = {bloc: 'all', apec: 'all', religion: 'all'};
// A false statement may claim another option only where options exclude each other
// and the set decides every listed country. '대표 산지'-type sets never yield a false claim.
const EXCLUSIVE = ['religion', 'christianity', 'islam', 'buddhism', 'bloc', 'apec', 'euro', 'latinLanguage', 'exportType', 'capitalCity'];
// A set entry can describe a territory rather than the country itself: 프랑스's
// latinLanguage entry is French Guiana, so it says nothing about France.
const FACT_SCOPE = {latinLanguage: name => C.regionOf[name] === 'americas'};

function ringArea(ring) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  return Math.abs(a / 2);
}
// A point well inside the largest polygon, where a map letter (A~E) can sit: the grid point
// farthest from the border. Distances use a thinned ring; the point is checked on the full one.
function labelPoint(main) {
  const ring = main[0], lons = ring.map(p => p[0]), lats = ring.map(p => p[1]);
  const b = [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
  const step = Math.max(1, Math.floor(ring.length / 150)), coarse = [[ring.filter((_, i) => i % step === 0)]];
  let best = null;
  for (let i = 1; i < 14; i++) for (let j = 1; j < 14; j++) {
    const p = {lon: b[0] + (b[2] - b[0]) * i / 14, lat: b[1] + (b[3] - b[1]) * j / 14};
    if (!G.inPolygons(p, coarse)) continue;
    const d = G.polygonDistance(p, coarse);
    if (!best || d > best.d) best = {p, d};
  }
  const p = best && G.inPolygons(best.p, [main]) ? best.p : {lon: (b[0] + b[2]) / 2, lat: (b[1] + b[3]) / 2};
  return {label: [Math.round(p.lon * 100) / 100, Math.round(p.lat * 100) / 100], frame: b.map(v => Math.round(v * 100) / 100)};
}
// Where exam maps put the letter when the largest landmass misleads: both countries' largest
// polygons are on Borneo, which would stack their letters together.
const LABEL_AT = {말레이시아: [102.2, 4.0], 인도네시아: [110.2, -7.3]};
function labelAt(polys, p) {
  const home = polys.find(poly => G.inPolygons({lon: p[0], lat: p[1]}, [poly]));
  if (!home) throw new Error('LABEL_AT point is outside the country: ' + p);
  const lons = home[0].map(q => q[0]), lats = home[0].map(q => q[1]);
  return {label: p, frame: [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)].map(v => Math.round(v * 100) / 100)};
}
// Whether the equator or the prime meridian crosses the country: true only when one landmass
// crosses the line. A country whose separate territories merely lie on both sides (프랑스:
// 기아나 and 레위니옹) is left undecided, and no <보기> is made about it.
function lines(name) {
  const rings = shapes.byName[name].polygons.map(p => p[0]);
  const lonSpan = r => { const l = r.map(p => p[0]); return Math.max(...l) - Math.min(...l); };
  const out = {};
  for (const [line, axis] of [['equator', 1], ['meridian', 0]]) {
    const usable = rings.filter(r => axis === 1 || lonSpan(r) < 180);
    const crosses = usable.some(r => r.some(p => p[axis] < 0) && r.some(p => p[axis] > 0));
    const vals = usable.flat().map(p => p[axis]);
    out[line] = {crosses, undecided: !crosses && Math.min(...vals) < 0 && Math.max(...vals) > 0,
      dist: crosses ? 0 : Math.round(Math.min(...vals.map(Math.abs)) * 10) / 10};
  }
  return out;
}
function hemispheres(name) {
  const polys = shapes.byName[name].polygons;
  const main = polys.reduce((best, p) => (ringArea(p[0]) > ringArea(best[0]) ? p : best));
  const lons = main[0].map(p => p[0]), lats = main[0].map(p => p[1]);
  const span = (lo, hi, pos, neg) => (lo >= 1 ? pos : hi <= -1 ? neg : null);
  const ns = span(Math.min(...lats), Math.max(...lats), 'N', 'S');
  return {
    ns,
    // Degrees from the equator to the nearest point; a hemisphere is worth asking only near it.
    eqDist: ns ? Math.round(Math.min(...lats.map(Math.abs))) : 0,
    ew: Math.max(...lons) - Math.min(...lons) > 180 ? null : span(Math.min(...lons), Math.max(...lons), 'E', 'W'),
    ...labelPoint(main),
    ...(LABEL_AT[name] ? labelAt(polys, LABEL_AT[name]) : {}),
  };
}

const regionName = Object.fromEntries(C.regions.map(r => [r.id, r.name]));
const entities = {};
for (const name of Object.keys(shapes.byName)) {
  const facts = {};
  for (const id of FACT_SETS) {
    const set = C.byId[id];
    if (!set || set.points) continue;
    if (FACT_SCOPE[id] && !FACT_SCOPE[id](name)) continue;
    const e = C.entry(set, name);
    if (e.status === 'graded') facts[id] = {values: e.values.slice(), note: e.note || ''};
    else if (e.status === 'other' && NEGATION_SAFE[id] === 'all' && e.values.length) facts[id] = {values: e.values.slice(), note: e.note || ''};
  }
  for (const [key, f] of Object.entries(extra.facts)) {
    // 'suppliedData' facts (OPEC by one edition's list, a 기출 table's largest group) are practised
    // with their data shown, never recalled.
    if (f.practice === 'suppliedData') continue;
    if (f.values[name]) facts[key] = {values: f.values[name].slice(), note: '', source: f.source};
  }
  const s = stats.countries[name];
  entities[name] = {
    type: 'country', name, iso3: s ? s.iso3 : shapes.byName[name].code,
    region: C.regionOf[name] || null, regionName: regionName[C.regionOf[name]] || null,
    ...hemispheres(name), lines: lines(name), facts,
    // Only indicators with a comparison margin; yearly net migration of a country is too volatile.
    values: Object.assign(s ? Object.fromEntries(Object.entries(s.values).filter(([k]) => k in COUNTRY_INDICATORS)) : {}, (economy.countries[name] || {}).values || {}),
  };
}

const indicators = {};
const seriesOf = {};  // seriesOf[ind][name] = {year: value} in the unit of the shown table
for (const [id, meta] of Object.entries(COUNTRY_INDICATORS)) {
  indicators[id] = {...meta, entityType: 'country', year: stats.meta.baseYear, source: stats.meta.source, disabled: false, unstablePairs: []};
  seriesOf[id] = Object.fromEntries(Object.entries(stats.countries).map(([n, c]) => [n, (c.series || {})[id] || (((economy.countries[n] || {}).series || {})[id]) || {}]));
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
// An ageing index is a ratio of the two age groups, not the elderly share itself.
indicators['cont-agingIndex'] = {label:'노령화 지수(유소년 100명당 노년 인구)',unit:'명',more:'노령화 지수가 높다',
  entityType:'continent',year:stats.meta.baseYear,source:'세계은행 WDI 연령별 인구',compare:{type:'ratio',min:1.1},static:false,disabled:false,unstablePairs:[]};
seriesOf['cont-agingIndex'] = {};
for (const [name, c] of Object.entries(groupSeries.groups)) {
  if (!entities[name] || entities[name].type !== 'continent') continue;
  const ser = {};
  for (const [y, old] of Object.entries(c.series.old || {})) {
    const young = (c.series.young || {})[y];
    if (young > 0) ser[y] = old / young * 100;
  }
  seriesOf['cont-agingIndex'][name] = ser;
  if (ser[stats.meta.baseYear] != null) entities[name].values['cont-agingIndex'] = ser[stats.meta.baseYear];
}
const [Y0, Y1] = REL.check.window, MIN_YEARS = REL.check.minYears;
const gapOf = (cmp, hi, lo) => (cmp.type === 'ratio' ? (hi > 0 && lo > 0 ? hi / lo : 0) : hi - lo);
const gapUnit = (cmp, unit) => (cmp.type === 'ratio' ? '배' : unit === '%' ? '%p' : unit);
const gapText = (cmp, g, unit) => (cmp.type === 'ratio' ? g.toFixed(2) : String(Math.round(g * 10) / 10)) + gapUnit(cmp, unit);
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
  const fmtv = v => (Math.round(v * 100) / 100).toLocaleString('ko-KR') + m.unit;
  const flipped = years.filter(y => a[y] <= b[y]);
  Object.assign(out, {years: [years[0], years[years.length - 1]], n: years.length});
  // A lecture direction the data contradict in every year: report it, never guess the cause.
  if (directed && flipped.length === years.length) return Object.assign(out, {status: 'conflict',
    reason: `현재 자료는 ${years[0]}~${years[years.length - 1]}년 모두 ${lo} ≥ ${hi}(${years[years.length - 1]}년 ${fmtv(b[years[years.length - 1]])} 대 ${fmtv(a[years[years.length - 1]])}). 기출·강의 값과 다른 원인은 원출처 대조 전까지 정하지 않음`});
  if (flipped.length) return Object.assign(out, {status: 'reversed',
    reason: '순서가 바뀐 해: ' + flipped.map(y => `${y}년 ${hi} ${fmtv(a[y])}·${lo} ${fmtv(b[y])}`).join(', ')});
  const gaps = years.map(y => [y, gapOf(m.compare, a[y], b[y])]).concat([['표시값', gapOf(m.compare, va[ind], vb[ind])]]);
  const least = gaps.reduce((x, y) => (y[1] < x[1] ? y : x));
  out.minGap = gapText(m.compare, least[1], m.unit);
  // The margin filters what is asked from memory; it does not make the relation unstable.
  if (least[1] < m.compare.min) return Object.assign(out, {status: 'belowMargin',
    reason: `방향은 ${m.static ? years.join('·') + '년 기준' : '매년'} 같음. 최소 차이 ${gapText(m.compare, least[1], m.unit)}(${least[0]}${least[0] === '표시값' ? '' : '년'}) < 출제 기준 ${m.compare.min}${gapUnit(m.compare, m.unit)}`});
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
  Object.assign(out, {years: [years[0], years[years.length - 1]], n: years.length, minAbs: Math.round(Math.min(...years.map(y => Math.abs(a[y])), Math.abs(v)) * 10) / 10});
  const flipped = years.filter(y => (a[y] > 0) !== out.positive);
  if (flipped.length) return Object.assign(out, {status: 'reversed', reason: '부호가 바뀐 해: ' + flipped.map(y => `${y}년 ${Math.round(a[y] * 10) / 10}${m.unit}`).join(', ')});
  const small = years.filter(y => Math.abs(a[y]) < m.sign.min).map(y => `${y}년 ${Math.round(a[y] * 10) / 10}${m.unit}`);
  if (Math.abs(v) < m.sign.min) small.push('표시값');
  if (small.length) return Object.assign(out, {status: 'belowMargin', reason: `부호는 매년 같음. 절댓값이 출제 기준 ${m.sign.min}${m.unit} 미만인 해: ${small.join(', ')}`});
  return Object.assign(out, {status: 'active'});
}
const relations = [], signs = [];
for (const r of REL.relations) {
  const add = (hi, lo, directed, form) => relations.push(Object.assign(checkPair(r.indicator, hi, lo, directed), {form, basis: r.basis}, r.given ? {given: r.given} : {}));
  for (const [hi, lo] of r.pairs || []) add(hi, lo, true, 'pairs');
  (r.tiers || []).forEach((tier, i) => r.tiers.slice(i + 1).flat().forEach(lo => tier.forEach(hi => add(hi, lo, true, 'tiers'))));
  const g = r.group || [];
  g.forEach((a, i) => g.slice(i + 1).forEach(b => add(a, b, false, 'group')));
  for (const n of r.signs || []) signs.push(Object.assign(checkSign(r.indicator, n), {basis: r.basis}));
}

// --- agriculture (R1: data/agriculture.json, docs/AGRICULTURE-DATA-HANDOFF.md) ---
// Crops and livestock are 대상 themselves, valued by their world or regional totals;
// countries and continents get crop and herd columns. Each column stays inside one FAOSTAT
// domain: QCL production and herds (rice as paddy), FBS balances (processed products
// converted), TCL trade in the raw item. The whitelist is data/exam-relations-agriculture.json,
// checked here again with the same window as the rest; indicators carry domain 'agri' so only
// themes that list the domain recall them.
const agri = read('data/agriculture.json');
const AGRI = read('data/exam-relations-agriculture.json');
const agriAudit = read('audit/agriculture-validation-20261021.json');
const agriCards = read('data/concepts/agriculture.json');
const AGRI_YEAR = '2023';  // the latest year all three domains report
const AGRI_POOL = require(path.join(ROOT, 'assets/exam-themes.js')).byId['country-agriculture'].pool;
// The same rule as resolve() in scripts/build-agriculture-data.py: a composite region sums its
// parts over their common years, and its ratios are recomputed from the summed totals.
function agriSeries(name, key) {
  const e = agri.entities[name];
  if (!e) return {};
  if (e.areaCodes.length > 1 && /^(fbs-exportRatio|qcl-yield):/.test(key)) {
    const item = key.split(':')[1], [p, q, f] = key.startsWith('fbs') ? ['fbs-exports:', 'fbs-production:', 100] : ['qcl-production:', 'qcl-area:', 1000];
    const a = agriSeries(name, p + item), b = agriSeries(name, q + item);
    return Object.fromEntries(Object.keys(a).filter(y => b[y] > 0).map(y => [y, f * a[y] / b[y]]));
  }
  const cols = e.areaCodes.map(c => (agri.seriesByArea[c] || {})[key] || {});
  return Object.fromEntries(Object.keys(cols[0]).filter(y => cols.every(c => y in c)).map(y => [y, cols.reduce((s, c) => s + c[y], 0)]));
}
const QCL = 'FAOSTAT QCL(생산량·사육 두수, 쌀은 벼 기준)', FBS = 'FAOSTAT FBS(식량 수급표, 가공품 환산 포함)', TCL = 'FAOSTAT TCL(원품목 교역)';
const ratio = {type: 'ratio', min: AGRI.check.minRatio};
// key: one FAOSTAT series for a country or continent; prefix + area: the crop or animal in that area.
const AGRI_INDICATORS = {
  'agri-wheat': {type: 'country', key: 'qcl-production:밀', label: '밀 생산량', unit: '만 t', scale: 1e4, more: '밀 생산량이 많다', source: QCL},
  'agri-rice': {type: 'country', key: 'qcl-production:쌀', label: '쌀(벼) 생산량', unit: '만 t', scale: 1e4, more: '쌀 생산량이 많다', source: QCL},
  'agri-maize': {type: 'country', key: 'qcl-production:옥수수', label: '옥수수 생산량', unit: '만 t', scale: 1e4, more: '옥수수 생산량이 많다', source: QCL},
  'agri-coffee': {type: 'country', key: 'qcl-production:커피', label: '커피 생산량', unit: '만 t', scale: 1e4, more: '커피 생산량이 많다', source: QCL},
  'agri-cattle': {type: 'country', key: 'qcl-stocks:소', label: '소 사육 두수(물소 제외)', unit: '만 마리', scale: 1e4, more: '소 사육 두수가 많다', source: QCL},
  'agri-pigs': {type: 'country', key: 'qcl-stocks:돼지', label: '돼지 사육 두수', unit: '만 마리', scale: 1e4, more: '돼지 사육 두수가 많다', source: QCL},
  'agri-sheep': {type: 'country', key: 'qcl-stocks:양', label: '양 사육 두수', unit: '만 마리', scale: 1e4, more: '양 사육 두수가 많다', source: QCL},
  'agri-riceExports': {type: 'country', key: 'fbs-exports:쌀', label: '쌀 수출량', unit: '만 t', scale: 1e4, more: '쌀 수출량이 많다', source: FBS},
  'agri-grainNet': {type: 'country', key: 'fbs-netExports:곡물 전체', label: '곡물 순수출량(수출−수입)', unit: '만 t', scale: 1e4, more: '곡물 순수출량이 많다', source: FBS,
    sign: {pos: '곡물 순수출국이다', neg: '곡물 순수입국이다', min: 10}},
  'agri-wheatNet': {type: 'country', key: 'fbs-netExports:밀', label: '밀 순수출량(수출−수입)', unit: '만 t', scale: 1e4, more: '밀 순수출량이 많다', source: FBS,
    sign: {pos: '밀 순수출국이다', neg: '밀 순수입국이다', min: 10}},
  'agri-maizeNet': {type: 'country', key: 'tcl-netExports:옥수수', label: '옥수수 순수출량(수출−수입)', unit: '만 t', scale: 1e4, more: '옥수수 순수출량이 많다', source: TCL,
    sign: {pos: '옥수수 순수출국이다', neg: '옥수수 순수입국이다', min: 10}},
  'cont-rice': {type: 'continent', key: 'qcl-production:쌀', label: '쌀(벼) 생산량', unit: '백만 t', scale: 1e6, more: '쌀 생산량이 많다', source: QCL},
  'cont-wheat': {type: 'continent', key: 'qcl-production:밀', label: '밀 생산량', unit: '백만 t', scale: 1e6, more: '밀 생산량이 많다', source: QCL},
  'cont-maize': {type: 'continent', key: 'qcl-production:옥수수', label: '옥수수 생산량', unit: '백만 t', scale: 1e6, more: '옥수수 생산량이 많다', source: QCL},
  'cont-grainNet': {type: 'continent', key: 'fbs-netExports:곡물 전체', label: '곡물 순수출량(수출−수입)', unit: '백만 t', scale: 1e6, more: '곡물 순수출량이 많다', source: FBS,
    sign: {pos: '곡물 순수출 지역이다', neg: '곡물 순수입 지역이다', min: 1}},
  'crop-production': {type: 'crop', prefix: 'qcl-production', area: '세계', label: '세계 생산량', unit: '백만 t', scale: 1e6, more: '세계 생산량이 많다', source: QCL},
  'crop-exports': {type: 'crop', prefix: 'fbs-exports', area: '세계', label: '세계 수출량', unit: '백만 t', scale: 1e6, more: '세계 수출량이 많다', source: FBS},
  'crop-exportRatio': {type: 'crop', prefix: 'fbs-exportRatio', area: '세계', label: '생산량 대비 수출량 비율', unit: '%', scale: 1, more: '생산량 대비 수출량 비율이 높다', source: FBS},
  'crop-yield': {type: 'crop', prefix: 'qcl-yield', area: '세계', label: '단위 면적당 생산량(세계 평균)', unit: 't/ha', scale: 1000, more: '단위 면적당 생산량이 많다', source: QCL},
  'crop-oceania': {type: 'crop', prefix: 'qcl-production', area: '오세아니아', label: '오세아니아의 생산량', unit: '만 t', scale: 1e4, more: '오세아니아의 생산량이 많다', source: QCL},
  'lv-stocks': {type: 'livestock', prefix: 'qcl-stocks', area: '세계', label: '세계 사육 두수', unit: '백만 마리', scale: 1e6, more: '세계 사육 두수가 많다', source: QCL},
  'lv-meat': {type: 'livestock', prefix: 'qcl-meat', area: '세계', label: '세계 육류 생산량', unit: '백만 t', scale: 1e6, more: '세계 육류 생산량이 많다', source: QCL},
  'lv-americas': {type: 'livestock', prefix: 'qcl-stocks', area: '아메리카', label: '아메리카의 사육 두수', unit: '백만 마리', scale: 1e6, more: '아메리카의 사육 두수가 많다', source: QCL},
  'lv-oceania': {type: 'livestock', prefix: 'qcl-stocks', area: '오세아니아', label: '오세아니아의 사육 두수', unit: '백만 마리', scale: 1e6, more: '오세아니아의 사육 두수가 많다', source: QCL},
  'lv-africa': {type: 'livestock', prefix: 'qcl-stocks', area: '아프리카', label: '아프리카의 사육 두수', unit: '백만 마리', scale: 1e6, more: '아프리카의 사육 두수가 많다', source: QCL},
  'lv-australia': {type: 'livestock', prefix: 'qcl-stocks', area: '오스트레일리아', label: '오스트레일리아의 사육 두수', unit: '만 마리', scale: 1e4, more: '오스트레일리아의 사육 두수가 많다', source: QCL},
  'lv-brazil': {type: 'livestock', prefix: 'qcl-stocks', area: '브라질', label: '브라질의 사육 두수', unit: '만 마리', scale: 1e4, more: '브라질의 사육 두수가 많다', source: QCL},
  'lv-china': {type: 'livestock', prefix: 'qcl-stocks', area: '중국', label: '중국의 사육 두수', unit: '만 마리', scale: 1e4, more: '중국의 사육 두수가 많다', source: QCL},
};
const AGRI_ITEMS = {crop: ['밀', '쌀', '옥수수'], livestock: ['소', '돼지', '양']};
for (const [type, names] of Object.entries(AGRI_ITEMS)) for (const name of names) {
  const card = agriCards.entities[name];
  if (!card || card.type !== type) throw new Error('no concept card for ' + name);
  // `region` groups the cards so a false claim borrows a value another crop or animal has.
  entities[name] = {type, name, region: type, facts: {}, values: {}, source: card.source};
}
for (const [id, m] of Object.entries(AGRI_INDICATORS)) {
  indicators[id] = {label: m.label, unit: m.unit, more: m.more, entityType: m.type, domain: 'agri', year: AGRI_YEAR, source: m.source,
    compare: ratio, static: false, disabled: false, unstablePairs: []};
  if (m.sign) indicators[id].sign = m.sign;
  seriesOf[id] = {};
  const names = m.key ? Object.keys(entities).filter(n => entities[n].type === m.type) : AGRI_ITEMS[m.type];
  for (const n of names) {
    const raw = m.key ? agriSeries(n, m.key) : agriSeries(m.area, m.prefix + ':' + n);
    if (raw[AGRI_YEAR] == null) continue;
    seriesOf[id][n] = Object.fromEntries(Object.entries(raw).map(([y, v]) => [y, v / m.scale]));
    entities[n].values[id] = raw[AGRI_YEAR] / m.scale;
  }
}
const agriByKey = {}, agriByArea = {};
for (const [id, m] of Object.entries(AGRI_INDICATORS)) {
  if (m.key) agriByKey[m.type + '|' + m.key] = id;
  else agriByArea[m.prefix + '|' + m.area] = id;
}
const typeOf = n => (entities[n] || {}).type;
// Whitelist rows about areas that are not 대상 here (아메리카 as one, 북아메리카) are kept with the reason.
const outOfScope = [], notHere = x => outOfScope.push(Object.assign(x, {status: 'excluded', reason: '기출형 대상(국가·대륙)이 아닌 지역'}));
for (const r of AGRI.relations) {
  for (const [hi, lo] of r.pairs || []) {
    const ind = agriByKey[typeOf(hi) + '|' + r.indicator];
    if (!ind || typeOf(hi) !== typeOf(lo)) notHere({indicator: r.indicator, hi, lo, form: 'pairs', basis: r.basis});
    else relations.push(Object.assign(checkPair(ind, hi, lo, true), {form: 'pairs', basis: r.basis}, r.given ? {given: r.given} : {}));
  }
  for (const n of r.signs || []) {
    const ind = agriByKey[typeOf(n) + '|' + r.indicator];
    if (!ind) { notHere({indicator: r.indicator, entity: n, basis: r.basis}); continue; }
    const s = Object.assign(checkSign(ind, n), {basis: r.basis});
    if (s.status === 'active' && s.positive !== (r.expectedSign > 0)) Object.assign(s, {status: 'conflict', reason: '강의·기출의 방향과 자료의 부호가 다름'});
    signs.push(s);
  }
}
// Orders: a world first place becomes a fact about the crop or animal and, against the
// theme's other countries, a set of pairs; an order within one area becomes pairs of items.
const agriFactSets = {}, FIRST = {crop: ['topProducer', '세계 최대 생산국', '{value}이/가 세계 최대 생산국이다'], livestock: ['topRaiser', '세계 최대 사육국', '{value}이/가 세계 최대 사육국이다']};
for (const o of AGRI.orders) {
  if (o.entity) {
    const item = o.indicator.split(':')[1], verdict = agriAudit.orders.find(x => x.id === o.id);
    // Only a first place that held in every year, against every reporting country, is recalled.
    if (!verdict || verdict.status !== 'active') continue;
    const type = typeOf(item);
    if (FIRST[type]) {
      const [set, title, template] = FIRST[type];
      const fs_ = agriFactSets[set] || (agriFactSets[set] = {title, multi: false, negationSafe: false, exclusive: true, template, options: {}});
      fs_.options[o.entity] = o.entity;
      entities[item].facts[set] = {values: [o.entity], note: '', source: o.basis};
    }
    const ind = agriByKey['country|' + o.indicator];
    if (ind) for (const lo of AGRI_POOL) if (lo !== o.entity && entities[lo].values[ind] != null) relations.push(Object.assign(checkPair(ind, o.entity, lo, true), {form: 'first', basis: o.basis}));
  } else {
    const ind = agriByArea[o.prefix + '|' + o.area];
    if (!ind) continue;
    o.items.forEach((hi, i) => o.items.slice(i + 1).forEach(lo => relations.push(Object.assign(checkPair(ind, hi, lo, true), {form: 'order', basis: o.basis}))));
  }
}
// Concept cards (data/concepts/agriculture.json): a set whose values are exclusive also makes
// false claims; a non-exclusive one only true ones. Statements are kept as written.
for (const [set, s] of Object.entries(agriCards.sets)) {
  const holders = s.scope.filter(n => entities[n] && AGRI_ITEMS[typeOf(n)]);
  if (!holders.length) continue;
  agriFactSets[set] = {title: s.label, multi: !s.exclusive, negationSafe: false, exclusive: !!s.exclusive, template: s.template,
    options: Object.fromEntries(s.options.map(o => [o, o])), source: s.source};
  for (const n of holders) entities[n].facts[set] = {values: s.values[n].slice(), note: '', source: s.source};
}
const concepts = agriCards.statements.map((s, i) => ({id: 'agri-' + (i + 1), about: s.about, claim: s.claim, truth: s.truth, source: s.source}))
  .filter(s => s.about.every(n => entities[n] && AGRI_ITEMS[typeOf(n)]));

// Compositions used as identification data. Shares are percentages of the stated total;
// `orderMargin` is the gap every year must keep between ranked categories.
const compositions = {
  exports: {year: economy.meta.baseYear, source: '세계은행 WDI(UN Comtrade 비중·WTO 상품수출 총액)', unit: '% (상품 수출액 대비)', orderMargin: 10, rankExclude: [],
    categories: [['fuel', '연료'], ['ores', '광석·금속'], ['food', '식료품'], ['agriculturalRaw', '농업 원료'], ['manufactures', '공산품'], ['other', '기타']],
    values: Object.fromEntries(Object.entries(economy.exports).map(([n, c]) => [n, c.values])),
    total: {indicator: 'exports', label: '상품 수출 총액', unit: '십억 달러', year: economy.meta.baseYear, source: '세계은행 WDI(WTO)',
      values: Object.fromEntries(Object.entries(economy.exports).map(([n, c]) => [n, c.total]))}},
  electricity: {year: electricity.meta.baseYear, source: electricity.meta.source, unit: '% (발전량 비중)', orderMargin: 10, rankExclude: [],
    categories: [['coal', '석탄'], ['gas', '천연가스'], ['oil', '석유'], ['nuclear', '원자력'], ['hydro', '수력'], ['wind', '풍력'], ['solar', '태양광'], ['other', '기타(바이오·지열 등)']],
    values: Object.fromEntries(Object.entries(electricity.countries).map(([n, c]) => [n, c.values])),
    // Same OWID rows as the shares, so share × total is one source and one year.
    total: {label: '총발전량', unit: 'TWh', year: electricity.meta.baseYear, source: electricity.meta.source,
      values: Object.fromEntries(Object.entries(electricity.countries).filter(([, c]) => c.generation != null).map(([n, c]) => [n, c.generation]))}},
  religion: {year: religion.meta.baseYear, source: religion.meta.source, unit: '% (인구 대비)', orderMargin: 2, rankExclude: ['unaffiliated', 'other'],
    categories: [['christianity', '크리스트교'], ['islam', '이슬람교'], ['hinduism', '힌두교'], ['buddhism', '불교'], ['judaism', '유대교'], ['unaffiliated', '무종교'], ['other', '기타 종교']],
    values: Object.fromEntries(Object.entries(religion.countries).map(([n, c]) => [n, c.values])),
    // Same year and source as the shares, so share × total is a valid head count.
    total: {label: '총인구', unit: '만 명', year: religion.meta.baseYear, source: religion.meta.source,
      values: Object.fromEntries(Object.entries(religion.countries).map(([n, c]) => [n, c.population]))}},
};
const compositionSeries = {
  exports: Object.fromEntries(Object.entries(economy.exports).map(([n, c]) => [n, c.series])),
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
  const broken = [];
  for (const [y, v] of rows) {
    const gaps = order.map((k, i) => v[k] - (i + 1 < order.length ? v[order[i + 1]] : Math.max(...rest.map(o => v[o] || 0))));
    const g = Math.min(...gaps);
    if (g <= 0) broken.push(y);
    if (g < least[1]) least = [y, g];
  }
  Object.assign(out, {years: [years[0], years[years.length - 1]], n: years.length, minGap: Math.round(least[1] * 10) / 10});
  if (broken.length) return Object.assign(out, {status: 'reversed', reason: `순서가 성립하지 않는 해: ${broken.join('·')}`});
  if (least[1] < c.orderMargin) return Object.assign(out, {status: 'belowMargin', reason: `순서는 확인한 모든 해에 같음. 최소 간격 ${Math.round(least[1] * 10) / 10}%p(${least[0]}${least[0] === '표시값' ? '' : '년'}) < 출제 기준 ${c.orderMargin}%p`});
  return Object.assign(out, {status: 'active'});
}
const orders = [];
for (const o of REL.orders) {
  const list = o.fromSet
    ? o.entities.filter(n => C.byId[o.fromSet] && C.entry(C.byId[o.fromSet], n).status === 'graded' && C.entry(C.byId[o.fromSet], n).values.length === 1)
      .map(n => [n, C.entry(C.byId[o.fromSet], n).values.slice()])
    : Object.entries(o.orders);
  for (const [n, order] of list) orders.push(Object.assign(checkOrder(o.composition, n, order), {basis: o.basis}));
}

// --- climate graphs: lecture climate types checked against the station normals ---
// Lecture 1권 P02 thresholds: A 최한월 18℃ 이상, B 건조 한계 미만, C 최한월 −3~18℃·최난월 10℃ 이상,
// D 최한월 −3℃ 미만, E 최난월 10℃ 미만. A type counts as knowledge only when the station data give
// the same code with every deciding gap at least CLIMATE_MARGIN.
const climate = read('data/climate-normals.json');
const CLIMATE_MARGIN = {'℃': 1, mm: 10, '%': 15};
const CLIMATE_LABEL = {af: '열대 우림 기후', am: '열대 몬순 기후', aw: '사바나 기후', bw: '사막 기후', bs: '스텝 기후',
  cs: '지중해성 기후', cfb: '서안 해양성 기후', cfa: '온난 습윤 기후', cw: '온대 겨울 건조 기후',
  df: '냉대 습윤 기후', dw: '냉대 겨울 건조 기후', et: '툰드라 기후', ef: '빙설 기후', h: '고산 기후'};
function koppen(T, P, lat) {
  const sum = a => a.reduce((x, y) => x + y, 0), Tw = Math.max(...T), Tc = Math.min(...T), Tann = sum(T) / 12, Pann = sum(P);
  const summer = lat >= 0 ? [3, 4, 5, 6, 7, 8] : [9, 10, 11, 0, 1, 2], winter = [...Array(12).keys()].filter(i => !summer.includes(i));
  const Ps = sum(summer.map(i => P[i])), gaps = [];
  // A deciding gap in ℃, mm, or percent of the limit, tagged with the code letter it decides.
  const gap = (level, value, limit, unit) => gaps.push({level, size: unit === '%' ? Math.abs(value - limit) / Math.max(Math.abs(limit), 1) * 100 : Math.abs(value - limit), unit});
  const test = (level, value, limit, unit) => { gap(level, value, limit, unit); return value >= limit; };
  let code;
  if (!test(1, Tw, 10, '℃')) code = test(2, Tw, 0, '℃') ? 'et' : 'ef';
  else {
    const dryLimit = 20 * Tann + (Ps / Pann >= 0.7 ? 280 : (Pann - Ps) / Pann >= 0.7 ? 0 : 140);
    if (!test(1, Pann, dryLimit, '%')) code = test(2, Pann, dryLimit / 2, '%') ? 'bs' : 'bw';
    else if (test(1, Tc, 18, '℃')) {
      const dry = Math.min(...P);
      code = test(2, dry, 60, 'mm') ? 'af' : test(2, dry, 100 - Pann / 25, 'mm') ? 'am' : 'aw';
    } else {
      const group = test(1, Tc, -3, '℃') ? 'c' : 'd';
      const sDry = Math.min(...summer.map(i => P[i])), wWet = Math.max(...winter.map(i => P[i]));
      const wDry = Math.min(...winter.map(i => P[i])), sWet = Math.max(...summer.map(i => P[i]));
      // s needs both conditions; when it fails, the clearer failing condition decides the gap.
      const a = [Math.abs(sDry - 40) / 40 * 100, Math.abs(sDry - wWet / 3) / Math.max(wWet / 3, 1) * 100];
      const isS = sDry < 40 && sDry < wWet / 3, isW = wDry < sWet / 10;
      gaps.push({level: 2, size: isS ? Math.min(...a) : Math.max(...[sDry >= 40 ? a[0] : 0, sDry >= wWet / 3 ? a[1] : 0]), unit: '%'});
      gap(2, wDry, sWet / 10, '%');
      code = group + (isS && !isW ? 's' : isW && !isS ? 'w' : isS && isW ? (wDry / sWet < sDry / wWet ? 'w' : 's') : 'f') + (test(3, Tw, 22, '℃') ? 'a' : 'b');
    }
  }
  // The deepest code letter whose deciding gaps all clear the margin.
  let robust = 0;
  for (let level = 1; level <= 3; level++) {
    if (gaps.filter(g => g.level === level).every(g => g.size >= CLIMATE_MARGIN[g.unit])) robust = level; else break;
  }
  if (robust === 2 && code.length === 2) robust = 3;
  return {code, robust};
}
// Köppen letters as the lecture writes them: Aw, BS, Cfb, ET.
const koppenCode = t => t.split('').map((ch, i) => (i === 0 || (i === 1 && /[be]/.test(t[0])) ? ch.toUpperCase() : ch)).join('');
const climateTypes = [];
const CLIMATE_BASIS = '강의 1권 P02 기출 도시의 기후(분류 지도 climateCities)';
for (const s of climate.sites) {
  if (!s.usage.climateGraph) {
    climateTypes.push({entity: s.name, lecture: s.lectureClimate, status: 'excluded', reason: '그래프에 쓸 기온·강수 자료가 없음(' + s.status + ')', basis: CLIMATE_BASIS});
    continue;
  }
  if (entities[s.name]) throw new Error('climate site name collides with an entity: ' + s.name);
  const T = s.temperatureC, P = s.precipitationMm, lat = s.station.latitude, k = koppen(T, P, lat);
  const coldest = T.indexOf(Math.min(...T)) + 1, range = Math.max(...T) - Math.min(...T);
  // Hemisphere seen in the data: coldest month in 12~2월 (north) or 6~8월 (south), range ≥ 5℃.
  const signal = range >= 5 ? ([12, 1, 2].includes(coldest) ? 'N' : [6, 7, 8].includes(coldest) ? 'S' : null) : null;
  const hemisphere = lat >= 0 ? 'N' : 'S', L = s.lectureClimate;
  if (signal && signal !== hemisphere) throw new Error(s.name + ': seasons disagree with the station latitude');
  let status, reason;
  if (L === 'h') { status = 'excluded'; reason = '고산 기후는 저온의 원인이 고도이므로 월별 기온·강수만으로 판별하지 않음'; }
  else if (k.code.slice(0, L.length) !== L) { status = 'conflict'; reason = `관측소 평년값으로는 ${koppenCode(k.code)}(강의 ${koppenCode(L)}). 경계 지점이므로 기후형을 식별 근거로 쓰지 않음`; }
  else if (k.robust < L.length) { status = 'belowMargin'; reason = `같은 ${koppenCode(L)}이지만 경계 기준과의 차이가 작음(기준 ${CLIMATE_MARGIN['℃']}℃·${CLIMATE_MARGIN.mm}mm·${CLIMATE_MARGIN['%']}%)`; }
  else { status = 'active'; reason = ''; }
  climateTypes.push({entity: s.name, lecture: L, computed: k.code, status, reason, basis: CLIMATE_BASIS});
  entities[s.name] = {type: 'site', name: s.name, region: s.region, label: s.mapPoint, facts: {}, values: {},
    climate: {temperature: T, precipitation: P, lat, hemisphere, elevation: s.station.elevationM, lecture: L, computed: k.code, robust: k.robust,
      type: status === 'active' ? L : null, signal, coldest, range: Math.round(range * 10) / 10,
      annual: Math.round(P.reduce((a, b) => a + b, 0)), summerShare: s.derived.jjaPrecipitationSharePct,
      station: s.station.name, sourceId: s.sourceId}};
}

const out = {
  generated: 'scripts/build-entity-kb.cjs',
  sources: {countries: stats.meta, economy: economy.meta, groups: groupSeries.meta, extraFacts: extra.about, rankingsCheckedAt: R.checkedAt || null},
  check: REL.check,
  factSets: Object.assign(Object.fromEntries(FACT_SETS.filter(id => C.byId[id]).map(id => [id, {
    title: C.byId[id].title, multi: !!C.byId[id].multi, negationSafe: NEGATION_SAFE[id] === 'all', exclusive: EXCLUSIVE.includes(id),
    options: Object.fromEntries(C.optionsFor(C.byId[id]).map(o => [o.id, o.label])),
  }])), agriFactSets),
  extraFacts: Object.fromEntries(Object.entries(extra.facts).map(([k, f]) => [k, {label: f.label, complete: f.complete, source: f.source}])),
  indicators, entities, compositions, relations, signs, orders, concepts, outOfScope,
  climate: {period: climate.normalPeriod, source: '관측소 월평년값(WMO 제출 자료 우선, JMA·ECCC 보충)', margin: CLIMATE_MARGIN, types: CLIMATE_LABEL, verdicts: climateTypes},
};
// Verified is not the same as practicable: count how often each active relation reaches a
// generated question (identification basis or <보기>) in a fixed sample of seeds.
const PRACTICE_SEEDS = 1000;
const engine = require(path.join(ROOT, 'assets/exam-engine.js')).create(out, require(path.join(ROOT, 'assets/exam-themes.js')));
const uses = {}, hit = k => { uses[k] = (uses[k] || 0) + 1; };
const pairKey = (ind, a, b) => 'r|' + ind + '|' + [a, b].sort().join('|');
for (const t of engine.themes) for (let seed = 1; seed <= PRACTICE_SEEDS; seed++) {
  const q = engine.build({themeId: t.id, seed});
  if (!q) continue;
  const b = q.stage1.basis;
  (b.relations || []).forEach(x => hit(pairKey(x.indicator, x.hi, x.lo)));
  (b.signs || []).forEach(x => hit('s|' + x.indicator + '|' + x.entity));
  // A longer order implies the shorter one, so both count as practised.
  (b.orders || []).forEach(x => hit('o|' + x.composition + '|' + x.entity));
  (b.sites || []).forEach(x => { if (x.type) hit('k|' + x.entity); });
  for (const st of q.stage2.statements) {
    if (st.kind === 'compare') hit(pairKey(st.check.ind, st.check.subject, st.check.object));
    if (st.kind === 'sign') hit('s|' + st.check.ind + '|' + st.check.entity);
  }
}
for (const x of relations) if (x.status === 'active') x.practice = uses[pairKey(x.indicator, x.hi, x.lo)] || 0;
for (const x of signs) if (x.status === 'active') x.practice = uses['s|' + x.indicator + '|' + x.entity] || 0;
for (const x of orders) if (x.status === 'active') x.practice = uses['o|' + x.composition + '|' + x.entity] || 0;
for (const x of climateTypes) if (x.status === 'active') x.practice = uses['k|' + x.entity] || 0;
out.practiceSample = {seedsPerTheme: PRACTICE_SEEDS, themes: engine.themes.map(t => t.id)};

fs.writeFileSync(process.env.KB_OUT || path.join(ROOT, 'assets/entity-kb.js'),
  '/* Generated by scripts/build-entity-kb.cjs. Do not edit by hand. */\n' +
  "(function(root,data){if(typeof module==='object'&&module.exports)module.exports=data;else root.WGEntityKB=data})" +
  "(typeof globalThis!=='undefined'?globalThis:this," + JSON.stringify(out) + ');\n');
const counts = {};
Object.values(entities).forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1; });
console.log('entities', counts, 'indicators', Object.keys(indicators).length);
for (const [label, list] of [['relations', relations], ['signs', signs], ['orders', orders], ['climate types', climateTypes]]) {
  const by = {};
  list.forEach(x => { by[x.status] = (by[x.status] || 0) + 1; });
  const idle = list.filter(x => x.status === 'active' && !x.practice);
  console.log(label, by, 'active but never in a sampled question:', idle.length);
  const name = x => (x.indicator || x.composition) + ' ' + (x.hi ? x.hi + ' > ' + x.lo : x.entity + (x.order ? ' ' + x.order.join('>') : ''));
  if (process.argv.includes('--report')) {
    for (const x of list) if (x.status !== 'active') console.log('  ', x.status, name(x), '—', x.reason);
    for (const x of idle) console.log('   notPractised', name(x));
  }
}
