const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const vm = require('node:vm');
const K = require('../assets/entity-kb.js');
const T = require('../assets/exam-themes.js');
const E = require('../assets/exam-engine.js').create(K, T);
const economy = require('../data/economy-indicators.json');
const evidence = require('../data/economy-urban-evidence-20261023.json');
const root = require('node:path').join(__dirname, '..');
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const samples = id => Array.from({length: 500}, (_, i) => {
  const q = E.build({themeId: id, seed: i + 1});
  assert.ok(q, id + ' seed ' + (i + 1)); return q;
});

test('selected evidence retains its wording, date scope and input provenance', () => {
  for (const b of evidence.blocks) assert.equal(sha(b.text), b.textSha256, b.id);
  for (const [p, m] of Object.entries(evidence.inputs)) assert.equal(sha(fs.readFileSync(root + '/' + p)), m.sha256, p);
  assert.match(evidence.blocks.find(b => b.id === 'L1-B1571').text, /1955/);
  assert.match(evidence.blocks.find(b => b.id === 'L2-B0606').text, /독일.*영국보다 크다/);
});

test('the three added industry relations pass independently over all eleven years', () => {
  for (const [ind, hi, lo, margin] of [['industry','독일','영국',5], ['manufacturing','독일','영국',3], ['manufacturing','독일','우크라이나',3]]) {
    const x = K.relations.find(x => x.indicator === ind && x.hi === hi && x.lo === lo);
    assert.equal(x.status, 'active'); assert.equal(x.n, 11);
    for (let y = 2015; y <= 2025; y++) assert.ok(economy.countries[hi].series[ind][y] - economy.countries[lo].series[ind][y] >= margin, ind + ' ' + y);
  }
});

test('the new denominator uses two same-year WDI values and never fills missing values', () => {
  for (const [n, e] of Object.entries(K.entities).filter(([,e]) => e.type === 'country')) {
    const c = economy.countries[n], a = c?.series.manufacturing?.[2023], b = c?.series.industry?.[2023];
    if (a != null && b > 0 && a >= 0 && a <= b) assert.ok(Math.abs(e.values.manufacturingInIndustry - a / b * 100) < 1e-10, n);
    else assert.equal(e.values.manufacturingInIndustry, undefined, n);
  }
  assert.equal(K.entities['미국'].values.manufacturingInIndustry, undefined);
});

test('1955 comparisons no longer authorize a 1970 identification', () => {
  const r = require('../data/exam-relations-population-change.json').relations;
  for (const a of r.filter(x => x.indicator === 'wup-share@1970')) assert.doesNotMatch(a.basis, /1955/);
  for (const [hi,lo] of [['미국','브라질'], ['미국','니제르'], ['브라질','니제르']])
    assert.ok(!K.relations.some(x => x.indicator === 'wup-share@1970' && x.hi === hi && x.lo === lo));
  samples('country-urban-change');
});

test('all 500 bloc questions require population and GDP together', () => {
  for (const q of samples('bloc-indicators')) {
    assert.deepEqual(new Set(q.shown), new Set(['bloc-pop','bloc-gdp']));
    assert.ok(E.identifiable(q.theme, q.entities, q.shown));
    for (const ind of q.shown) assert.equal(E.identifiable(q.theme, q.entities, [ind]), false, ind);
  }
});

test('industrial denominator exercises require multiplication and ask both truth directions', () => {
  let recipes = 0, products = 0; const truth = new Set();
  for (const q of samples('country-economy')) {
    if (!q.shown.includes('manufacturingInIndustry') || !q.shown.includes('industry')) continue;
    recipes++;
    for (const ind of q.shown) assert.equal(E.identifiable(q.theme, q.entities, [ind]), false);
    for (const s of q.stage2.statements.filter(s => s.check?.rate === 'manufacturingInIndustry')) {
      products++; truth.add(s.truth);
      const v = n => economy.countries[n].values.manufacturing;
      assert.equal(v(s.check.subject) > v(s.check.object), s.truth, s.text);
      // The conditional share alone would choose the opposite country.
      const rate = n => economy.countries[n].values.manufacturing / economy.countries[n].values.industry;
      assert.notEqual(rate(s.check.subject) > rate(s.check.object), s.truth);
    }
  }
  assert.ok(recipes >= 125 && recipes <= 300, 'recipe questions ' + recipes);
  assert.ok(products >= 50, 'product statements ' + products);
  assert.equal(truth.size, 2);
});

test('climate scales contain every month and retain readable ticks with Vostok', () => {
  let polar = 0;
  for (const q of samples('climate-graphs')) {
    const s = q.display.scale;
    assert.ok(s.pStep > 0 && s.pMax / s.pStep <= 5);
    assert.ok(s.plotHeight * s.tStep / (s.tMax - s.tMin) >= 30);
    for (const r of q.display.rows) {
      for (const t of r.temperature) assert.ok(t >= s.tMin && t <= s.tMax);
      for (const p of r.precipitation) assert.ok(p >= 0 && p <= s.pMax);
    }
    if (q.entities.includes('보스토크(남극)')) { polar++; assert.ok(s.plotHeight >= 240); }
  }
  assert.ok(polar > 20);
});

test('the actual climate renderer places labelled ticks on both axes', () => {
  const html = fs.readFileSync(root + '/exam.html', 'utf8');
  const script = html.slice(html.indexOf('function climateCharts('), html.indexOf('function table('));
  const node = (tag, props={}, kids=[]) => ({tag, props, kids: kids.slice(), append(...v) { this.kids.push(...v); }});
  const ctx = {el: node, svgEl(tag, props, parent, text) {const n=node(tag, props, text == null ? [] : [text]); if (parent) parent.append(n); return n;}};
  vm.runInNewContext(script, ctx);
  const q = E.build({themeId: 'climate-graphs', seed: 8}), tree = ctx.climateCharts(q, false), all=[];
  (function walk(n) {if (!n || typeof n !== 'object') return; all.push(n); n.kids.forEach(walk);})(tree);
  const svg = all.filter(n => n.tag === 'svg');
  assert.equal(svg.length, q.entities.length);
  for (const g of svg) {
    const labels = g.kids.filter(n => n.tag === 'text').map(n => n.kids.join(''));
    assert.ok(labels.includes('℃') && labels.includes('mm'));
    assert.ok(labels.includes(String(q.display.scale.pMax)));
    assert.ok(g.kids.some(n => n.props.class === 'pgrid'));
    assert.ok(g.kids.filter(n => n.props.class === 'axis').length > 5);
    const height = +g.props.viewBox.split(' ')[3]; assert.equal(height, q.display.scale.plotHeight + 42);
  }
});
