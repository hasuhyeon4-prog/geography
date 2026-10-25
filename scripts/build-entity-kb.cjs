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
const LANDLOCKED = read('data/landlocked-countries.json');
const OPEC_YEARS = Object.values(read('data/opec-membership-by-year.json').years).map(y => y.members);
const OPEC_STABLE = {member: OPEC_YEARS[0].filter(n => OPEC_YEARS.every(m => m.includes(n)))};
// A non-member is told so only within the regions that hold a stable member; elsewhere it says nothing.
const OPEC_REGIONS = new Set(OPEC_STABLE.member.map(n => C.regionOf[n]).filter(Boolean));
OPEC_STABLE.never = Object.keys(LANDLOCKED.appValues).filter(n => OPEC_YEARS.every(m => !m.includes(n)) && OPEC_REGIONS.has(C.regionOf[n]));
const OPEC_SETS = {landlocked: {title: '바다와 접하지 않은 내륙국', multi: false, negationSafe: false, exclusive: true, falseFromOthers: true, options: {yes: '내륙국', no: '해안국'}},
  opec: {title: 'OPEC 회원국(2015~2025년 매년 연말)', multi: false, negationSafe: false, exclusive: true, falseFromOthers: true, options: {member: '회원국', no: '비회원국'}}};
const electricity = read('data/electricity-mix.json');
const religion = read('data/religion-composition.json');
// The same Pew release unrounded (R5). Religion orders must also hold on these rows.
const religionRaw = read('data/religion-composition-extension.json');
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
// Set entries the lecture declines to state as one country-wide fact. 나이지리아: '국토 전체를
// 어느 하나의 종교만으로 설명하기 어렵다' (2권 P10), and the Pew editions disagree on its 1위.
// 일본: the Pew 불교 1위 folds 신토 into 기타, the lecture never names Japan's religion, and a learner
// who knows '신토·불교' could fairly reject it.
// 중국: the Pew 불교 1위 (3.7%) is within 1%p of 기타 and under the 2%p order margin, and no lecture
// block names it (audit 2026-10-23).
const FACT_UNSAFE = {religion: ['나이지리아', '일본', '중국']};

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
  for (const [line, axis, offset] of [['equator', 1, 0], ['meridian', 0, 0], ['cancer', 1, 23.44], ['capricorn', 1, -23.44], ['arcticCircle', 1, 66.56]]) {
    const usable = rings.filter(r => axis === 1 || lonSpan(r) < 180);
    const crosses = usable.some(r => r.some(p => p[axis] < offset) && r.some(p => p[axis] > offset));
    const vals = usable.flat().map(p => p[axis] - offset);
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
    if ((FACT_UNSAFE[id] || []).includes(name)) continue;
    const e = C.entry(set, name);
    if (e.status === 'graded') facts[id] = {values: e.values.slice(), note: e.note || ''};
    else if (e.status === 'other' && NEGATION_SAFE[id] === 'all' && e.values.length) facts[id] = {values: e.values.slice(), note: e.note || ''};
  }
  for (const [key, f] of Object.entries(extra.facts)) {
    if (OPEC_SETS[key]) continue;  // replaced by the complete lists above
    // 'suppliedData' facts (OPEC by one edition's list, a 기출 table's largest group) are practised
    // with their data shown, never recalled.
    if (f.practice === 'suppliedData') continue;
    if (f.values[name]) facts[key] = {values: f.values[name].slice(), note: '', source: f.source};
  }
  // 내륙국 (data/landlocked-countries.json): a complete list for UN members, Caspian coasts not
  // counted as sea, so a coastal country can be told it is not landlocked. A name outside the
  // list stays unknown. OPEC: only countries in, or out of, every year-end list 2015~2025.
  const ll = LANDLOCKED.appValues[name];
  if (ll) facts.landlocked = {values: [ll.isLandlocked ? 'yes' : 'no'], note: '', source: 'UN LLDC·지리 자료(2026-10 확인)'};
  if (OPEC_STABLE.member.includes(name)) facts.opec = {values: ['member'], note: '', source: 'EI·OPEC 연말 회원국 목록 2015~2025 매년'};
  else if (OPEC_STABLE.never.includes(name)) facts.opec = {values: ['no'], note: '', source: 'EI·OPEC 연말 회원국 목록 2015~2025 매년'};
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
// The denominator in the lecture's second bar is industry GDP, not total GDP.
// Derive it only from two published, same-year WDI values. Missing is never zero.
indicators.manufacturingInIndustry = {label: '2차 산업 중 제조업 비중', unit: '%', more: '2차 산업 중 제조업 비중이 높다',
  compare: {type: 'diff', min: 3}, entityType: 'country', year: economy.meta.baseYear,
  source: '세계은행 WDI NV.IND.MANF.ZS ÷ NV.IND.TOTL.ZS × 100', disabled: false, unstablePairs: []};
seriesOf.manufacturingInIndustry = {};
for (const [name, e] of Object.entries(entities)) {
  if (e.type !== 'country') continue;
  const m = seriesOf.manufacturing[name] || {}, d = seriesOf.industry[name] || {};
  seriesOf.manufacturingInIndustry[name] = Object.fromEntries(Object.entries(m)
    .filter(([y, v]) => v != null && d[y] > 0 && v >= 0 && v <= d[y])
    .map(([y, v]) => [y, v / d[y] * 100]));
  const v = seriesOf.manufacturingInIndustry[name][economy.meta.baseYear];
  if (v != null) e.values.manufacturingInIndustry = v;
}
// The total-GDP share is also readable when both factors are shown.
indicators.manufacturing.from = ['industry', 'manufacturingInIndustry'];
indicators.manufacturing.formula = {operation: 'product', per: 100};

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

