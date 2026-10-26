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
const FIXED=data('data/exam-relations-completion.json'),COMPLETE=data('data/goal-completion-source.json');
const clueData = data('data/country-clues.json');
const countries = data('data/country-indicators.json');
const groups = data('data/group-series.json');
const electricity = data('data/electricity-mix.json');
const religion = data('data/religion-composition.json');
const religionRaw = data('data/religion-composition-extension.json');
const economy = data('data/economy-indicators.json');
const engine = E.create(K, T);
const SEEDS = 300;
const [Y0, Y1] = REL.check.window;
const MIN_YEARS = REL.check.minYears;

// Yearly values in the unit of the shown table, straight from the data files.
const GROUP = {'bloc-pop': ['pop', 1e8], 'bloc-gdp': ['gdp', 1e12], 'bloc-trade': ['trade', 1e12], 'bloc-gdppc': ['gdppc', 1e3],
  'cont-pop': ['pop', 1e8], 'cont-urban': ['urban', 1], 'cont-old': ['old', 1], 'cont-young': ['young', 1], 'cont-nir': ['nir', 1], 'cont-netmig': ['netmig', 1e4]};
const area = id => Object.fromEntries(R.rankings.find(r => r.id === id).items.map(i => [i.name, i.value * 1e6]));
const MEMBERS = {2023: {EU: 27, ASEAN: 10, MERCOSUR: 4, USMCA: 3}, 2026: {EU: 27, ASEAN: 11, MERCOSUR: 5, USMCA: 3}};
// Agriculture (data/agriculture.json): each column is one FAOSTAT series, in the unit of the table.
const agri = data('data/agriculture.json');
const AGRI = data('data/exam-relations-agriculture.json');
const CONTINENTS = ['아시아', '아프리카', '유럽', '라틴 아메리카', '앵글로아메리카', '오세아니아'];
const AGRI_COL = {
  'agri-wheat': ['qcl-production:밀', 1e4], 'agri-rice': ['qcl-production:쌀', 1e4], 'agri-maize': ['qcl-production:옥수수', 1e4], 'agri-coffee': ['qcl-production:커피', 1e4],
  'agri-cattle': ['qcl-stocks:소', 1e4], 'agri-pigs': ['qcl-stocks:돼지', 1e4], 'agri-sheep': ['qcl-stocks:양', 1e4], 'agri-riceExports': ['fbs-exports:쌀', 1e4],
  'agri-grainNet': ['fbs-netExports:곡물 전체', 1e4], 'agri-wheatNet': ['fbs-netExports:밀', 1e4], 'agri-maizeNet': ['tcl-netExports:옥수수', 1e4],
  'cont-rice': ['qcl-production:쌀', 1e6], 'cont-wheat': ['qcl-production:밀', 1e6], 'cont-maize': ['qcl-production:옥수수', 1e6], 'cont-grainNet': ['fbs-netExports:곡물 전체', 1e6],
};
// The crop or animal in one area: [series prefix, area, unit].
const AGRI_AREA = {
  'crop-production': ['qcl-production', '세계', 1e6], 'crop-exports': ['fbs-exports', '세계', 1e6], 'crop-exportRatio': ['fbs-exportRatio', '세계', 1],
  'crop-yield': ['qcl-yield', '세계', 1000], 'crop-oceania': ['qcl-production', '오세아니아', 1e4],
  'lv-stocks': ['qcl-stocks', '세계', 1e6], 'lv-meat': ['qcl-meat', '세계', 1e6], 'lv-americas': ['qcl-stocks', '아메리카', 1e6], 'lv-oceania': ['qcl-stocks', '오세아니아', 1e6],
  'lv-africa': ['qcl-stocks', '아프리카', 1e6], 'lv-australia': ['qcl-stocks', '오스트레일리아', 1e4], 'lv-brazil': ['qcl-stocks', '브라질', 1e4], 'lv-china': ['qcl-stocks', '중국', 1e4],
};
// A region made of several FAO areas sums them over common years; its ratios come from the sums.
function agriSeries(area, key) {
  const codes = agri.entities[area].areaCodes;
  if (codes.length > 1 && /^(fbs-exportRatio|qcl-yield):/.test(key)) {
    const item = key.split(':')[1], ratio = key.startsWith('fbs');
    const a = agriSeries(area, (ratio ? 'fbs-exports:' : 'qcl-production:') + item), b = agriSeries(area, (ratio ? 'fbs-production:' : 'qcl-area:') + item);
    return Object.fromEntries(Object.keys(a).filter(y => b[y] > 0).map(y => [y, a[y] / b[y] * (ratio ? 100 : 1000)]));
  }
  const cols = codes.map(c => agri.seriesByArea[c][key] || {});
  return Object.fromEntries(Object.keys(cols[0]).filter(y => cols.every(c => y in c)).map(y => [y, cols.reduce((t, c) => t + c[y], 0)]));
}
const scaled = (ser, k) => Object.fromEntries(Object.entries(ser).map(([y, v]) => [y, v / k]));
const minerals = data('data/mineral-production-shares.json').minerals, MIN_REL = data('data/exam-relations-minerals.json');
const MIN_COL = {'min-copper': '구리', 'min-iron': '철광석'};
// 미국 주별 제조업: shipment shares of the state total, a sum only where every code is published.
const USM = data('data/us-state-manufacturing-series.json'), USM_REL = data('data/exam-relations-us-manufacturing.json'), AIES = data('data/us-state-manufacturing-aies-2023-2024.json');
const US_COL = {'us-computer': ['334'], 'us-petchem': ['324', '325'], 'us-machTrans': ['333', '336'], 'us-metal': ['331', '332'], 'us-aero': ['3364'], 'us-parts': ['3363'], 'us-total': ['31-33']};
function usRaw(ind, name) {
  const fips = Object.keys(USM.states).find(f => USM.states[f].name === name), byYear = {};
  for (const r of USM.rows.concat(AIES.rows)) if (r.stateFips === fips && US_COL[ind].includes(r.naics)) (byYear[r.year] = byYear[r.year] || []).push(ind === 'us-total' ? (r.shipmentsThousandUSD == null ? null : r.shipmentsThousandUSD / 1e5) : r.shareOfStateShipmentsPct);
  return Object.fromEntries(Object.entries(byYear).filter(([, v]) => v.length === US_COL[ind].length && v.every(x => x != null)).map(([y, v]) => [y, v.reduce((a, b) => a + b, 0)]));
}
// Two-period urbanization (UN WUP 2025): a column in the window is read 2015~2025, an earlier one
// within five years of its own year; a change between two columns over every pair of those years.
const WUP = data('data/urbanization-change.json'), POP = data('data/exam-relations-population-change.json');
const WUP_KEY = {share: 'urbanShare', urban: 'urbanPopulation', rural: 'ruralPopulation', total: 'totalPopulation'};
const WUP_SCALE = {wup: 1e4, cwup: 1e6};
const nearYears = y => { const lo = +y >= +Y0 ? +Y0 : Math.max(1950, +y - 5), hi = +y >= +Y0 ? +Y1 : +y + 5; return Array.from({length: hi - lo + 1}, (_, i) => String(lo + i)); };
const wup = (p, k, n, y) => { const v = WUP.areas[n].series[WUP_KEY[k]][y]; return k === 'share' ? v : v / WUP_SCALE[p]; };
const CHANGE = {shareRise: ['share', (a, b) => b - a], ruralChange: ['rural', (a, b) => (b - a) / a * 100], urbanGrowth: ['urban', (a, b) => b / a]};
const PERIOD = /^(c?wup)-(\w+)@(\d{4})(?:-(\d{4}))?$/;
// 대륙 합계 출산율 (UN WPP 2024): a column read within five years of its year, up to the last estimate.
const TFR = data('data/fertility-un-regions.json'), TFR_REL = data('data/exam-relations-fertility.json'), CTFR = /^ctfr@(\d{4})$/;
const tfrRaw = (ind, n) => Object.fromEntries(nearYears(ind.match(CTFR)[1]).filter(y => y <= TFR_REL.lastEstimate).map(y => [y, TFR.areas[n].series[y]]));
const periodAt = (name, ind) => { if (CTFR.test(ind)) return TFR.areas[name].series[ind.match(CTFR)[1]]; const [, p, k, y] = ind.match(PERIOD); return wup(p, k, name, y); };
function periodRaw(ind, n) {
  const [, p, k, A, B] = ind.match(PERIOD);
  if (!B) return Object.fromEntries(nearYears(A).map(y => [y, wup(p, k, n, y)]));
  const [base, f] = CHANGE[k], out = {};
  for (const a of nearYears(A)) for (const b of nearYears(B)) out[a + '~' + b] = f(wup(p, base, n, a), wup(p, base, n, b));
  return out;
}
function raw(ind, name) {
  if(ind==='goal-gdp2021')return {'2021':countries.countries[name].series.gdp['2021']};
  if(ind==='goal-industry2021')return {'2021':economy.countries[name].series.industry['2021']};
  if(ind==='goal-sector2'||ind==='goal-sector3'){const v=economy.countries[name].values,a=['agriculture','industry','services'].map(k=>v[k]);return {'2023':a[ind==='goal-sector2'?1:2]/a.reduce((x,y)=>x+y,0)*100};}
  if(ind==='goal-country-netrate'){const x=data('data/remaining-demographic-balances.json').countries[name]['2023'];return {'2023':x.netMigration/x.population*1000};}
  if(ind==='goal-cont-netrate'){const g=groups.groups[name].series;return {'2023':g.netmig['2023']/g.pop['2023']*1000};}

  if (ind === 'manufacturingInIndustry') {
    const c = economy.countries[name], a = c.series.manufacturing || {}, b = c.series.industry || {};
    return Object.fromEntries(Object.entries(a).filter(([y,v]) => v != null && b[y] > 0 && v >= 0 && v <= b[y]).map(([y,v]) => [y, v / b[y] * 100]));
  }
  if (PERIOD.test(ind)) return periodRaw(ind, name);
  if (CTFR.test(ind)) return tfrRaw(ind, name);
  if (US_COL[ind]) return usRaw(ind, name);
  if (ind === 'energy-total') return energy.countries[name].series.primary_energy_consumption;
  if (MIN_COL[ind]) {
    // BGS shares of the reported total; the row BGS labels Congo (1-17-19941) is not the DR Congo.
    const out = {};
    for (const row of minerals[MIN_COL[ind]]) for (const c of row.countries) if (c.name === name && !c.sourceRowId.startsWith('1-17-19941')) out[row.year] = (out[row.year] || 0) + c.shareOfReportedTotalPct;
    return out;
  }
  if (AGRI_COL[ind]) return scaled(agriSeries(name, AGRI_COL[ind][0]), AGRI_COL[ind][1]);
  if (AGRI_AREA[ind]) return scaled(agriSeries(AGRI_AREA[ind][1], AGRI_AREA[ind][0] + ':' + name), AGRI_AREA[ind][2]);
  if (countries.countries[name] && !GROUP[ind] && !ind.includes('-')) return countries.countries[name].series[ind] || (economy.countries[name].series[ind]) || {};
  if (ind === 'bloc-members') return {2023: MEMBERS[2023][name], 2026: MEMBERS[2026][name]};
  if (ind.endsWith('-area')) return {2024: area(ind)[name] / 1e6};  // UN Demographic Yearbook 2024, fixed
  const g = groups.groups[name].series;
  if (ind === 'cont-agingIndex') return Object.fromEntries(Object.entries(g.old).filter(([y]) => g.young[y] > 0).map(([y, v]) => [y, v / g.young[y] * 100]));
  if (ind === 'cont-density' || ind === 'bloc-density') {
    const a = area(ind.replace('density', 'area'))[name];
    return Object.fromEntries(Object.entries(g.pop).map(([y, v]) => [y, v / a]));
  }
  const [key, scale] = GROUP[ind];
  return Object.fromEntries(Object.entries(g[key] || {}).map(([y, v]) => [y, v / scale]));
}
const STATIC = ind => ind.startsWith('goal-') || ind === 'bloc-members' || ind.endsWith('-area') || PERIOD.test(ind) || CTFR.test(ind);
const inWindow = (ind, y) => STATIC(ind) || (US_COL[ind] ? y >= USM_REL.years[0] && y <= USM_REL.years[1] : y >= Y0 && y <= Y1);
// Years in which `hi` is above `lo`, and years in which it is not.
function yearly(ind, hi, lo) {
  const a = raw(ind, hi), b = raw(ind, lo), years = Object.keys(a).filter(y => y in b && inWindow(ind, y));
  return {years, reversed: years.filter(y => !(a[y] > b[y]))};
}

