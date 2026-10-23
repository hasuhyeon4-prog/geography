'use strict';
// 미국 주별 제조업 theme (round two: data/us-state-manufacturing-series.json).
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const root = path.resolve(__dirname, '..'), read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const K = require(path.join(root, 'assets/entity-kb.js')), T = require(path.join(root, 'assets/exam-themes.js'));
const E = require(path.join(root, 'assets/exam-engine.js')).create(K, T);
const G = require(path.join(root, 'assets/location-grading.js'));
const USM = read('data/us-state-manufacturing-series.json'), REL = read('data/exam-relations-us-manufacturing.json');
const theme = T.byId['us-manufacturing'];

test('every lecture pair holds 2014~2024 except the 2013 total order 텍사스 > 캘리포니아, which flips in 2020', () => {
  const rows = K.relations.filter(r => r.indicator.startsWith('us-'));
  assert.equal(rows.length, REL.relations.reduce((n, r) => n + r.pairs.length, 0));
  for (const r of rows) {
    if (r.indicator === 'us-total' && r.hi === '텍사스' && r.lo === '캘리포니아') { assert.equal(r.status, 'reversed'); assert.match(r.reason, /2020년/); continue; }
    assert.equal(r.status, 'active', JSON.stringify(r));
    assert.ok(r.n >= REL.minYears, r.indicator + ' ' + r.hi + ' ' + r.lo);
  }
  // No whitelisted pair joins states that never share an exam set.
  for (const r of REL.relations) for (const p of r.pairs) assert.ok(!(p.includes('오하이오') && (p.includes('미시간') || p.includes('워싱턴주'))), p.join('/'));
});

test('withheld (D) cells stay missing, and sums use only fully published years', () => {
  // Washington's 3364 is withheld in 2014·2015 (also in the 2016 release); AIES 2023·2024 make nine years.
  const aero = K.relations.find(r => r.indicator === 'us-aero' && r.lo === '미시간');
  assert.deepEqual(aero.years, ['2016', '2024']);
  assert.equal(aero.n, 9);
  // 324+325 for 워싱턴주 is missing in 2014 (325 withheld), not counted as 324 alone.
  const pc = K.relations.find(r => r.indicator === 'us-petchem' && r.lo === '워싱턴주');
  assert.deepEqual(pc.years, ['2015', '2024']);
  const withheld = USM.rows.filter(r => r.shareOfStateShipmentsPct == null);
  assert.ok(withheld.length > 0 && withheld.every(r => r.rawShipments === 'D' || r.shipmentsFlag === 'D'));
  // Table values are the 2022 Economic Census rows, rounded to one decimal.
  const share = (n, codes) => codes.map(c => USM.rows.find(r => USM.states[r.stateFips].name === n && r.year === 2022 && r.naics === c).shareOfStateShipmentsPct).reduce((a, b) => a + b, 0);
  assert.equal(K.entities['텍사스'].values['us-petchem'], Math.round(share('텍사스', ['324', '325']) * 10) / 10);
  assert.equal(K.entities['미시간'].values['us-parts'], Math.round(share('미시간', ['3363']) * 10) / 10);
  assert.equal(K.entities['캘리포니아'].values['us-total'], Math.round(USM.rows.find(r => r.stateFips === '06' && r.year === 2022 && r.naics === '31-33').shipmentsThousandUSD / 1e5));
  for (const id of theme.indicators) assert.equal(K.indicators[id].domain, 'usMfg', id);
});

test('state letters sit inside their state, and the packed outlines match the GeoJSON', () => {
  const geo = read('data/us-state-boundaries.geojson'), shapes = require(path.join(root, 'assets/us-state-boundaries.js'));
  for (const n of theme.pool) {
    const e = K.entities[n];
    assert.equal(e.type, 'usState');
    assert.ok(G.inPolygons({lon: e.label[0], lat: e.label[1]}, shapes.byName[n].polygons), n);
  }
  const src = fs.readFileSync(path.join(root, 'assets/us-state-boundaries.js'), 'utf8');
  cp.execFileSync('node', [path.join(root, 'scripts/build-us-state-shapes.cjs')], {stdio: 'pipe'});
  assert.equal(fs.readFileSync(path.join(root, 'assets/us-state-boundaries.js'), 'utf8'), src, 'rebuild scripts/build-us-state-shapes.cjs');
  assert.equal(Object.keys(shapes.byName).length, geo.features.length);
});

test('questions use only usMfg knowledge; facts never claim 워싱턴주 for a belt', () => {
  let built = 0;
  for (let seed = 1; seed <= 300; seed++) {
    const q = E.build({themeId: 'us-manufacturing', seed});
    if (!q) continue;
    built++;
    for (const s of q.stage2.statements) {
      if (s.check.ind) assert.equal(K.indicators[s.check.ind].domain, 'usMfg', s.text);
      if (s.kind === 'fact') {
        assert.ok(['usBelt', 'usCoast', 'usCity'].includes(s.check.set), s.text);
        if (s.check.set === 'usBelt') assert.notEqual(s.check.entity, '워싱턴주', s.text);
        const f = K.entities[s.check.entity].facts[s.check.set];
        assert.equal(f.values.includes(s.check.value), s.truth, s.text);
      }
    }
    if (q.stage1.markers) for (const m of q.stage1.markers) assert.equal(K.entities[m.name].type, 'usState');
  }
  assert.ok(built >= 250, 'built ' + built);
});

test('draws stay in the two exam sets, the map marks only them, and overlapping columns stay apart', () => {
  const sets = theme.sets.map(s => new Set(s));
  for (let seed = 1; seed <= 300; seed++) {
    const q = E.build({themeId: 'us-manufacturing', seed});
    assert.ok(q, 'seed ' + seed);
    assert.ok(sets.some(s => q.entities.every(n => s.has(n))), seed + ' ' + q.entities.join(','));
    if (q.stage1.markers) assert.deepEqual(q.stage1.markers.map(m => m.name).sort(), q.entities.slice().sort(), 'seed ' + seed);
    for (const pair of theme.apart) assert.ok(!pair.every(id => q.shown.includes(id)), seed + ' shows ' + pair.join(' and '));
    if (q.format === 'columns') assert.ok(!q.hidden.includes('us-total'), 'seed ' + seed + ' hides 총출하액');
  }
});