// Exam tables keep one precision per column. 순 이주 is the lecture's term (유입 − 유출); two
// net-outflow continents are compared by the size of the outflow (negMore), as the lecture does.
Object.assign(indicators['cont-netmig'], {label: '순 이주(유입 − 유출)', decimals: 1, negMore: '순 유출 규모가 크다'});
indicators['cont-density'].decimals = 1;
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
  return Object.keys(a).filter(y => y in b && (m.window ? y >= m.window[0] && y <= m.window[1] : m.static || (y >= Y0 && y <= Y1))).sort();
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
  if (!m.static && !m.window && years.length < MIN_YEARS) return no(`${Y0}~${Y1}년 자료 ${years.length}개 연도(${MIN_YEARS}개 미만)`);
  if (m.window && years.length < m.window[2]) return no(`${m.window[0]}~${m.window[1]}년 자료 ${years.length}개 연도(${m.window[2]}개 필요)`);
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
// --- two-period urbanization (R7: data/urbanization-change.json, UN WUP 2025) ---
// Each table column is one base at one year ('wup-share@1970'). A column inside the window is
// checked every year of it (2015~2025); an earlier column every year within five years of its
// own, so no relation rests on one year's estimate. A change between two columns ('…@1970-2020',
// never shown itself) must hold for every pair of those years. Indicators carry domain 'period',
// so only the two-period themes recall them.
const WUP = read('data/urbanization-change.json'), POP = read('data/exam-relations-population-change.json');
const WUP_SRC = 'UN WUP 2025, 국가별 도시 정의(추정치)';
const PERIOD_BASES = {wup: {type: 'country', scale: 1e4, unit: '만 명', share: 5}, cwup: {type: 'continent', scale: 1e6, unit: '백만 명', share: 3}};
const WUP_KEY = {share: 'urbanShare', urban: 'urbanPopulation', rural: 'ruralPopulation', total: 'totalPopulation'};
const WUP_LABEL = {share: '도시화율', urban: '도시 인구', rural: '촌락 인구', total: '총인구'};
const years5 = y => { const lo = +y >= +Y0 ? +Y0 : Math.max(1950, +y - 5), hi = +y >= +Y0 ? +Y1 : +y + 5, out = []; for (let x = lo; x <= hi; x++) out.push(String(x)); return out; };
for (const [p, cfg] of Object.entries(PERIOD_BASES)) {
  const wupValue = (n, k, y) => { const v = ((WUP.areas[n] || {}).series || {})[WUP_KEY[k]]; return v && v[y] != null ? (k === 'share' ? v[y] : v[y] / cfg.scale) : null; };
  const names = Object.keys(WUP.areas).filter(n => entities[n] && entities[n].type === cfg.type);
  const [A, B] = POP.periods[cfg.type];
  for (const y of [A, B]) for (const k of Object.keys(WUP_KEY)) {
    const id = p + '-' + k + '@' + y, ys = years5(y);
    indicators[id] = {label: y + '년 ' + WUP_LABEL[k], unit: k === 'share' ? '%' : cfg.unit, more: y + '년 ' + (k === 'share' ? '도시화율이 높다' : WUP_LABEL[k] + '가 많다'),
      entityType: cfg.type, year: y, source: WUP_SRC, compare: k === 'share' ? {type: 'diff', min: cfg.share} : {type: 'ratio', min: 1.2},
      static: false, window: [ys[0], ys[ys.length - 1], ys.length], domain: 'period', disabled: false, unstablePairs: []};
    seriesOf[id] = {};
    for (const n of names) {
      seriesOf[id][n] = Object.fromEntries(ys.map(x => [x, wupValue(n, k, x)]).filter(([, v]) => v != null));
      if (wupValue(n, k, y) != null) entities[n].values[id] = Math.round(wupValue(n, k, y) * 10) / 10;
    }
  }
  // Changes between the two columns: share rise (%p), rural change (%), urban growth (배).
  const CHANGES = [
    {k: 'share', id: 'shareRise', label: '도시화율 상승 폭', unit: '%p', of: (a, b) => b - a, compare: {type: 'diff', min: cfg.share}, more: '도시화율 상승 폭이 크다'},
    {k: 'rural', id: 'ruralChange', label: '촌락 인구 증감률', unit: '%', of: (a, b) => (b - a) / a * 100, compare: {type: 'diff', min: 20}, more: '촌락 인구 증가율이 높다',
      sign: {min: 5, pos: A + '~' + B + '년 촌락 인구가 증가하였다', neg: A + '~' + B + '년 촌락 인구가 감소하였다'}},
    {k: 'urban', id: 'urbanGrowth', label: '도시 인구 증가율', unit: '배', of: (a, b) => b / a, compare: {type: 'ratio', min: 1.2}, more: '도시 인구 증가율이 높다'},
  ];
  for (const c of CHANGES) {
    const id = p + '-' + c.id + '@' + A + '-' + B;
    indicators[id] = {label: A + '~' + B + '년 ' + c.label, unit: c.unit, more: A + '~' + B + '년 ' + c.more, entityType: cfg.type, year: A + '~' + B, source: WUP_SRC,
      compare: c.compare, static: true, from: [p + '-' + c.k + '@' + A, p + '-' + c.k + '@' + B], domain: 'period', disabled: false, unstablePairs: []};
    if (c.sign) indicators[id].sign = c.sign;
    seriesOf[id] = {};
    for (const n of names) {
      const ser = {};
      for (const a of years5(A)) for (const b of years5(B)) { const va = wupValue(n, c.k, a), vb = wupValue(n, c.k, b); if (va != null && vb != null && va > 0) ser[a + '~' + b] = c.of(va, vb); }
      seriesOf[id][n] = ser;
      // The value the shown columns give, as rounded in the table.
      const ea = entities[n].values[p + '-' + c.k + '@' + A], eb = entities[n].values[p + '-' + c.k + '@' + B];
      if (ea != null && eb != null && ea > 0) entities[n].values[id] = Math.round(c.of(ea, eb) * 100) / 100;
    }
  }
}

const relations = [], signs = [];
for (const r of REL.relations.concat(POP.relations)) {
  const add = (hi, lo, directed, form) => relations.push(Object.assign(checkPair(r.indicator, hi, lo, directed), {form, basis: r.basis}, r.given ? {given: r.given} : {}));
  for (const [hi, lo] of r.pairs || []) add(hi, lo, true, 'pairs');
  (r.tiers || []).forEach((tier, i) => r.tiers.slice(i + 1).flat().forEach(lo => tier.forEach(hi => add(hi, lo, true, 'tiers'))));
  const g = r.group || [];
  g.forEach((a, i) => g.slice(i + 1).forEach(b => add(a, b, false, 'group')));
  for (const n of r.signs || []) signs.push(Object.assign(checkSign(r.indicator, n), {basis: r.basis}));
}

// --- 대륙별 합계 출산율 세 시점 (round two: data/fertility-un-regions.json, UN WPP 2024) ---
// 2024학년도 수능 14번: a column per year, each checked every year within five years of its own
// (the 2020 column 2015~2023, the last estimate). Domain 'fertility': only that theme recalls them.
const TFR = read('data/fertility-un-regions.json'), TFR_REL = read('data/exam-relations-fertility.json');
for (const y of TFR_REL.years) {
  const id = 'ctfr@' + y, ys = years5(y).filter(x => x <= TFR_REL.lastEstimate);
  indicators[id] = {label: y + '년 합계 출산율', unit: '명', more: y + '년 합계 출산율이 높다', entityType: 'continent', year: y,
    source: 'UN WPP 2024 지역 계열(OWID 배포)', compare: {type: 'diff', min: 0.3}, static: false, window: [ys[0], ys[ys.length - 1], ys.length],
    domain: 'fertility', disabled: false, unstablePairs: [], decimals: 2};
  seriesOf[id] = {};
  for (const [n, a] of Object.entries(TFR.areas)) {
    if (!entities[n] || entities[n].type !== 'continent') continue;
    seriesOf[id][n] = Object.fromEntries(ys.filter(x => a.series[x] != null).map(x => [x, a.series[x]]));
    entities[n].values[id] = Math.round(a.series[y] * 100) / 100;
  }
}
for (const r of TFR_REL.relations) for (const [hi, lo] of r.pairs) relations.push(Object.assign(checkPair(r.indicator, hi, lo, true), {form: 'pairs', basis: r.basis}));

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

