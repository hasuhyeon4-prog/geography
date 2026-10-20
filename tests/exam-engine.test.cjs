const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const ROOT = path.join(__dirname, '..');
const K = require('../assets/entity-kb.js');
const T = require('../assets/exam-themes.js');
const E = require('../assets/exam-engine.js');
const C = require('../assets/classification-sets.js');
const engine = E.create(K, T);
const SEEDS = 150;

test('the committed knowledge base is what the builder produces from committed inputs', () => {
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'kb-')), 'entity-kb.js');
  execFileSync(process.execPath, [path.join(ROOT, 'scripts/build-entity-kb.cjs')], {env: {...process.env, KB_OUT: out}, stdio: 'pipe'});
  assert.equal(fs.readFileSync(out, 'utf8'), fs.readFileSync(path.join(ROOT, 'assets/entity-kb.js'), 'utf8'), 'run node scripts/build-entity-kb.cjs');
});

test('knowledge cards carry valid facts, units, years, and comparison margins', () => {
  for (const [name, e] of Object.entries(K.entities)) {
    assert.ok(['country', 'bloc', 'continent'].includes(e.type), name);
    for (const [set, f] of Object.entries(e.facts)) {
      const meta = K.factSets[set] || K.extraFacts[set];
      assert.ok(meta, name + ' ' + set);
      if (K.factSets[set]) for (const v of f.values) assert.ok(v in K.factSets[set].options, name + ' ' + set + ' ' + v);
    }
    for (const [ind, v] of Object.entries(e.values)) {
      assert.ok(K.indicators[ind], name + ' ' + ind);
      assert.equal(typeof v, 'number', name + ' ' + ind);
    }
  }
  for (const [id, m] of Object.entries(K.indicators)) {
    for (const k of ['label', 'unit', 'more', 'year', 'source', 'entityType']) assert.ok(m[k] !== undefined && m[k] !== '', id + ' ' + k);
    assert.ok(['ratio', 'diff'].includes(m.compare.type) && m.compare.min > 0, id);
  }
  assert.equal(K.entities['나이지리아'].ns, 'N');
  assert.equal(K.entities['오스트레일리아'].ns, 'S');
  assert.equal(K.entities['브라질'].ns, null, 'countries crossing the equator get no hemisphere statement');
});

test('every whitelisted relation carries a basis and a verdict with its reason', () => {
  for (const list of [K.relations, K.signs, K.orders]) {
    assert.ok(list.length > 0);
    for (const x of list) {
      assert.ok(x.basis && x.basis.length > 5, JSON.stringify(x));
      assert.ok(['active', 'belowMargin', 'reversed', 'conflict', 'excluded'].includes(x.status), JSON.stringify(x));
      if (x.status === 'active') assert.ok(x.years && x.n >= 1 && Number.isInteger(x.practice), JSON.stringify(x));
      else assert.ok(x.reason, JSON.stringify(x));
    }
  }
  for (const x of K.relations) assert.ok(K.indicators[x.indicator] && K.entities[x.hi] && K.entities[x.lo], x.indicator + ' ' + x.hi + ' ' + x.lo);
  for (const x of K.orders) assert.ok(x.order.every(c => K.compositions[x.composition].categories.some(k => k[0] === c)), x.entity);
  assert.equal(K.compositions.religion.total.year, K.compositions.religion.year, 'religion shares and totals come from the same year');
});

test('themes reference existing 대상, indicators, and compositions', () => {
  for (const t of T.themes) {
    for (const k of ['id', 'status', 'title', 'lecture', 'kind', 'entityType', 'pool', 'pick', 'prompt']) assert.ok(t[k], t.id + ' ' + k);
    assert.match(t.prompt, /\{range\}/, t.id + ' prompt must use {range} so 3- and 4-대상 questions read right');
    assert.ok(t.pick[0] >= 2 && t.pick[1] <= 4 && t.pick[0] <= t.pick[1], t.id + ' pick');
    for (const n of t.pool) assert.equal((K.entities[n] || {}).type, t.entityType, t.id + ' ' + n);
    if (t.kind === 'indicators') {
      for (const i of t.indicators.concat(t.always || [])) assert.equal(K.indicators[i].entityType, t.entityType, t.id + ' ' + i);
      for (const d of t.derived || []) {
        assert.ok(t.indicators.includes(d.rate) && t.indicators.concat(t.always || []).includes(d.total), t.id + ' derived amounts need both available columns; generated statements must show both');
        assert.ok(d.noun && [100, 1000].includes(d.per), t.id);
      }
    }
    if (t.kind === 'composition') {
      const c = K.compositions[t.composition];
      assert.ok(c, t.id);
      for (const id of t.show) assert.ok(c.categories.some(x => x[0] === id), t.id + ' ' + id);
    }
    if (t.kind === 'items') for (const n of t.pool) assert.ok(t.items[n] && t.items[n].length >= 2, t.id + ' ' + n);
  }
});

