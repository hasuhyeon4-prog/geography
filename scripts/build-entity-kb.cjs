/* Build assets/entity-kb.js: one knowledge card per country, economic bloc, and continent.
 *
 * Usage: node scripts/build-entity-kb.cjs
 * Inputs (all committed): assets/country-boundaries.js, assets/classification-sets.js,
 * assets/rankings.js, data/country-indicators.json, data/entity-facts.json.
 * The 기출형 engine (assets/exam-engine.js) reads only this file and assets/exam-themes.js.
 *
 * Nothing here is inferred: categorical facts copy graded entries of the classification
 * sets (mixed or reference entries stay out), numbers copy the statistics files with their
 * year and source, and hemispheres come from the largest polygon of each country.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const shapes = require(path.join(ROOT, 'assets/country-boundaries.js'));
const C = require(path.join(ROOT, 'assets/classification-sets.js'));
const R = require(path.join(ROOT, 'assets/rankings.js'));
const stats = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/country-indicators.json'), 'utf8'));
const extra = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/entity-facts.json'), 'utf8'));
const electricity = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/electricity-mix.json'), 'utf8'));
const religion = JSON.parse(fs.readFileSync(path.join(ROOT, 'audit/religion-2020.json'), 'utf8'));

// Comparison statements need a gap that survives other years and editions.
const COUNTRY_INDICATORS = {
  pop: {label: '총인구', unit: '만 명', more: '총인구가 많다', compare: {type: 'ratio', min: 1.5}},
  urban: {label: '도시화율', unit: '%', more: '도시화율이 높다', compare: {type: 'diff', min: 15}},
  old: {label: '노년층(65세 이상) 인구 비율', unit: '%', more: '노년층 인구 비율이 높다', compare: {type: 'diff', min: 6}},
  young: {label: '유소년층(0~14세) 인구 비율', unit: '%', more: '유소년층 인구 비율이 높다', compare: {type: 'diff', min: 8}},
  nir: {label: '인구 자연 증가율', unit: '‰', more: '인구 자연 증가율이 높다', compare: {type: 'diff', min: 8}, sign: {neg: '인구의 자연 감소가 나타난다', min: 4}},
  gdp: {label: 'GDP', unit: '십억 달러', more: 'GDP가 많다', compare: {type: 'ratio', min: 2}},
  gdppc: {label: '1인당 GDP', unit: '천 달러', more: '1인당 GDP가 많다', compare: {type: 'ratio', min: 2}},
  exports: {label: '상품 수출액', unit: '십억 달러', more: '상품 수출액이 많다', compare: {type: 'ratio', min: 2}},
};
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
for (const [id, meta] of Object.entries(COUNTRY_INDICATORS)) {
  indicators[id] = {...meta, entityType: 'country', year: stats.meta.year, source: stats.meta.source, disabled: false, unstablePairs: []};
}
// Bloc and continent indicators reuse the audited ranking tables, including their
// disabled tables and pairs whose order flips between years.
function predicate(phrase) { return phrase.endsWith('큰') ? phrase.slice(0, -1) + '크다' : phrase.replace(/은$/, '다'); }
for (const r of R.rankings) {
  if (!['bloc', 'continent'].includes(r.group)) continue;
  const type = r.group;
  indicators[r.id] = {
    label: r.title, unit: r.unit, more: predicate(r.phrase), entityType: type, year: r.year, source: r.source,
    compare: r.unit === '%' ? {type: 'diff', min: 10} : r.id.endsWith('netmig') ? {type: 'diff', min: 50} : {type: 'ratio', min: 1.3},
    disabled: !!(r.audit && r.audit.quizDisabled), unstablePairs: (r.audit && r.audit.unstablePairs) || [],
  };
  // Sign statements: only the direction is asserted, and only well away from zero.
  if (r.id === 'cont-netmig') indicators[r.id].sign = {pos: '인구의 순유입이 나타난다', neg: '인구의 순유출이 나타난다', min: 30};
  if (r.id === 'cont-nir') indicators[r.id].sign = {neg: '인구의 자연 감소가 나타난다', pos: '인구의 자연 증가가 나타난다', min: 2};
  for (const it of r.items) {
    const e = entities[it.name] || (entities[it.name] = {type, name: it.name, facts: {}, values: {}});
    e.values[r.id] = it.value;
  }
}

const out = {
  generated: 'scripts/build-entity-kb.cjs',
  sources: {countries: stats.meta, extraFacts: extra.about, rankingsCheckedAt: R.checkedAt || null},
  factSets: Object.fromEntries(FACT_SETS.filter(id => C.byId[id]).map(id => [id, {
    title: C.byId[id].title, multi: !!C.byId[id].multi, negationSafe: NEGATION_SAFE[id] === 'all', exclusive: EXCLUSIVE.includes(id),
    options: Object.fromEntries(C.optionsFor(C.byId[id]).map(o => [o.id, o.label])),
  }])),
  extraFacts: Object.fromEntries(Object.entries(extra.facts).map(([k, f]) => [k, {label: f.label, complete: f.complete, source: f.source}])),
  indicators, entities,
  // Compositions used as identification data. Shares are percentages of the stated total.
  compositions: {
    electricity: {year: electricity.meta.year, source: electricity.meta.source, unit: '% (발전량 비중)',
      categories: [['coal', '석탄'], ['gas', '천연가스'], ['oil', '석유'], ['nuclear', '원자력'], ['hydro', '수력'], ['wind', '풍력'], ['solar', '태양광'], ['other', '기타(바이오·지열 등)']],
      values: electricity.countries},
    religion: {year: '2020', source: 'Pew Research Center (2025)', unit: '% (인구 대비)',
      categories: [['christianity', '크리스트교'], ['islam', '이슬람교'], ['hinduism', '힌두교'], ['buddhism', '불교'], ['judaism', '유대교'], ['unaffiliated', '무종교'], ['other', '기타 종교']],
      values: Object.fromEntries(Object.entries(religion.countries).map(([n, r]) => [n, Object.assign(
        Object.fromEntries(Object.entries(r.values).map(([k, v]) => [k, Math.round(v * 10) / 10])),
        {unaffiliated: Math.round(r.unaffiliated * 10) / 10, other: Math.round(r.otherReligions * 10) / 10})]))},
  },
};
fs.writeFileSync(process.env.KB_OUT || path.join(ROOT, 'assets/entity-kb.js'),
  '/* Generated by scripts/build-entity-kb.cjs. Do not edit by hand. */\n' +
  "(function(root,data){if(typeof module==='object'&&module.exports)module.exports=data;else root.WGEntityKB=data})" +
  "(typeof globalThis!=='undefined'?globalThis:this," + JSON.stringify(out) + ');\n');
const counts = {};
Object.values(entities).forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1; });
console.log('entities', counts, 'indicators', Object.keys(indicators).length);