// --- country clues (R3: data/country-clues.json) ---
// A 지역지리 question describes (가)~(다) in sentences and asks for them on the map. Only
// passages marked eligibleIdentification are used, and from them only sentences that
// - open with the country as subject ('세네갈은 …', '이집트의 …') and name no other country,
// - describe it rather than instruct ('…외우지 않는다') or point at a figure ('세 나라 중', '막대'),
// - name a place on the location map or a concept-card item that no other country's clue names
//   (다카르, 팜파스, 갓쇼즈쿠리), so the sentence settles which country it is.
const clueData = read('data/country-clues.json');
const placeNames = read('data/extension-sources/location-items.json').map(it => it.name);
const countryNames = Object.values(entities).filter(e => e.type === 'country').map(e => e.name);
const NOT_A_CLUE = /외우|단정|구별|익힌다|읽는다|판단|기억|주의|이해할 수|해야 한다|아니다|않는다|않았|없다|볼 수|바꿀|뜻|이러한|이 관계|이런|역시|사례이다|사례다|다만|그러나|반면|같은 비율|라고 해서|원문|주석|연결한다\.$|함께 설명|고려한다|세 나라|두 나라|네 나라|막대|그래프|표에서|[A-E]와|대응한다|이 단원|먼저 잡|안 된다|같지 않다|필요하다|설명할 수|설명한다|제시|그 (동|서|남|북)쪽|보다 (낮|높|많|적|크|작)|더 (많|적|크|작)|\d+(\.\d+)?%|떠올릴 수|국명/;
// Hand review (audit 2026-10-22): a key that no other clue names can still fit a pool country in
// reality. Such sentences are dropped with the rival named; a clear sentence whose token key is
// weak gets the phrase from the sentence that settles it. Lecture sentences are never reworded.
const CLUE_REVIEW = [
  ['오스트레일리아', '남회귀선 부근', null, '보츠와나·아르헨티나에도 남회귀선이 지나고 내륙이 건조함'],
  ['페루', '건조한 태평양 해안', null, '에콰도르도 태평양 해안·안데스산맥·아마존 유역을 가짐'],
  ['이집트', '나일강의 물을 이용한', null, '세 나라 비교에서 나온 상대적 서술이고 에티오피아도 나일강 유역·큰 인구'],
  ['이집트', '이 나라의 국토 대부분은 건조', ['하구 삼각주']],
  ['잠비아', '남부 아프리카의 내륙국으로 구리', null, '콩고 민주 공화국도 구리 주산지'],
  ['프랑스', '이 나라의 높은 원자력', null, '스웨덴 등도 원자력 비중이 높고 위치 단서가 없음'],
  ['보츠와나', '작은 인구와', null, '세 나라 비교에서 나온 상대적 서술(작은 인구)'],
  ['보츠와나', '남부 아프리카의 내륙국이며', ['남부 아프리카의 내륙국', '다이아몬드']],
  ['아이슬란드', '북대서양의 판이', ['판이 벌어지는 곳', '간헐천']],
  ['스리랑카', '이 나라의 신할리즈족', ['신할리즈족']],
  ['러시아', '북극해·카스피해', ['카스피해', '쿠릴 열도']],
  ['사우디아라비아', '아라비아반도의 넓은', ['아라비아반도의 넓은 면적']],
  ['아르헨티나', '이 나라의 팜파스', ['팜파스']],
];
const reviewOf = (n, text) => CLUE_REVIEW.find(([c, start]) => c === n && text.slice(n.length).replace(/^(은|는|의|이|가)\s/, '').startsWith(start.replace(/^이 나라의 /, '')));
const BROAD = new Set(['아시아', '유럽', '아프리카', '북아메리카', '남아메리카', '오세아니아', '남극', '태평양', '대서양', '인도양', '북극해', '지중해',
  '적도', '북극권', '대륙', '비교', '제도', '고도', '분쟁', '유목', '열도', '산맥', '하구', '삼각주', '유적', '반도', '고원', '해안', '사막', '분지',
  '크리스트교', '이슬람교', '불교', '힌두교', '고기']);
const clueTokens = new Set();
const addToken = t => { t = t.replace(/\(.*\)/, '').trim(); if (t.length >= 2 && !BROAD.has(t) && !countryNames.includes(t)) clueTokens.add(t); };
for (const n of placeNames) [n, ...n.split(/[·\s]/)].forEach(addToken);
for (const f of fs.readdirSync(path.join(ROOT, 'data/concepts'))) Object.keys(read('data/concepts/' + f).entities).forEach(addToken);
// A token counts only as a whole word: '루르' is not in '루르드'.
const PARTICLE = '(?:은|는|이|가|을|를|과|와|의|에|에서|에는|으로|로|도|만|이다|이고|이며|·|,|\\s|\\.|$)';
const tokensIn = s => [...clueTokens].filter(t => new RegExp('(^|[^가-힣])' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + PARTICLE).test(s));
const clueSentences = [];
for (const [n, passages] of Object.entries(clueData.countries)) {
  if (!entities[n] || entities[n].type !== 'country') continue;
  for (const p of passages) {
    if (!p.eligibleIdentification) continue;
    for (const s of p.text.split(/(?<=다\.)\s+/).map(x => x.trim())) {
      const m = s.match(new RegExp('^' + n + '(은|는|의|이|가)\\s'));
      if (!m || s.indexOf(n, n.length) >= 0 || countryNames.some(o => o !== n && s.includes(o))) continue;
      // A part of the name would give it away: '콩고강' (콩고 민주 공화국), '말레이반도' (말레이시아),
      // '아라비아반도' (사우디아라비아). Any three letters in a row of the name count as a part.
      const words = n.split(' ').filter(w => w.length >= 2 && !['공화국', '민주', '연방'].includes(w));
      const parts = words.flatMap(w => (w.length <= 3 ? [w] : Array.from({length: w.length - 2}, (_, i) => w.slice(i, i + 3))));
      if (parts.some(w => s.slice(n.length).includes(w))) continue;
      if (NOT_A_CLUE.test(s) || s.length > 130 || s.length < 15 || clueSentences.some(c => c.text === s)) continue;
      clueSentences.push({country: n, text: s, particle: m[1], tokens: tokensIn(s.slice(n.length)), source: p.source.locator.split(' / ')[0]});
    }
  }
}
const tokenOwners = {};
for (const c of clueSentences) for (const t of c.tokens) (tokenOwners[t] = tokenOwners[t] || new Set()).add(c.country);
const clueDropped = [];
for (const c of clueSentences) {
  const review = reviewOf(c.country, c.text);
  if (review && !review[2]) { clueDropped.push({country: c.country, text: c.text, reason: review[3]}); continue; }
  // A key inside a longer key ('쿠릴' in '쿠릴 열도') adds nothing.
  let own = c.tokens.filter(t => tokenOwners[t].size === 1);
  own = own.filter(t => !own.some(o => o !== t && o.includes(t)));
  if (review) {
    if (!review[2].every(k => c.text.includes(k))) throw new Error('clue review key not in the sentence: ' + c.country);
    own = review[2];
  }
  if (!own.length) continue;
  // On the paper the country is not named: '세네갈은 …' → '…', '이집트의 …' → '이 나라의 …'.
  const rest = c.text.slice(c.country.length + c.particle.length + 1);
  (entities[c.country].clues = entities[c.country].clues || []).push({text: c.text, shown: c.particle === '의' ? '이 나라의 ' + rest : rest, keys: own, source: c.source});
}