test('every ready theme builds full two-stage questions', () => {
  for (const t of engine.themes) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const q = engine.build({themeId: t.id, seed});
      assert.ok(q, t.id + ' seed ' + seed);
      const n = q.stage1.options.length;
      // Two 대상 are chosen among four named candidates: three to five options, never a coin flip.
      if (q.entities.length === 2) {
        assert.ok(n >= 3 && n <= 5, t.id + ' two-대상 options ' + n);
        assert.equal(q.stage1.candidates.length, 4, t.id);
        for (const o of q.stage1.options) for (const name of o) assert.ok(q.stage1.candidates.includes(name), t.id + ' option outside the candidates');
      } else assert.equal(n, 5, t.id);
      assert.equal(new Set(q.stage1.options.map(o => o.join('|'))).size, n, t.id + ' duplicate assignment');
      assert.doesNotMatch(q.prompt, /[{}]/, t.id + ' unresolved prompt');
      assert.deepEqual(q.stage1.options[q.stage1.answer], q.entities, t.id);
      assert.ok(engine.identifiable(t, q.entities, q.shown), t.id + ' not identifiable');
      const st = q.stage2.statements;
      assert.equal(st.length, 4);
      assert.equal(st.filter(s => s.truth).length, 2, t.id + ' exactly two true');
      const truePos = st.map((s, i) => (s.truth ? i : -1)).filter(i => i >= 0);
      assert.deepEqual(engine.COMBOS[q.stage2.answer], truePos, t.id + ' answer combination');
      const keys = st.flatMap(s => s.keys || [s.key]);
      assert.equal(new Set(keys).size, keys.length, t.id + ' two statements about one fact');
      for (const s of st) assert.ok(!/undefined|null|NaN/.test(s.text + s.explain), t.id + ' ' + s.text);
    }
  }
});

test('each statement is true exactly when the knowledge base says so', () => {
  const name = (q, label) => q.entities[q.labels.indexOf(label)];
  for (const t of engine.themes) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const q = engine.build({themeId: t.id, seed});
      for (const s of q.stage2.statements) {
        const c = s.check;
        assert.ok(c, s.text);
        if (s.kind === 'fact' && c.set) {
          assert.ok(!(t.reveals || []).includes(c.set), t.id + ' asks what the data shows: ' + s.text);
          assert.equal(K.entities[c.entity].facts[c.set].values.includes(c.value), s.truth, s.text);
        } else if (s.kind === 'fact') {
          assert.equal(K.entities[c.entity].ns === c.ns, s.truth, s.text);
        } else if (s.kind === 'both') {
          const fa = K.entities[c.a].facts[c.set].values, fb = K.entities[c.b].facts[c.set].values;
          assert.equal(fa.includes(c.value) && fb.includes(c.value), s.truth, s.text);
        } else if (s.kind === 'sign') {
          assert.ok(!q.shown.includes(c.ind), 'a direction the table shows is not background knowledge');
          const k = K.signs.find(x => x.indicator === c.ind && x.entity === c.entity);
          assert.equal(k && k.status, 'active', s.text);
          assert.equal(c.positive === k.positive, s.truth, s.text);
        } else if (s.kind === 'compare') {
          assert.ok(!q.shown.includes(c.ind), 'background comparison must not be readable from the data');
          const k = engine.relation(c.ind, c.subject, c.object);
          assert.equal(k && k.status, 'active', s.text);
          assert.equal(k.hi === c.subject, s.truth, s.text);
          assert.equal(engine.value(c.subject, c.ind) > engine.value(c.object, c.ind), s.truth, s.text);
        } else if (s.kind === 'data' && c.category) {
          const amount = n => engine.comp(t, n)[c.category] * engine.total(t, n);
          assert.equal(amount(c.subject) > amount(c.object), s.truth, s.text);
          assert.notEqual(engine.comp(t, c.subject)[c.category] > engine.comp(t, c.object)[c.category], amount(c.subject) > amount(c.object), 'data items are share-versus-total traps');
        } else if (s.kind === 'data' && c.indicator) {
          assert.ok(q.shown.includes(c.indicator));
          assert.equal(engine.value(c.subject, c.indicator) > engine.value(c.object, c.indicator), s.truth, s.text);
        } else if (s.kind === 'data') {
          const amount = n => engine.value(n, c.total) * engine.value(n, c.rate) / c.per;
          assert.equal(amount(c.subject) > amount(c.object), s.truth, s.text);
          assert.notEqual(engine.value(c.subject, c.rate) > engine.value(c.object, c.rate), amount(c.subject) > amount(c.object), 'data items are rate-versus-total traps');
        } else assert.fail('unknown kind ' + s.kind);
        assert.ok(s.text.startsWith(q.labels.find(l => s.text.startsWith(l)) || '?'), s.text);
        for (const label of s.text.match(/\([가-마]\)/g)) assert.ok(name(q, label), s.text);
      }
    }
  }
});