// The whitelist, read here without the builder.
const allowedPairs = new Map(), allowedSigns = new Set(), lectureDirected = [];
for (const r of REL.relations.concat(FIXED.relations,POP.relations, MIN_REL.relations, USM_REL.relations, TFR_REL.relations)) {
  const allow = (a, b) => allowedPairs.set(r.indicator + '|' + [a, b].sort().join('|'), r.basis);
  for (const [hi, lo] of r.pairs || []) { allow(hi, lo); lectureDirected.push([r.indicator, hi, lo]); }
  (r.tiers || []).forEach((tier, i) => r.tiers.slice(i + 1).flat().forEach(lo => tier.forEach(hi => { allow(hi, lo); lectureDirected.push([r.indicator, hi, lo]); })));
  (r.group || []).forEach((a, i) => r.group.slice(i + 1).forEach(b => allow(a, b)));
  for (const n of r.signs || []) allowedSigns.add(r.indicator + '|' + n);
}
// Agriculture whitelist rows: pairs and signs of countries or continents; a world first place
// allows its holder against any country; an order inside one area allows its items pairwise.
const agriInd = (n, key) => Object.keys(AGRI_COL).find(id => AGRI_COL[id][0] === key && (countries.countries[n] ? id.startsWith('agri-') : CONTINENTS.includes(n) && id.startsWith('cont-')));
const agriFirst = [];
for (const r of AGRI.relations) {
  for (const [hi, lo] of r.pairs || []) { const ind = agriInd(hi, r.indicator); if (ind) { allowedPairs.set(ind + '|' + [hi, lo].sort().join('|'), r.basis); lectureDirected.push([ind, hi, lo]); } }
  for (const n of r.signs || []) { const ind = agriInd(n, r.indicator); if (ind) allowedSigns.add(ind + '|' + n); }
}
for (const o of AGRI.orders) {
  if (o.entity) { const ind = agriInd(o.entity, o.indicator); if (ind) agriFirst.push([ind, o.entity]); continue; }
  const ind = Object.keys(AGRI_AREA).find(id => AGRI_AREA[id][0] === o.prefix && AGRI_AREA[id][1] === o.area);
  if (ind) o.items.forEach((a, i) => o.items.slice(i + 1).forEach(b => allowedPairs.set(ind + '|' + [a, b].sort().join('|'), o.basis)));
}
const allowedPair = (ind, a, b) => allowedPairs.has(ind + '|' + [a, b].sort().join('|')) || agriFirst.some(([i, n]) => i === ind && (n === a || n === b) && countries.countries[a] && countries.countries[b]);
const allowedOrders = {};
// 1차 에너지 구성 (R2): shares from data/energy-series.json, renewables = wind + solar + biofuel + other.
const energy = data('data/energy-series.json');
const ENERGY_REL = data('data/exam-relations-energy.json');
const energyShare = (n, y) => {
  const c = energy.countries[n].series, g = k => (c[k + '_share_energy'] || {})[y];
  const parts = {coal: [g('coal')], oil: [g('oil')], gas: [g('gas')], nuclear: [g('nuclear')], hydro: [g('hydro')], renewables: ['wind', 'solar', 'biofuel', 'other_renewables'].map(g)};
  if (Object.values(parts).flat().some(x => x == null)) return null;
  return Object.fromEntries(Object.entries(parts).map(([k, xs]) => [k, xs.reduce((a, b) => a + b, 0)]));
};
// Energy totals (L2-B0368: 중국 > 미국 > 인도): the whitelisted chain allows each pair along it.
{
  const chain = ENERGY_REL.relations.filter(r => r.indicator === 'primary_energy_consumption').flatMap(r => r.pairs);
  for (const [a, b] of chain) for (const [c, d] of chain) {
    allowedPairs.set('energy-total|' + [a, b].sort().join('|'), 'L2-B0368');
    if (b === c) allowedPairs.set('energy-total|' + [a, d].sort().join('|'), 'L2-B0368');
  }
}
for (const o of REL.orders.concat(ENERGY_REL.orders)) {
  const c = allowedOrders[o.composition] || (allowedOrders[o.composition] = {});
  if (o.fromSet) {
    for (const n of o.entities) {
      const e = C.entry(C.byId[o.fromSet], n);
      if (e.status === 'graded' && e.values.length === 1) (c[n] || (c[n] = [])).push(e.values);
    }
  } else for (const [n, order] of Object.entries(o.orders)) (c[n] || (c[n] = [])).push(o.composition === 'primaryEnergy' && ['중국', '인도'].includes(n) ? order.slice(0, 1) : order);
}
for(const o of FIXED.orders){const c=allowedOrders[o.composition]||(allowedOrders[o.composition]={});(c[o.entity]||(c[o.entity]=[])).push(o.order);}
// L2-B0373 states only the 석탄 first place for 중국·인도 (the builder's ORDER_STATED).
const compositionSeries = {
  renewableFour:n=>({'2023':COMPLETE.renewables2023[n]}),
  exports: n => Object.fromEntries(Object.entries(economy.exports[n].series).filter(([y]) => y >= Y0 && y <= Y1)),
  electricity: n => Object.fromEntries(Object.entries(electricity.countries[n].series).filter(([y]) => y >= Y0 && y <= Y1)),
  religion: n => religion.countries[n].series,
  primaryEnergy: n => Object.fromEntries(Object.keys(energy.countries[n].series.coal_share_energy).filter(y => y >= Y0 && y <= Y1 && energyShare(n, y)).map(y => [y, energyShare(n, y)])),
};
const EXCLUDE = {renewableFour:[],electricity: [], exports: [], religion: ['unaffiliated', 'other'], primaryEnergy: []};
function orderHoldsEveryYear(cid, name, order) {
  let ser = compositionSeries[cid](name);const fixed=FIXED.orders.find(o=>o.composition===cid&&o.entity===name&&o.order.join()===order.join());if(fixed)ser={[fixed.year]:ser[fixed.year]};
  // Religion: the rounded and the unrounded Pew rows, and no 무종교·기타 bundle above a ranked religion.
  const rows = Object.values(ser).concat(cid === 'religion' && religionRaw.countries[name] ? Object.values(religionRaw.countries[name].series) : []);
  return rows.every(v => {
    const rest = Object.keys(v).filter(k => !order.includes(k) && !EXCLUDE[cid].includes(k));
    return order.every((k, i) => (i + 1 < order.length ? v[k] > v[order[i + 1]] : rest.every(o => v[k] > v[o]))) &&
      EXCLUDE[cid].every(k => !(v[k] >= v[order[order.length - 1]]));
  }) && (fixed?Object.keys(ser).length===1:cid === 'religion' ? Object.keys(ser).length === 2 : Object.keys(ser).length >= MIN_YEARS);
}