// Primary energy shares by year; a year counts only when every source is reported.
const energy = read('data/energy-series.json');
const ENERGY = read('data/exam-relations-energy.json');
const ENERGY_YEAR = '2023';
const ENERGY_PARTS = {coal: ['coal'], oil: ['oil'], gas: ['gas'], nuclear: ['nuclear'], hydro: ['hydro'], renewables: ['wind', 'solar', 'biofuel', 'other_renewables']};
const energyShares = {};
for (const [n, c] of Object.entries(energy.countries)) {
  const years = Object.keys(c.series.coal_share_energy || {});
  for (const y of years) {
    const v = {};
    for (const [cat, parts] of Object.entries(ENERGY_PARTS)) {
      const xs = parts.map(k => (c.series[k + '_share_energy'] || {})[y]);
      if (xs.some(x => x == null)) { v.missing = true; break; }
      v[cat] = Math.round(xs.reduce((a, b) => a + b, 0) * 10) / 10;
    }
    if (!v.missing) (energyShares[n] = energyShares[n] || {})[y] = v;
  }
}
// Country energy comparisons of the R2 whitelist (data/exam-relations-energy.json relations), on
// the same OWID series and the usual window. 'energy-total' is also the 1차 에너지 table's total,
// so 중국 > 인도 there tells the two coal-led countries apart. Domain 'energy': recalled only in
// themes that list it. hydro_share_energy is the table's own 수력 column, so it is not registered.
const ENERGY_IND = {
  primary_energy_consumption: ['energy-total', '1차 에너지 소비량', 'TWh', '1차 에너지 소비량이 많다'],
  energy_per_capita: ['energy-pc', '1인당 1차 에너지 소비량', 'kWh', '1인당 1차 에너지 소비량이 많다'],
  gas_consumption: ['energy-gas', '천연가스 소비량', 'TWh', '천연가스 소비량이 많다'],
};
for (const [key, [id, label, unit, more]] of Object.entries(ENERGY_IND)) {
  indicators[id] = {label, unit, more, entityType: 'country', year: ENERGY_YEAR, source: 'Energy Institute·EIA (OWID 에너지 자료)',
    compare: {type: 'ratio', min: 1.3}, static: false, domain: 'energy', disabled: false, unstablePairs: []};
  seriesOf[id] = {};
  for (const [n, c] of Object.entries(energy.countries)) {
    if (!entities[n] || entities[n].type !== 'country' || !c.series[key]) continue;
    seriesOf[id][n] = c.series[key];
    if (c.series[key][ENERGY_YEAR] != null) entities[n].values[id] = c.series[key][ENERGY_YEAR];
  }
}
// 광물 생산 비중 (R2: data/mineral-production-shares.json, BGS). A share is of the reported country
// total of the same year and unit; a missing country is not 0. The row BGS labels Congo (1-17-19941)
// is the Republic of the Congo, not the DR Congo, and is left out. Domain 'mineral'.
const MINERALS = read('data/mineral-production-shares.json').minerals, MIN_REL = read('data/exam-relations-minerals.json');
const MIN_IND = {'min-copper': ['구리', '세계 구리 생산량 중 비중', '세계 구리 생산 비중이 높다'], 'min-iron': ['철광석', '세계 철광석 생산량 중 비중', '세계 철광석 생산 비중이 높다']};
const MIN_YEAR = '2024';
for (const [id, [mineral, label, more]] of Object.entries(MIN_IND)) {
  indicators[id] = {label, unit: '%', more, entityType: 'country', year: MIN_YEAR, source: 'BGS World Mineral Statistics(보고된 국가 합계 대비)',
    compare: {type: 'ratio', min: 1.3}, static: false, domain: 'mineral', disabled: false, unstablePairs: []};
  seriesOf[id] = {};
  for (const row of MINERALS[mineral]) for (const c of row.countries) {
    if (c.sourceRowId.startsWith('1-17-19941') || !entities[c.name] || entities[c.name].type !== 'country') continue;
    const ser = seriesOf[id][c.name] = seriesOf[id][c.name] || {};
    ser[row.year] = (ser[row.year] || 0) + c.shareOfReportedTotalPct;
  }
  for (const [n, ser] of Object.entries(seriesOf[id])) if (ser[MIN_YEAR] != null) entities[n].values[id] = Math.round(ser[MIN_YEAR] * 100) / 100;
}
for (const r of MIN_REL.relations) {
  for (const [hi, lo] of r.pairs || []) relations.push(Object.assign(checkPair(r.indicator, hi, lo, true), {form: 'pairs', basis: r.basis}));
  (r.tiers || []).forEach((tier, i) => r.tiers.slice(i + 1).flat().forEach(lo => tier.forEach(hi => relations.push(Object.assign(checkPair(r.indicator, hi, lo, true), {form: 'tiers', basis: r.basis})))));
}
// 미국 주별 제조업 (round two: data/us-state-manufacturing-series.json, Census ASM 2014~2016·
// 2018~2021 and Economic Census 2017·2022; round three: AIES 2023·2024, checked but not shown). States are 대상 of their own type, valued by their
// share of the state's manufacturing shipments (출하액, not value added). A column adding
// several NAICS codes is filled only in years where every code is published; a code the Census
// withholds (D) is missing, never 0. 336 운송 장비 is never added to its own parts (3361~3364).
// 자동차·부품 uses 3363 alone: California's and Washington's 3361 is withheld in most years.
// Domain 'usMfg': only the manufacturing theme recalls these.
const USM = read('data/us-state-manufacturing-series.json'), USM_REL = read('data/exam-relations-us-manufacturing.json');
const USM_YEAR = USM_REL.displayYear, USM_SRC = 'U.S. Census Bureau 경제 센서스(출하액)';
const AIES = read('data/us-state-manufacturing-aies-2023-2024.json');
const US_IND = {
  'us-computer': [['334'], '컴퓨터·전자 제품', '컴퓨터·전자 제품이 차지하는 비중이 높다'],
  'us-petchem': [['324', '325'], '석유·석탄 제품과 화학 제품', '석유·석탄 제품과 화학 제품이 차지하는 비중이 높다'],
  'us-machTrans': [['333', '336'], '기계·운송 장비', '기계·운송 장비가 차지하는 비중이 높다'],
  'us-metal': [['331', '332'], '1차 금속·금속 가공 제품', '1차 금속·금속 가공 제품이 차지하는 비중이 높다'],
  'us-aero': [['3364'], '항공 우주 제품·부품', '항공 우주 제품·부품이 차지하는 비중이 높다'],
  'us-parts': [['3363'], '자동차 부품', '자동차 부품이 차지하는 비중이 높다'],
};
const usShares = {};
for (const row of USM.rows.concat(AIES.rows)) {
  const n = USM.states[row.stateFips].name, s = ((usShares[n] = usShares[n] || {})[row.year] = usShares[n][row.year] || {});
  s[row.naics] = row.naics === '31-33' ? (row.shipmentsThousandUSD == null ? null : row.shipmentsThousandUSD / 1e5) : row.shareOfStateShipmentsPct;
}
const stateShapes = read('data/us-state-boundaries.geojson').features;
for (const st of Object.values(USM.states)) {
  const f = stateShapes.find(x => x.properties.name_en === st.sourceName);
  const polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
  const main = polys.reduce((best, p) => (ringArea(p[0]) > ringArea(best[0]) ? p : best));
  entities[st.name] = {type: 'usState', name: st.name, facts: {}, values: {}, ...labelPoint(main)};
}
const usmYears = () => { const out = []; for (let y = +USM_REL.years[0]; y <= +USM_REL.years[1]; y++) out.push(String(y)); return out; };
for (const [id, [codes, label, more]] of Object.entries(US_IND).concat([['us-total', [['31-33'], '제조업 총출하액', '제조업 총출하액이 많다']]])) {
  const total = id === 'us-total';
  indicators[id] = {label: total ? label : label + ' 비중', unit: total ? '억 달러' : '%', more: total ? more : '제조업 출하액 중 ' + more,
    entityType: 'usState', year: USM_YEAR, source: USM_SRC, compare: {type: 'ratio', min: 1.3}, static: false,
    window: [USM_REL.years[0], USM_REL.years[1], USM_REL.minYears], domain: 'usMfg', disabled: false, unstablePairs: []};
  if (!total) indicators[id].decimals = 1;
  seriesOf[id] = {};
  for (const [n, byYear] of Object.entries(usShares)) {
    const ser = seriesOf[id][n] = {};
    for (const y of usmYears()) {
      const v = (byYear[y] || {}), parts = codes.map(c => v[c]);
      if (parts.every(x => x != null)) ser[y] = parts.reduce((a, b) => a + b, 0);
    }
    if (ser[USM_YEAR] != null) entities[n].values[id] = total ? Math.round(ser[USM_YEAR]) : Math.round(ser[USM_YEAR] * 10) / 10;
  }
}
for (const r of USM_REL.relations) for (const [hi, lo] of r.pairs) relations.push(Object.assign(checkPair(r.indicator, hi, lo, true), {form: 'pairs', basis: r.basis}));
// 선벨트·러스트 벨트 and the coast each state lies on: lecture facts, one value per state, so a
// false claim uses the value of another state in the question (states have no region to draw from).
const US_FACT_SETS = {};
for (const [set, s] of Object.entries(USM_REL.facts)) {
  US_FACT_SETS[set] = {title: s.title, multi: false, negationSafe: false, exclusive: true, falseFromOthers: true, template: s.template,
    options: Object.fromEntries(s.options.map(o => [o, o])), source: s.source};
  for (const [n, values] of Object.entries(s.values)) entities[n].facts[set] = {values: values.slice(), note: '', source: s.source};
}
// Lecture cities in each state (round three: data/concepts/us-city-states.json, the eight named
// places matched to Census places). One state can hold several; 오하이오 holds none of them.
const usCities = read('data/concepts/us-city-states.json');
US_FACT_SETS.usCity = {title: '주에 있는 강의 속 도시', multi: true, negationSafe: false, exclusive: true, falseFromOthers: true, template: '{value}이/가 위치한 주이다',
  options: {}, source: '강의 2권 P08 · ' + usCities.sets.state.source};