test('<보기> stay on the theme and avoid free distractors', () => {
  const holders = {};
  for (const e of Object.values(K.entities)) for (const [set, f] of Object.entries(e.facts || {})) for (const v of f.values) (holders[set + '|' + e.region + '|' + v] = true);
  const focusShare = {};
  for (const t of engine.themes) {
    let withTheme = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const q = engine.build({themeId: t.id, seed}), st = q.stage2.statements, f = t.followups || {};
      // The column shown on every question must not identify the 대상 by itself.
      if (t.always) assert.ok(!engine.identifiable(t, q.entities, t.always), t.id + ' identified by ' + t.always);
      assert.ok(st.filter(s => s.kind === 'both').length <= 1, t.id + ' more than one 모두 statement');
      for (const s of st) {
        const c = s.check || {}, set = c.set || (c.ns ? 'hemisphere' : null);
        if (set) {
          assert.ok(!(t.reveals || []).includes(set), t.id + ' asks what the table shows: ' + s.text);
          if (f.facts) assert.ok(f.facts.includes(set), t.id + ' uses ' + set + ': ' + s.text);
        }
        if (c.ns) assert.ok(K.entities[c.entity].eqDist <= 25, 'hemisphere far from the equator: ' + c.entity);
        // A false claim names an option some country of the same region really has.
        if (s.kind === 'fact' && !s.truth && c.set) assert.ok(holders[c.set + '|' + K.entities[c.entity].region + '|' + c.value], 'implausible: ' + c.entity + ' ' + s.text);
        if (s.kind === 'both' && !s.truth) assert.ok(holders[c.set + '|' + K.entities[c.b].region + '|' + c.value], 'implausible: ' + c.b + ' ' + s.text);
        assert.ok(!(s.kind === 'data' && c.indicator), 'a <보기> must not just compare two numbers the table shows: ' + s.text);
      }
      if (st.filter(s => ['compare', 'sign', 'data'].includes(s.kind) || (s.check.set && (f.focus || []).includes(s.check.set))).length >= 2) withTheme++;
    }
    focusShare[t.id] = withTheme / SEEDS;
  }
  // Themes whose data support comparisons put at least two theme <보기> in most questions.
  for (const id of ['bloc-indicators', 'continent-indicators', 'country-population', 'country-economy', 'export-composition', 'religion-composition']) assert.ok(focusShare[id] >= 0.6, id + ' ' + focusShare[id]);
  for (const e of Object.values(K.entities)) if (e.facts.latinLanguage) assert.equal(e.region, 'americas', e.name + ' latinLanguage');
});

test('questions are reproducible from a seed', () => {
  const a = engine.build({seed: 42}), b = engine.build({seed: 42});
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
});

test('the 기출형 page parses and all four quiz pages link each other', () => {
  const page = fs.readFileSync(path.join(ROOT, 'exam.html'), 'utf8');
  for (const [, src] of page.matchAll(/<script src="([^"?]+)/g)) assert.ok(fs.existsSync(path.join(ROOT, src)), src);
  const inline = [...page.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  assert.equal(inline.length, 1);
  new vm.Script(inline[0]);
  for (const f of ['classify.html', 'rankings.html', 'facts.html', 'exam.html']) {
    const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
    assert.match(html, /href="exam\.html"/, f);
  }
});
