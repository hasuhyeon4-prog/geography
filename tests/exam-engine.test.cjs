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

test('themes reference existing 대상, indicators, and compositions', () => {
  for (const t of T.themes) {
    for (const k of ['id', 'status', 'title', 'lecture', 'kind', 'entityType', 'pool', 'pick', 'prompt']) assert.ok(t[k], t.id + ' ' + k);
    assert.match(t.prompt, /\{range\}/, t.id + ' prompt must use {range} so 3- and 4-대상 questions read right');
    if (t.totalFrom) assert.ok(K.indicators[t.totalFrom] && t.amountNoun, t.id + ' totalFrom needs an indicator and amountNoun');
    assert.ok(t.pick[0] >= 3 && t.pick[1] <= 4 && t.pick[0] <= t.pick[1], t.id + ' pick');
    for (const n of t.pool) assert.equal((K.entities[n] || {}).type, t.entityType, t.id + ' ' + n);
    if (t.kind === 'indicators') for (const i of t.indicators) assert.equal(K.indicators[i].entityType, t.entityType, t.id + ' ' + i);
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
      assert.equal(q.stage1.options.length, 5, t.id);
      assert.equal(new Set(q.stage1.options.map(o => o.join('|'))).size, 5, t.id + ' duplicate assignment');
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
          const v = engine.value(c.entity, c.ind);
          assert.ok(Math.abs(v) >= K.indicators[c.ind].sign.min, s.text);
          assert.equal(c.positive === v > 0, s.truth, s.text);
        } else if (s.kind === 'compare') {
          assert.ok(!q.shown.includes(c.ind), 'background comparison must not be readable from the data');
          assert.ok(engine.comparable(c.ind, c.subject, c.object), s.text);
          assert.equal(engine.value(c.subject, c.ind) > engine.value(c.object, c.ind), s.truth, s.text);
        } else if (s.kind === 'data') {
          const amount = n => engine.comp(t, n)[c.category] * engine.value(n, t.totalFrom);
          assert.equal(amount(c.subject) > amount(c.object), s.truth, s.text);
          assert.notEqual(engine.comp(t, c.subject)[c.category] > engine.comp(t, c.object)[c.category], amount(c.subject) > amount(c.object), 'data items are share-versus-total traps');
        } else assert.fail('unknown kind ' + s.kind);
        assert.ok(s.text.startsWith(q.labels.find(l => s.text.startsWith(l)) || '?'), s.text);
        for (const label of s.text.match(/\([가-마]\)/g)) assert.ok(name(q, label), s.text);
      }
    }
  }
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