// The eight places are a complete scope, so a state holding none of them (오하이오) says so: its
// false '디트로이트가 위치한 주이다' is the trap L2-B0701 warns about.
for (const e of Object.values(entities)) if (e.type === 'usState') e.facts.usCity = {values: [], note: '', source: '강의 2권 P08 · ' + usCities.sets.state.source};
for (const [city, [state]] of Object.entries(usCities.sets.state.values)) {
  if (!entities[state] || entities[state].type !== 'usState') continue;
  US_FACT_SETS.usCity.options[city] = city;
  const f = entities[state].facts.usCity;
  if (!f.values.length) f.source = '강의 2권 P08 / ' + usCities.entities[city].source.blockId;
  f.values.push(city);
  if (!f.source.includes(usCities.entities[city].source.blockId)) f.source += '·' + usCities.entities[city].source.blockId;
}
// L2-B0368 gives the 2018 totals as 중국, 미국, 인도 in that order, so 중국 > 인도 is the lecture's too.
// The whitelist's 미국 pairs (총량 중국 > 미국 > 인도, 1인당·천연가스 미국 > 중국) wait for a theme where
// 미국 can be identified next to 중국: it has no verified electricity or primary-energy order.
for (const r of [{indicator: 'primary_energy_consumption', pairs: [['중국', '인도']], basis: '강의 2권 P07 / L2-B0368 (2018년 1차 에너지 소비 총량은 중국, 미국, 인도 순)'}]) {
  for (const [hi, lo] of r.pairs) relations.push(Object.assign(checkPair(ENERGY_IND[r.indicator][0], hi, lo, true), {form: 'pairs', basis: r.basis}));
}

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
  // 1차 에너지 소비 구성 (R2, data/energy-series.json: OWID, substitution method). The margin is
  // 5%p: the smallest gaps 2015~2024 are 중국 석탄 over 석유·신재생 7.8%p and 브라질 석유 over 수력 8.3%p.
  primaryEnergy: {year: ENERGY_YEAR, source: 'Energy Institute·EIA (OWID 에너지 자료)', unit: '% (1차 에너지 소비 비중)', orderMargin: 5, rankExclude: [],
    categories: [['coal', '석탄'], ['oil', '석유'], ['gas', '천연가스'], ['nuclear', '원자력'], ['hydro', '수력'], ['renewables', '신재생(수력 제외)']],
    values: Object.fromEntries(Object.entries(energyShares).filter(([, s]) => s[ENERGY_YEAR]).map(([n, s]) => [n, s[ENERGY_YEAR]])),
    total: {indicator: 'energy-total', label: '1차 에너지 소비량', unit: 'TWh', year: ENERGY_YEAR, source: 'Energy Institute·EIA (OWID 에너지 자료)',
      note: '1차 에너지 소비량도 2023년(EI·EIA 결합 계열, 비중의 분모와 최대 3% 차이)',
      values: Object.fromEntries(Object.entries(energy.countries).filter(([n, c]) => energyShares[n] && energyShares[n][ENERGY_YEAR] && (c.series.primary_energy_consumption || {})[ENERGY_YEAR] != null)
        .map(([n, c]) => [n, c.series.primary_energy_consumption[ENERGY_YEAR]]))}},
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
  primaryEnergy: energyShares,
};
function checkOrder(cid, name, order) {
  const c = compositions[cid], out = {composition: cid, entity: name, order};
  const no = reason => Object.assign(out, {status: 'excluded', reason});
  const ser = compositionSeries[cid][name];
  if (!ser || !c.values[name]) return no('구성 자료 없음');
  const years = Object.keys(ser).filter(y => cid === 'religion' || (y >= Y0 && y <= Y1)).sort();
  if (cid !== 'religion' && years.length < MIN_YEARS) return no(`${Y0}~${Y1}년 자료 ${years.length}개 연도`);
  const raw = cid === 'religion' && religionRaw.countries[name];
  const rows = years.map(y => [y, ser[y]]).concat(raw ? Object.entries(raw.series).map(([y, v]) => [y + '년 비반올림값', v]) : [], [['표시값', c.values[name]]]);
  const rest = c.categories.map(x => x[0]).filter(k => !order.includes(k) && !c.rankExclude.includes(k));
  let least = [null, Infinity];
  const broken = [], bundled = [];
  for (const [y, v] of rows) {
    const gaps = order.map((k, i) => v[k] - (i + 1 < order.length ? v[order[i + 1]] : Math.max(...rest.map(o => v[o] || 0))));
    const g = Math.min(...gaps);
    if (g <= 0) broken.push(y);
    if (g < least[1]) least = [y, g];
    // The table shows 무종교 and 기타 종교 too: a ranked religion smaller than either would read
    // as contradicting '신자 수 n위'.
    if (c.rankExclude.some(k => v[k] >= v[order[order.length - 1]])) bundled.push(y);
  }
  Object.assign(out, {years: [years[0], years[years.length - 1]], n: years.length, minGap: Math.round(least[1] * 10) / 10});
  if (broken.length) return Object.assign(out, {status: 'reversed', reason: `순서가 성립하지 않는 해: ${broken.join('·')}`});
  if (bundled.length) return Object.assign(out, {status: 'belowMargin', reason: `${c.categories.find(x => x[0] === order[order.length - 1])[1]}보다 ${c.rankExclude.map(k => c.categories.find(x => x[0] === k)[1]).join('·')} 중 하나가 큰 해: ${bundled.map(y => /^\d+$/.test(y) ? y + '년' : y).join('·')}`});
  if (least[1] < c.orderMargin) return Object.assign(out, {status: 'belowMargin', reason: `순서는 확인한 모든 해에 같음. 최소 간격 ${Math.round(least[1] * 10) / 10}%p(${/^\d+$/.test(least[0]) ? least[0] + '년' : least[0]}) < 출제 기준 ${c.orderMargin}%p`});
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
// The energy whitelist (R2) names each country's leading sources in primary energy.
// L2-B0373 says only that 중국·인도 lead with 석탄; the 석유 second place in the whitelist is not stated
// (its own validatedIndicatorOrders scope says so), so only the first place is recalled.
const ORDER_STATED = {중국: ['coal'], 인도: ['coal']};
for (const o of ENERGY.orders) for (const [n, order] of Object.entries(o.orders)) orders.push(Object.assign(checkOrder(o.composition, n, ORDER_STATED[n] || order), {basis: o.basis}));

// Facts about the categories themselves (religions), asked once a hidden column A~C is identified.
// The world adherent order must also hold in the Pew world rows (2010, 2020) by the order margin.
const WORLD = {religion: religionRaw.world};
const categoryFacts = {};
for (const f of REL.categoryFacts || []) {
  const g = Object.assign({}, f);
  if (f.id === 'world') {
    const ser = WORLD[f.composition].series, gaps = [];
    for (const [y, v] of Object.entries(ser)) f.order.slice(1).forEach((k, i) => gaps.push([y, v[f.order[i]] - v[k]]));
    const least = gaps.reduce((a, b) => (b[1] < a[1] ? b : a));
    Object.assign(g, {years: Object.keys(ser), minGap: Math.round(least[1] * 10) / 10, values: Object.fromEntries(Object.entries(ser).map(([y, v]) => [y, Object.fromEntries(f.order.map(k => [k, Math.round(v[k] * 10) / 10]))])),
      status: least[1] <= 0 ? 'reversed' : least[1] < compositions[f.composition].orderMargin ? 'belowMargin' : 'active', source: religionRaw.source + ' 세계 전체'});
  } else g.status = 'active';
  (categoryFacts[f.composition] = categoryFacts[f.composition] || []).push(g);
}
// Lecture statements about each religion (data/religion-type-claims.json, round two): true for the
// religions listed, false only for those the lecture contrasts. Claims that are only ever true or
// only ever false would be tells and stay out.
// Lecture notes worded as '…를 연결한다' read as broken exam sentences after '(가)는'/'A는'; these are
// the same statements in exam wording (audit 2026-10-23). Scope and truth are unchanged.
const CLAIM_STYLE = {
  'climate-10': '짧은 풀 중심의 초원이 나타나고 흑토가 발달한다.', 'climate-16': '경엽수림이 나타나고 올리브·포도 등의 수목 농업이 활발하다.',
  'climate-18': '타이가(침엽수림)가 대표적인 식생이다.', 'climate-24': '해발 고도가 높아 같은 위도의 저지대보다 기온이 낮다.',
  'religion-07': '라마단 기간의 금식과 메카 순례가 대표적인 의례이다.', 'religion-08': '성탄절과 부활절이 대표적인 축제이다.',
  'religion-09': '디왈리와 홀리가 대표적인 축제이다.', 'religion-10': '불상과 불탑이 대표적인 종교 경관이다.',
  'religion-11': '미나레트(첨탑)가 대표적인 종교 경관이다.', 'religion-12': '룸비니와 부다가야가 대표적인 성지이다.',
  'religion-13': '갠지스강에서의 목욕 의례가 대표적이다.', 'religion-16': '코셔 식품 규범을 따른다.',
};
const RELIGION_ID = Object.fromEntries(compositions.religion.categories.map(([id, label]) => [label, id]));
for (const c of read('data/religion-type-claims.json').claims) {
  if (!c.trueFor.length || !c.falseFor.length) continue;
  categoryFacts.religion.push({composition: 'religion', id: c.id, kind: 'claim', claim: CLAIM_STYLE[c.id] || c.claim, status: 'active', label: (CLAIM_STYLE[c.id] || c.claim).replace(/\.$/, ''),
    trueFor: c.trueFor.map(n => RELIGION_ID[n]), falseFor: c.falseFor.map(n => RELIGION_ID[n]),
    basis: '강의 ' + c.source.volume + '권 ' + c.source.section + ' ' + c.source.blockId + ' (' + c.source.column + ')'});
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
// 고산 기후 (H): the lecture decides it by elevation, not by monthly data, so the data only has to
// show the lecture's trace of it: 저위도인데도 연중 서늘하고(최한월 18℃ 미만) 연교차가 작다. With the
// 1℃ margin: 'yes' needs a tropical latitude, coldest month ≤ 17℃, range ≤ 4℃ and (where the
// station height is known) 1,500m or more; 'no' is coldest ≥ 19℃, range ≥ 6℃, outside the tropics
// or below 1,000m. Every other site must read 'no', so no graph could be mistaken for H.
function highland(T, lat, elevation) {
  const cold = Math.min(...T), range = Math.max(...T) - cold, tropics = Math.abs(lat) < 23.44;
  if (tropics && cold <= 17 && range <= 4 && (elevation == null || elevation >= 1500)) return 'yes';
  if (!tropics || cold >= 19 || range >= 6 || (elevation != null && elevation < 1000)) return 'no';
  return 'unclear';
}
// Additions in data/climate-normals-extension.json (R4) join only with complete 1991~2020 monthly
// data near the map point. A name already used by a country gets the station in brackets.
const climateExt = read('data/climate-normals-extension.json');
const CLIMATE_ALIAS = {싱가포르: '싱가포르(창이)'}, CLIMATE_REGION = {싱가포르: 'asia'};
const climateSites = climate.sites.slice();
for (const s of climateExt.sites) {
  const base = climate.sites.find(b => b.name === s.name);
  const full = s.usage.climateGraph && s.status === 'complete' && String(s.normalPeriod) === '1991,2020' && s.mapPoint && s.station && s.station.latitude != null &&
    s.station.distanceFromMapPointKm < 35 && CLIMATE_LABEL[s.lectureClimate] && s.sourceBlockId &&
    [s.temperatureC, s.precipitationMm].every(a => a.length === 12 && a.every(v => v != null));
  if (!full) {
    const why = s.issues && s.issues.length ? s.issues.join(' ') : '1991~2020년 월별 기온·강수가 모두 있지 않음';
    if (!base) climateTypes.push({entity: s.name, lecture: s.lectureClimate, status: 'excluded', reason: '그래프에 쓸 자료 부족 — ' + why, basis: CLIMATE_BASIS});
    else Object.assign(base, {extensionNote: why});
    continue;
  }
  if (base && base.usage.climateGraph) throw new Error('climate extension would replace a base station: ' + s.name);
  const P = s.precipitationMm;
  climateSites.push(Object.assign({}, s, {name: CLIMATE_ALIAS[s.name] || s.name, region: s.region || CLIMATE_REGION[s.name], sourceId: 'ext:' + s.sourceFile,
    basis: '강의 1권 P02 (' + s.sourceBlockId + ')', derived: {jjaPrecipitationSharePct: Math.round((P[5] + P[6] + P[7]) / P.reduce((a, b) => a + b, 0) * 1000) / 10}}));
}
// Round two (data/climate-normals-round2.json): complete JMA 1991~2020 normals of one station each.
// The record has no coordinates, so the map point comes from the location items and the latitude
// from the same WMO station's NOAA record (다르에스살람) or the city point (이키토스, 3.8°S, no
// season or hemisphere test depends on it). The lecture types are 1권 P02's: 이키토스 the humid
// Amazon lowland (L1-B0441), 다르에스살람 the southern savanna with a dry July (L1-B0494). Both
// must still be confirmed by the data, like every site.
const CLIMATE_R2 = read('data/climate-normals-round2.json');
const R2_TYPE = {이키토스: ['af', 'L1-B0441'], 다르에스살람: ['aw', 'L1-B0494']};
const locPoint = n => { const it = read('data/extension-sources/location-items.json').find(x => x.name === n && x.geometry && x.geometry.type === 'point'); return it && [it.geometry.lon, it.geometry.lat]; };
for (const [n, st] of Object.entries(CLIMATE_R2.stations)) {
  if (!st.climateGraph || String(st.period) !== '1991,2020' || !R2_TYPE[n]) continue;
  const point = locPoint(n), noaa = Object.values(CLIMATE_R2.partialCandidates).find(c => c.wmoId === st.wmoId && c.coordinates);
  if (!point || [st.monthlyMeanTemperatureC, st.monthlyPrecipitationMm].some(a => a.length !== 12 || a.some(v => v == null))) continue;
  const i = climateSites.findIndex(b => b.name === n);
  if (i >= 0 && climateSites[i].usage.climateGraph) throw new Error('round-two station would replace a graph site: ' + n);
  const P = st.monthlyPrecipitationMm;
  const site = {name: n, mapPoint: point, region: n === '이키토스' ? 'americas' : 'africa', lectureClimate: R2_TYPE[n][0], normalPeriod: st.period, status: 'complete',
    usage: {climateGraph: true}, sourceId: 'jma-' + st.wmoId, basis: '강의 1권 P02 (' + R2_TYPE[n][1] + ')',
    station: {name: 'JMA ' + st.wmoId, latitude: noaa ? noaa.coordinates[1] : point[1], elevationM: noaa ? noaa.elevationM : null},
    temperatureC: st.monthlyMeanTemperatureC, precipitationMm: P, derived: {jjaPrecipitationSharePct: Math.round((P[5] + P[6] + P[7]) / P.reduce((a, b) => a + b, 0) * 1000) / 10}};
  if (i >= 0) climateSites[i] = site; else climateSites.push(site);
  // The partial record this station replaces no longer stands as an exclusion.
  for (let j = climateTypes.length - 1; j >= 0; j--) if (climateTypes[j].entity === n && climateTypes[j].status === 'excluded') climateTypes.splice(j, 1);
}
// The same WMO station's elevation (아디스아바바 63450, JMA 2,354m).
for (const [n, m] of Object.entries(CLIMATE_R2.metadata)) {
  const b = climateSites.find(x => x.name === n);
  if (b && b.sourceId === 'jma-' + m.wmoId && b.station.elevationM == null) b.station = Object.assign({}, b.station, {elevationM: m.elevationM});
}
for (const s of climateSites) {
  if (!s.usage.climateGraph) {
    climateTypes.push({entity: s.name, lecture: s.lectureClimate, status: 'excluded', reason: '그래프에 쓸 기온·강수 자료가 없음(' + s.status + ')' + (s.extensionNote ? ' — 추가 자료: ' + s.extensionNote : ''), basis: CLIMATE_BASIS});
    continue;
  }
  if (entities[s.name]) throw new Error('climate site name collides with an entity: ' + s.name);
  const T = s.temperatureC, P = s.precipitationMm, lat = s.station.latitude, k = koppen(T, P, lat);
  const coldest = T.indexOf(Math.min(...T)) + 1, range = Math.max(...T) - Math.min(...T);
  // Hemisphere seen in the data: coldest month in 12~2월 (north) or 6~8월 (south), range ≥ 5℃.
  const signal = range >= 5 ? ([12, 1, 2].includes(coldest) ? 'N' : [6, 7, 8].includes(coldest) ? 'S' : null) : null;
  const hemisphere = lat >= 0 ? 'N' : 'S', L = s.lectureClimate, h = highland(T, lat, s.station.elevationM);
  if (signal && signal !== hemisphere) throw new Error(s.name + ': seasons disagree with the station latitude');
  let status, reason;
  if (L === 'h') {
    if (h === 'yes') { status = 'active'; reason = ''; }
    else { status = 'belowMargin'; reason = '고산 기후의 흔적(저위도·최한월 17℃ 이하·연교차 4℃ 이하)이 관측값에서 뚜렷하지 않음'; }
  } else if (h !== 'no') { status = 'belowMargin'; reason = '관측값이 고산 기후와 구별되지 않음(저위도·서늘함·작은 연교차)'; }
  else if (k.code.slice(0, L.length) !== L) { status = 'conflict'; reason = `관측소 평년값으로는 ${koppenCode(k.code)}(강의 ${koppenCode(L)}). 경계 지점이므로 기후형을 식별 근거로 쓰지 않음`; }
  else if (k.robust < L.length) { status = 'belowMargin'; reason = `같은 ${koppenCode(L)}이지만 경계 기준과의 차이가 작음(기준 ${CLIMATE_MARGIN['℃']}℃·${CLIMATE_MARGIN.mm}mm·${CLIMATE_MARGIN['%']}%)`; }
  else { status = 'active'; reason = ''; }
  climateTypes.push({entity: s.name, lecture: L, computed: k.code, status, reason, basis: s.basis || CLIMATE_BASIS});
  entities[s.name] = {type: 'site', name: s.name, region: s.region, label: s.mapPoint, facts: {}, values: {},
    climate: {temperature: T, precipitation: P, lat, hemisphere, elevation: s.station.elevationM, lecture: L, computed: k.code, robust: k.robust,
      type: status === 'active' ? L : null, signal, coldest, range: Math.round(range * 10) / 10, h,
      annual: Math.round(P.reduce((a, b) => a + b, 0)), summerShare: s.derived.jjaPrecipitationSharePct,
      station: s.station.name, sourceId: s.sourceId}};
}

// --- 세계 도시 (round two and three: data/exam-world-cities.json, 강의 1권 P05) ---
// Cities are place 대상 like the climate sites ('런던'·'파리'·'로스앤젤레스' are both), with lecture
// clues (name-free sentences first), two exclusive fact sets with a source per city, and pair
// statements the lecture states (도시 역사, EU 탈퇴, 뉴욕 > 토론토). Tier ranks are never recalled.
const WC = read('data/exam-world-cities.json'), CITY_SETS = {};
const cityPlaces = Object.assign({}, read('data/concepts/cities.json').entities, {토론토: {place: read('data/toronto-clues-round3.json').place}});
for (const [n, c] of Object.entries(WC.cities)) {
  const e = entities[n] || (entities[n] = {type: 'site', name: n, region: c.region, label: cityPlaces[n].place, facts: {}, values: {}});
  if (e.type !== 'site') throw new Error('city name taken by a ' + e.type + ': ' + n);
  e.clues = c.clues.map(k => ({text: k.text, shown: k.shown || k.text, keys: [k.text], source: k.source}));
}
for (const [set, s] of Object.entries(WC.facts)) {
  CITY_SETS[set] = {title: s.title, multi: false, negationSafe: false, exclusive: true, falseFromOthers: true, template: '{value}', options: s.options};
  for (const [n, v] of Object.entries(s.values)) entities[n].facts[set] = {values: [v.value], note: v.note, source: v.source};
}
WC.statements.forEach((st, i) => concepts.push({id: 'city-' + (i + 1), about: st.about, claim: st.claim, truth: st.truth, source: st.source}));
// The lecture's traps on the 2022학년도 수능 3번 export items (data/exam-export-items-claims.json).
read('data/exam-export-items-claims.json').statements.forEach((st, i) => concepts.push({id: 'export-' + (i + 1), about: st.about, claim: st.claim, truth: st.truth, source: st.source}));

const CLAIM_SKIP = {'climate-18': ['선양', '창춘', '블라디보스토크', '몬트리올', '모스크바'], 'climate-24': ['보스토크(남극)'], 'climate-14': ['케이프타운', '샌프란시스코']};
const out = {
  generated: 'scripts/build-entity-kb.cjs',
  sources: {countries: stats.meta, economy: economy.meta, groups: groupSeries.meta, extraFacts: extra.about, rankingsCheckedAt: R.checkedAt || null},
  check: REL.check,
  factSets: Object.assign(Object.fromEntries(FACT_SETS.filter(id => C.byId[id]).map(id => [id, {
    title: C.byId[id].title, multi: !!C.byId[id].multi, negationSafe: NEGATION_SAFE[id] === 'all', exclusive: EXCLUSIVE.includes(id),
    // Country values come from the classification map's data, not a lecture sentence per country.
    source: '강의 ' + C.byId[id].lecture + ' 분류 기준' + (C.byId[id].period ? ' · ' + C.byId[id].period : ''),
    options: Object.fromEntries(C.optionsFor(C.byId[id]).map(o => [o.id, o.label])),
  }])), agriFactSets, OPEC_SETS, US_FACT_SETS, CITY_SETS),
  extraFacts: Object.fromEntries(Object.entries(extra.facts).map(([k, f]) => [k, {label: f.label, complete: f.complete, source: f.source}])),
  indicators, entities, compositions, relations, signs, orders, categoryFacts, concepts, outOfScope, cluesDropped: clueDropped,
  climate: {period: climate.normalPeriod, source: '관측소 월평년값(WMO 제출 자료 우선, JMA·ECCC 보충)', margin: CLIMATE_MARGIN, types: CLIMATE_LABEL, verdicts: climateTypes,
    // Lecture statements about each climate type (data/climate-type-claims.json, round two). Only
    // those with types they are false for: a statement true wherever it appears would be a tell.
    // Stations a type-level sentence does not fit (audit 2026-10-23): 타이가 for warm-summer Dw/Df
    // stations of mixed or broadleaf forest; 해발 고도 as the main cause of cold for 보스토크, where
    // latitude is; '연중 편서풍' as false for Csb stations, whose cool summer the graph shows.
    claims: read('data/climate-type-claims.json').claims.filter(c => c.falseFor.length).map(c => ({id: c.id, claim: CLAIM_STYLE[c.id] || c.claim, skip: CLAIM_SKIP[c.id] || [],
      trueFor: c.trueFor.map(t => t.toLowerCase()), falseFor: c.falseFor.map(t => t.toLowerCase()),
      source: '강의 ' + c.source.volume + '권 ' + c.source.section + ' ' + c.source.blockId + (c.source.column ? ' (' + c.source.column.split(';')[0] + ')' : '')}))},
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
    if (st.kind === 'category') hit('c|' + q.theme.composition + '|' + st.check.trait);
  }
}
for (const x of relations) if (x.status === 'active') x.practice = uses[pairKey(x.indicator, x.hi, x.lo)] || 0;
for (const x of signs) if (x.status === 'active') x.practice = uses['s|' + x.indicator + '|' + x.entity] || 0;
for (const x of orders) if (x.status === 'active') x.practice = uses['o|' + x.composition + '|' + x.entity] || 0;
for (const x of climateTypes) if (x.status === 'active') x.practice = uses['k|' + x.entity] || 0;
for (const [cid, list] of Object.entries(categoryFacts)) for (const x of list) if (x.status === 'active') x.practice = uses['c|' + cid + '|' + x.id] || 0;
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