// Each independent raw-source check inspects the same deterministic 300-seed bank.
// Build it once; repeated generation adds no coverage and obscures failures behind retries.
let questionBank;
function* questions() {
  if (!questionBank) {
    questionBank = [];
    for (const t of engine.themes) for (let seed = 1; seed <= SEEDS; seed++) {
      const q = engine.build({themeId: t.id, seed});
      assert.ok(q, t.id + ' seed ' + seed);
      questionBank.push(q);
    }
  }
  yield* questionBank;
}
const num = cell => Number(String(cell).replace(/,/g, ''));

test('recalled comparisons are whitelisted and hold in every year of the window', () => {
  let n = 0;
  for (const q of questions()) {
    for (const s of q.stage2.statements.filter(x => x.kind === 'compare')) {
      const {ind, subject, object} = s.check, key = ind + '|' + [subject, object].sort().join('|');
      assert.ok(allowedPair(ind, subject, object), 'not whitelisted: ' + key + ' — ' + s.text);
      const [hi, lo] = s.truth ? [subject, object] : [object, subject];
      const {years, reversed} = yearly(ind, hi, lo);
      assert.deepEqual(reversed, [], `${ind} ${hi} > ${lo} reverses in ${reversed}`);
      if (!STATIC(ind)) assert.ok(years.length >= (US_COL[ind] ? USM_REL.minYears : MIN_YEARS), `${ind} ${hi}/${lo}: only ${years.length} years`);
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
    // A change between two shown columns is read from those two cells.
    const cellOf = (name, ind) => num(q.display.rows[q.entities.indexOf(name)].cells[col(ind)]);
    const fromOf = ind => { if (ind === 'manufacturing') return ['industry', 'manufacturingInIndustry']; const m = ind.match(PERIOD); return m && m[4] ? [m[1] + '-' + CHANGE[m[2]][0] + '@' + m[3], m[1] + '-' + CHANGE[m[2]][0] + '@' + m[4]] : null; };
    const shownValue = (name, ind) => { if (q.shown.includes(ind)) return cellOf(name, ind); const f = fromOf(ind); return f ? ind === 'manufacturing' ? cellOf(name, f[0]) * cellOf(name, f[1]) / 100 : CHANGE[ind.match(PERIOD)[2]][1](cellOf(name, f[0]), cellOf(name, f[1])) : cellOf(name, ind); };
    const readable = ind => q.shown.includes(ind) || (fromOf(ind) || [null]).every(x => x && q.shown.includes(x));
    for (const x of b.relations || []) {
      assert.ok(allowedPair(x.indicator, x.hi, x.lo), 'identification uses ' + x.indicator + ' ' + x.hi + '/' + x.lo);
      assert.deepEqual(yearly(x.indicator, x.hi, x.lo).reversed, [], x.indicator + ' ' + x.hi + ' > ' + x.lo);
      assert.ok(readable(x.indicator), x.indicator + ' is not in the table');
    }
    for (const x of b.signs || []) {
      assert.ok(allowedSigns.has(x.indicator + '|' + x.entity));
      assert.ok(readable(x.indicator), x.indicator + ' is not in the table');
      for (const [y, v] of Object.entries(raw(x.indicator, x.entity))) if (inWindow(x.indicator, y)) assert.equal(v > 0, x.positive, x.entity + ' ' + y);
    }
    for (const o of b.orders || []) {
      assert.ok((allowedOrders[o.composition][o.entity] || []).some(a => a.join() === o.order.join()), 'order not whitelisted: ' + o.entity);
      assert.ok(orderHoldsEveryYear(o.composition, o.entity, o.order), o.composition + ' ' + o.entity + ' ' + o.order);
    }
    // Every wrong assignment must break some piece of that knowledge on the shown numbers.
    const comp = n => q.display.columns.reduce((v, c, i) => Object.assign(v, {[c.id]: num(q.display.rows[q.entities.indexOf(n)].cells[i])}), {});
    if (t.kind === 'climate') continue;  // checked against the station data in its own test below
    if (t.kind === 'clues') {
      // Each row is a sentence of an eligible lecture passage about its own country, and names
      // something no other marked country's clue names, so any other placement contradicts it.
      const marked = q.stage1.candidates || q.entities;
      q.entities.forEach((n, i) => {
        const c = K.entities[n].clues[+q.shown[i].split('#')[1]];
        // City clues are the lecture's reference-point cells (data/exam-world-cities.json).
        if (t.entityType === 'site') assert.ok(data('data/exam-world-cities.json').cities[n].clues.some(x => x.text === c.text), n + ': ' + c.text);
        else if(c.source.startsWith('앱 재서술 · 강의 ')){const anchors=data('data/goal-country-facts.json').clueAnchors[n];assert.ok(anchors,n);assert.deepEqual(c.keys,anchors);assert.ok(anchors.every(k=>c.text.includes(k)),n+' clue anchors');}
        else assert.ok(clueData.countries[n].some(x => x.eligibleIdentification && x.text.includes(c.text)), n + ': ' + c.text);
        assert.ok(c.text.endsWith(q.display.rows[i].cells[0].replace(/^이 (나라|도시)(의|에는) /, '')), n + ' shown text');
        assert.ok(!q.display.rows[i].cells[0].includes(n), n + ' named in its own clue');
        for (const o of marked) if (o !== n) for (const d of K.entities[o].clues || []) for (const k of c.keys) assert.ok(!d.text.includes(k), `${n} clue key ${k} also in ${o}`);
      });
      continue;
    }
    if (q.format === 'joint') {
      // 동시 식별: every other placement of the 대상 with every other naming of A~C breaks a
      // whitelisted order, held every year, on the shown numbers.
      const k = q.entities.length, cell = (n, j) => num(q.display.rows[q.entities.indexOf(n)].cells[j]);
      for (const o of b.orders) {
        assert.ok((allowedOrders[o.composition][o.entity] || []).some(a => a.join() === o.order.join()), 'order not whitelisted: ' + o.entity);
        assert.ok(orderHoldsEveryYear(o.composition, o.entity, o.order), o.entity);
      }
      for (const p of permutations(q.entities)) for (const g of permutations(q.hidden)) {
        if (p.join() === q.entities.join() && g.join() === q.hidden.join()) continue;
        const broken = b.orders.some(o => {
          if (!p.includes(o.entity)) return false;
          const row = q.entities[p.indexOf(o.entity)], v = {};
          q.display.columns.forEach((c, j) => { if (c.unit === '%') v[c.reveal ? g[q.hidden.indexOf(c.id)] : c.id] = cell(row, j); });
          const others = Object.keys(v).filter(x => !o.order.includes(x) && !EXCLUDE[o.composition].includes(x));
          return o.order.some((x, i) => (i + 1 < o.order.length ? [o.order[i + 1]] : others).some(y => v[y] > v[x]));
        });
        assert.ok(broken, `${t.id}: ${p.join(',')} / ${g.join(',')} is not ruled out`);
      }
      continue;
    }
    if (q.format === 'columns') {
      // 항목 식별: every wrong assignment of the hidden columns breaks a verified relation, sign
      // or composition order on the shown numbers.
      const col = id => q.display.columns.findIndex(c => c.id === id), cell = (n, j) => num(q.display.rows[q.entities.indexOf(n)].cells[j]);
      for (const g of q.stage1.options) {
        if (g.join() === q.hidden.join()) continue;
        const at = id => col(q.hidden[g.indexOf(id)]);
        const broken = t.kind === 'indicators'
          ? K.relations.some(x => x.status === 'active' && g.includes(x.indicator) && q.entities.includes(x.hi) && q.entities.includes(x.lo) && allowedPair(x.indicator, x.hi, x.lo) && cell(x.lo, at(x.indicator)) > cell(x.hi, at(x.indicator))) ||
            K.signs.some(x => x.status === 'active' && g.includes(x.indicator) && q.entities.includes(x.entity) && (cell(x.entity, at(x.indicator)) > 0) !== x.positive)
          : q.entities.some(n => K.orders.filter(o => o.status === 'active' && o.composition === t.composition && o.entity === n).some(o => {
              const v = {};
              q.display.columns.forEach((c, j) => { if (c.id !== 'total' && c.id !== 'exports' && c.unit === '%') v[c.reveal ? g[q.hidden.indexOf(c.id)] : c.id] = cell(n, j); });
              const others = Object.keys(v).filter(k => !o.order.includes(k));
              return o.order.some((k, i) => (i + 1 < o.order.length ? [o.order[i + 1]] : others).some(b => v[b] > v[k]));
            }));
        assert.ok(broken, `${t.id}: column guess ${g.join(',')} is not ruled out`);
      }
      continue;
    }
    // Two-대상 questions offer pairs drawn from four named candidates, so check those options too.
    const wrongs = permutations(q.entities).concat(q.stage1.options).filter(p => p.join() !== q.entities.join());
    for (const p of wrongs) {
      const rowOf = name => q.entities[p.indexOf(name)], placed = name => p.includes(name);
      const broken = (b.relations || []).some(x => placed(x.hi) && placed(x.lo) && shownValue(rowOf(x.lo), x.indicator) > shownValue(rowOf(x.hi), x.indicator)) ||
        (b.signs || []).some(x => placed(x.entity) && (shownValue(rowOf(x.entity), x.indicator) > 0) !== x.positive) ||
        (b.orders || []).some(o => {
          if (!placed(o.entity)) return false;
          const v = comp(rowOf(o.entity)), cats = t.show.filter(k => !EXCLUDE[o.composition].includes(k) && !o.order.includes(k));
          return o.order.some((k, i) => (i + 1 < o.order.length ? [o.order[i + 1]] : cats).some(c => v[c] > v[k]));
        }) ||
        (b.items || []).some(x => placed(x.entity) && t.items[rowOf(x.entity)][0][0] !== x.top);
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
    for (const s of q.stage2.statements.filter(x => x.kind === 'data' && !x.check.op)) {
      const c = s.check;
      let amount;
      if (c.category) {
        if (q.theme.composition === 'religion') {
          amount = n => religion.countries[n].series['2020'][c.category] * religion.countries[n].populationSeries['2020'];
        } else if (q.theme.composition === 'primaryEnergy') {
          // Shares and primary energy consumption come from the same OWID rows.
          amount = n => energyShare(n, '2023')[c.category] * energy.countries[n].series.primary_energy_consumption['2023'];
          assert.ok(q.display.columns.some(x => x.label === '1차 에너지 소비량'));
        } else if (q.theme.composition === 'electricity') {
          // Shares and total generation come from the same OWID row.
          const y = electricity.meta.baseYear;
          amount = n => electricity.countries[n].series[y][c.category] * electricity.countries[n].generationSeries[y];
          assert.ok(q.display.columns.some(x => x.label === '총발전량'));
        } else {
          assert.equal(q.theme.composition, 'exports');
          assert.equal(economy.meta.baseYear, countries.meta.baseYear);
          amount = n => economy.exports[n].series[economy.meta.baseYear][c.category] * countries.countries[n].series.exports[economy.meta.baseYear];
          assert.ok(q.display.columns.some(x => x.id === 'exports'));
        }
      } else if (c.from || c.majority) {
        continue;  // two-period readings: recomputed from the WUP file in their own test below
      } else if (c.indicator) {
        assert.ok(q.shown.includes(c.indicator), 'a supplied comparison needs the indicated column');
        const v = n => raw(c.indicator, n)[c.indicator.includes('-') ? '2023' : countries.meta.baseYear];
        amount = n => v(n);
      } else {
        const v = (n, ind) => raw(ind, n)[ind.startsWith('goal-')?K.indicators[ind].year:PERIOD.test(ind) ? ind.match(PERIOD)[3] : US_COL[ind] ? USM_REL.displayYear : countries.countries[n] && !ind.includes('-') ? countries.meta.baseYear : '2023'];
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
      const year = ind.startsWith('goal-')?K.indicators[ind].year:PERIOD.test(ind) ? ind.match(PERIOD)[3] : CTFR.test(ind) ? ind.match(CTFR)[1] : MIN_COL[ind] ? '2024' : US_COL[ind] ? USM_REL.displayYear : ind.endsWith('-area') ? '2024' : q.theme.entityType === 'country' ? countries.meta.baseYear : '2023';
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

test('equator and prime-meridian statements agree with geography', () => {
  // Countries the lines cross (the ones drawn on the app's map).
  const EQUATOR = ['브라질', '콜롬비아', '에콰도르', '가봉', '콩고', '콩고 민주 공화국', '우간다', '케냐', '소말리아', '인도네시아', '몰디브', '키리바시', '상투메 프린시페'];
  const MERIDIAN = ['영국', '프랑스', '에스파냐', '알제리', '말리', '부르키나파소', '가나', '토고'];
  const onMap = list => list.filter(n => K.entities[n] && K.entities[n].type === 'country').sort();
  const crossing = line => Object.values(K.entities).filter(e => e.type === 'country' && e.lines[line].crosses).map(e => e.name).sort();
  assert.deepEqual(crossing('equator'), onMap(EQUATOR));
  assert.deepEqual(crossing('meridian'), onMap(MERIDIAN));
  for (const q of questions()) for (const s of q.stage2.statements) {
    if (!['equator','meridian'].includes(s.check.line)) continue;
    const list = s.check.line === 'equator' ? EQUATOR : MERIDIAN;
    assert.equal(list.includes(s.check.entity), s.truth, s.text + ' ' + s.check.entity);
    assert.match(s.text, s.check.line === 'equator' ? /적도가 지난다/ : /본초 자오선이 지난다/);
  }
});

// Köppen letters re-derived here from data/climate-normals.json with the lecture's thresholds
// (1권 P02), each with whether the deciding values clear 1℃ / 10mm / 15% of the limit.
const climateData = data('data/climate-normals.json'), climateExt = data('data/climate-normals-extension.json');
const climateClaims = data('data/climate-type-claims.json').claims;
const station = Object.fromEntries(climateData.sites.map(x => [x.name, x]));
// Added stations are found through the source file the knowledge base records for them.
for (const x of climateExt.sites) {
  const e = Object.values(K.entities).find(v => v.type === 'site' && v.climate && v.climate.sourceId === 'ext:' + x.sourceFile);
  if (e) station[e.name] = x;
}
// Round-two JMA stations: the monthly values from the file; the lecture type and the latitude are
// the builder's documented choices (1권 P02, same WMO station or city point).
for (const [n, x] of Object.entries(data('data/climate-normals-round2.json').stations)) {
  const e = K.entities[n];
  if (!e || e.type !== 'site' || !e.climate || e.climate.sourceId !== 'jma-' + x.wmoId) continue;
  station[n] = {temperatureC: x.monthlyMeanTemperatureC, precipitationMm: x.monthlyPrecipitationMm, lectureClimate: e.climate.lecture, station: {latitude: e.climate.lat, elevationM: e.climate.elevation}};
}
function letters(T, P, lat) {
  const sum = a => a.reduce((x, y) => x + y, 0), hot = Math.max(...T), cold = Math.min(...T), mean = sum(T) / 12, rain = sum(P);
  const sm = lat >= 0 ? [3, 4, 5, 6, 7, 8] : [9, 10, 11, 0, 1, 2], wm = [...Array(12).keys()].filter(i => !sm.includes(i));
  const ok = (v, lim, unit) => (unit === '%' ? Math.abs(v - lim) / Math.max(Math.abs(lim), 1) >= 0.15 : Math.abs(v - lim) >= (unit === 'mm' ? 10 : 1));
  const out = [];
  if (hot < 10) return [['e', ok(hot, 10)], [hot >= 0 ? 't' : 'f', ok(hot, 0)]];
  const share = sum(sm.map(i => P[i])) / rain, lim = 20 * mean + (share >= 0.7 ? 280 : 1 - share >= 0.7 ? 0 : 140);
  if (rain < lim) return [['b', ok(rain, lim, '%')], [rain >= lim / 2 ? 's' : 'w', ok(rain, lim / 2, '%')]];
  if (cold >= 18) { const dry = Math.min(...P); return [['a', ok(cold, 18) && ok(rain, lim, '%')], [dry >= 60 ? 'f' : dry >= 100 - rain / 25 ? 'm' : 'w', ok(dry, 60, 'mm') && ok(dry, 100 - rain / 25, 'mm')]]; }
  out.push([cold >= -3 ? 'c' : 'd', ok(cold, 18) && ok(cold, -3) && ok(rain, lim, '%')]);
  const sDry = Math.min(...sm.map(i => P[i])), wWet = Math.max(...wm.map(i => P[i])), wDry = Math.min(...wm.map(i => P[i])), sWet = Math.max(...sm.map(i => P[i]));
  const s = sDry < 40 && sDry < wWet / 3, w = wDry < sWet / 10;
  const sClear = s ? ok(sDry, 40, 'mm') && ok(sDry, wWet / 3, '%') : (sDry >= 40 && ok(sDry, 40, 'mm')) || (sDry >= wWet / 3 && ok(sDry, wWet / 3, '%'));
  out.push([s && !w ? 's' : w && !s ? 'w' : s && w ? 'x' : 'f', sClear && ok(wDry, sWet / 10, '%')]);
  out.push([hot >= 22 ? 'a' : 'b', ok(hot, 22)]);
  return out;
}
// 고산 기후 by its trace: tropical latitude, coldest month ≤ 17℃, range ≤ 4℃, not a low station
// ('yes'); outside the tropics, coldest ≥ 19℃, range ≥ 6℃ or below 1,000m ('no').
function highlandOf(n) {
  const x = station[n], T = x.temperatureC, cold = Math.min(...T), range = Math.max(...T) - cold, lat = Math.abs(x.station.latitude), h = x.station.elevationM;
  if (lat < 23.44 && cold <= 17 && range <= 4 && (h == null || h >= 1500)) return 'yes';
  return lat >= 23.44 || cold >= 19 || range >= 6 || (h != null && h < 1000) ? 'no' : 'unclear';
}
// The type's letters that the data clearly decide and that differ from it.
const clashes = (n, type) => { if (type === 'h') return highlandOf(n) === 'no'; const x = station[n], L = letters(x.temperatureC, x.precipitationMm, x.station.latitude); return [...type].some((ch, i) => L[i] && L[i][1] && L.slice(0, i).every(l => l[1]) && L[i][0] !== ch); };
// Every letter of the type is clearly decided by the data and agrees with it.
const confirmed = (n, type) => { if (type === 'h') return highlandOf(n) === 'yes'; if (highlandOf(n) !== 'no') return false; const x = station[n], L = letters(x.temperatureC, x.precipitationMm, x.station.latitude); return [...type].every((ch, i) => L[i] && L[i][1] && L[i][0] === ch); };
const seasonOf = n => { const T = station[n].temperatureC, c = T.indexOf(Math.min(...T)) + 1; return Math.max(...T) - Math.min(...T) < 5 ? null : [12, 1, 2].includes(c) ? 'N' : [6, 7, 8].includes(c) ? 'S' : null; };

test('climate questions use verified types and seasons, and every wrong option is ruled out by the data', () => {
  let n = 0;
  for (const q of questions()) {
    if (q.theme.kind !== 'climate') continue;
    n++;
    const hemi = name => (station[name].station.latitude >= 0 ? 'N' : 'S');
    for (const name of q.entities) {
      const L = station[name].lectureClimate;
      if((q.theme.allowSeasonalSites||[]).includes(name)){assert.equal(K.entities[name].climate.type,null);assert.equal(seasonOf(name),hemi(name));}else{assert.ok(confirmed(name,L),name+' identified by an unconfirmed type');assert.equal(K.entities[name].climate.type,L,name);}
    }
    // Each graph is the data of its 대상, and the rows sit on one common scale.
    q.display.rows.forEach((row, i) => assert.deepEqual(row.temperature, station[q.entities[i]].temperatureC));
    for (const p of q.stage1.options) {
      if (p.join() === q.entities.join()) continue;
      const broken = p.some((name, i) => {
        const row = q.entities[i], type = K.entities[name].climate.type;
        return (type && clashes(row, type)) || (seasonOf(row) && seasonOf(row) !== hemi(name));
      });
      assert.ok(broken, 'climate option ' + p.join(',') + ' is not ruled out');
    }
    for (const s of q.stage2.statements) {
      const c = s.check;
      if (s.kind === 'graph') {
        const v = name => {
          const T = station[name].temperatureC, P = station[name].precipitationMm, rain = P.reduce((a, b) => a + b, 0);
          return {range: Math.max(...T) - Math.min(...T), coldest: Math.min(...T), warmest: Math.max(...T), annual: rain, summer: (P[5] + P[6] + P[7]) / rain * 100}[c.metric];
        };
        assert.equal(v(c.subject) > v(c.object), s.truth, s.text);
      }
      if (s.kind === 'climate') assert.equal(c.type === station[c.entity].lectureClimate, s.truth, s.text);
      if (s.kind === 'climate' && !s.truth) assert.ok(clashes(c.entity, c.type), 'a wrong type the data do not rule out: ' + s.text);
      if (s.kind === 'place' && c.place === 'hemisphere') assert.equal(hemi(c.entity) === c.value, s.truth, s.text);
      if (s.kind === 'climateClaim') {
        const L = station[c.entity].lectureClimate;
        if(c.claim==='wet-season'&&(q.theme.allowSeasonalSites||[]).includes(c.entity))assert.equal(K.entities[c.entity].climate.type,null,'seasonal reading must not activate a marginal type');else assert.ok(confirmed(c.entity,L),'claim about an unverified type: '+s.text);
        if(s.goalId){
          if(c.claim==='wet-season'){const P=station[c.entity].precipitationMm,m=parseInt(c.month)-1;assert.equal(P[m]>P[(m+6)%12],s.truth,s.text);}
          else if(c.claim==='winter-dry'){assert.ok(['cw','cfa'].includes(L));assert.equal(s.truth,!s.text.includes('겨울 강수에 관계없이 반드시 Cw'),s.text);}
          else if(c.claim==='highland-scope'){assert.equal(L,'h');assert.equal(s.truth,s.text.includes('일반화해서는 안 된다'),s.text);}
          else assert.fail('Unknown climate goal claim '+c.claim);
        }else{
          const k = climateClaims.find(x => x.id === c.claim), has = list => list.map(t => t.toLowerCase()).includes(L);
          assert.ok(k,s.text);assert.equal(has(k.trueFor), s.truth, s.text);
          if (!s.truth) assert.ok(has(k.falseFor), 'false only for a contrasted type: ' + s.text);
        }
      }
    }
  }
  assert.ok(n > 200, 'climate questions exercised: ' + n);
});

test('agriculture: world first places hold against every country in every year', () => {
  const cards = data('data/concepts/agriculture.json');
  const series = {topProducer: item => 'qcl-production:' + item, topRaiser: item => 'qcl-stocks:' + item};
  const checked = new Set();
  for (const q of questions()) for (const s of q.stage2.statements) {
    const c = s.check;
    if (!(c.set in series) && !(s.kind === 'both' && c.set in series)) continue;
    for (const item of s.kind === 'both' ? [c.a, c.b] : [c.entity]) {
      const key = series[c.set](item), first = K.entities[item].facts[c.set].values[0];
      if (checked.has(key)) continue;
      checked.add(key);
      const firstCode = agri.entities[first].areaCodes[0];
      for (let y = Y0; y <= 2024; y++) {
        const v = agri.seriesByArea[firstCode][key][y];
        assert.ok(v > 0, key + ' ' + first + ' ' + y);
        for (const [code, a] of Object.entries(agri.sourceAreas)) {
          if (a.kind !== 'country' || code === firstCode) continue;
          const w = ((agri.seriesByArea[code] || {})[key] || {})[y];
          if (w != null) assert.ok(v >= w * AGRI.check.minRatio, `${key} ${y}: ${first} ${v} vs ${a.name} ${w}`);
        }
      }
    }
    assert.ok(Object.keys(cards.entities).includes(c.entity || c.a));
  }
  assert.ok(checked.size >= 4, 'first places exercised: ' + [...checked]);
});

test('agriculture: concept statements keep the card truth; non-exclusive card sets stay out', () => {
  const cards = data('data/concepts/agriculture.json');
  let n = 0;
  for (const q of questions()) for (const s of q.stage2.statements) {
    if (s.kind === 'concept' && /^agri-/.test(s.check.concept)) {
      const card = cards.statements.find(x => s.explain.startsWith(x.claim));
      assert.ok(card, s.explain);
      assert.equal(s.truth, card.truth, s.text);
      n++;
    }
    // A set that is not exclusive could only ever be true, which would give the answer away.
    if (s.check.set && cards.sets[s.check.set]) assert.ok(cards.sets[s.check.set].exclusive, s.text);
  }
  assert.ok(n > 50, 'concept statements exercised: ' + n);
});

test('agriculture knowledge is recalled only where a theme lists its domain', () => {
  for (const q of questions()) {
    const domains = q.theme.domains || [null];
    for (const s of q.stage2.statements) {
      const ind = s.check.ind;
      if (!ind) continue;
      assert.ok(domains.includes(AGRI_COL[ind] || AGRI_AREA[ind] ? 'agri' : US_COL[ind] ? 'usMfg' : null), q.theme.id + ': ' + s.text);
    }
  }
});

test('religion: recalled orders cite the lecture and hold on the unrounded Pew rows', () => {
  for (const o of K.orders.filter(x => x.composition === 'religion')) {
    assert.match(o.basis, /강의 1권 P04/, o.entity);
    if (o.status === 'active') assert.ok(orderHoldsEveryYear('religion', o.entity, o.order), o.entity + ' ' + o.order);
  }
  // The lecture declines one religion for 나이지리아 and says nothing of 레바논's; 미얀마's 2위 is too close.
  for (const n of ['나이지리아', '레바논']) {
    assert.ok(!K.orders.some(o => o.composition === 'religion' && o.entity === n), n);
  }
  assert.ok(!K.entities['나이지리아'].facts.religion);
  assert.equal(K.orders.find(o => o.entity === '미얀마' && o.order.length === 2).status, 'belowMargin');
  for (const q of questions()) for (const o of q.stage1.basis.orders || []) {
    assert.ok(o.status === undefined || o.status === 'active', o.entity);
    assert.ok(!(o.entity === '미얀마' && o.order.length === 2), '미얀마 2위 used');
  }
  // The unrounded release is the same estimate as the rounded file.
  for (const [n, c] of Object.entries(religionRaw.countries)) for (const [y, v] of Object.entries(c.series)) {
    for (const [k, x] of Object.entries(v)) assert.ok(Math.abs(x - religion.countries[n].series[y][k]) <= 0.051, `${n} ${y} ${k}`);
  }
});

test('religion facts asked about A~C follow the lecture, and the world order holds in the Pew world rows', () => {
  const W = religionRaw.world.series, facts = Object.fromEntries(REL.categoryFacts.map(f => [f.id, f]));
  const claims = Object.fromEntries(data('data/religion-type-claims.json').claims.map(k => [k.id, k]));
  assert.deepEqual(Object.keys(W).sort(), ['2010', '2020']);
  for (const v of Object.values(W)) facts.world.order.slice(1).forEach((x, i) => assert.ok(v[facts.world.order[i]] - v[x] >= 2, facts.world.order[i] + ' > ' + x));
  let n = 0;
  for (const q of questions()) for (const s of q.stage2.statements.filter(x => x.kind === 'category')) {
    const f = facts[s.check.trait], c = s.check;
    if (claims[c.trait]) {
      // The data session's list: true for trueFor, false only for falseFor.
      const k = claims[c.trait], name = K.compositions.religion.categories.find(x => x[0] === c.category)[1];
      assert.ok(k.trueFor.length && k.falseFor.length, c.trait);
      assert.equal(k.trueFor.includes(name), s.truth, s.text);
      if (!s.truth) assert.ok(k.falseFor.includes(name), s.text);
    } else {
      assert.match(f.basis, /강의 1권 P04/);
      if (f.kind === 'order') assert.equal(f.order.indexOf(c.subject) < f.order.indexOf(c.object), s.truth, s.text);
      else assert.equal(f.values[c.category] === c.value, s.truth, s.text);
    }
    n++;
  }
  assert.ok(n > 50, 'category <보기> exercised: ' + n);
});

test('climate additions: complete stations only, under their own names; 고산 기후 by its trace', () => {
  const sg = K.entities['싱가포르(창이)'], raw = climateExt.sites.find(x => x.name === '싱가포르');
  assert.deepEqual(sg.climate.temperature, raw.temperatureC);
  assert.deepEqual(sg.climate.precipitation, raw.precipitationMm);
  assert.equal(sg.climate.type, 'af');
  assert.ok(!K.entities['싱가포르'].climate, 'the country keeps no station data');
  assert.ok(!K.entities['키토'] || !K.entities['키토'].climate, '키토');
  assert.equal(K.climate.verdicts.find(v => v.entity === '키토').status, 'excluded', '키토');
  // 이키토스 comes from one JMA station (84377) for both temperature and rainfall, never the San Roque rain.
  const iq = data('data/climate-normals-round2.json').stations['이키토스'];
  assert.deepEqual(K.entities['이키토스'].climate.temperature, iq.monthlyMeanTemperatureC);
  assert.deepEqual(K.entities['이키토스'].climate.precipitation, iq.monthlyPrecipitationMm);
  assert.equal(K.climate.verdicts.filter(v => v.entity === '이키토스').length, 1);
  for (const n of ['보고타', '아디스아바바']) assert.equal(K.entities[n].climate.type, 'h', n);
  // No other graph could be read as 고산 기후.
  for (const [n, e] of Object.entries(K.entities)) if (e.type === 'site' && e.climate && e.climate.lecture !== 'h') assert.equal(highlandOf(n), 'no', n);
});

test('period tables: cells are the WUP and WPP values of their years, and change <보기> recompute from them', () => {
  let n = 0;
  for (const q of questions()) {
    if (!q.theme.periodTable) continue;
    const at = periodAt;
    // Other columns (순이동·인구 next to the TFR) are checked with the base-year table values.
    q.display.columns.forEach((c, j) => (PERIOD.test(c.id) || CTFR.test(c.id)) && q.entities.forEach((name, i) => {
      assert.ok(Math.abs(num(q.display.rows[i].cells[j]) - at(name, c.id)) <= Math.max(0.051, Math.abs(at(name, c.id)) * 0.006), `${name} ${c.id}`);
    }));
    for (const s of q.stage2.statements) {
      const c = s.check;
      if (s.kind !== 'data') continue;
      n++;
      if (c.majority) assert.equal(at(c.entity, c.majority) > 50 === c.claim, s.truth, s.text);
      else if (c.from && c.entity) assert.equal(at(c.entity, c.to) > at(c.entity, c.from) === c.up, s.truth, s.text);
      else if (c.from) {
        const ch = x => (c.ratio ? at(x, c.to) / at(x, c.from) : (at(x, c.to) - at(x, c.from)) * (c.drop ? -1 : 1));
        assert.equal(ch(c.subject) > ch(c.object), s.truth, s.text);
      }
    }
  }
  assert.ok(n > 300, 'period <보기> exercised: ' + n);
});
