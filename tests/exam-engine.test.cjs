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
    assert.ok(['country', 'bloc', 'continent', 'site', 'crop', 'livestock', 'usState'].includes(e.type), name);
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
  // Agriculture rows about areas that are not 대상 (아메리카 as a whole) stay out with their reason.
  for (const x of K.outOfScope) assert.ok(x.status === 'excluded' && x.reason && x.basis && [x.hi, x.lo, x.entity].filter(Boolean).some(n => !K.entities[n]), JSON.stringify(x));
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
        assert.ok(t.indicators.concat(t.always || []).includes(d.rate) && t.indicators.concat(t.always || []).includes(d.total), t.id + ' derived amounts need both available columns; generated statements must show both');
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
      // Two 대상 still get three to five options, never a coin flip.
      if (q.entities.length === 2) assert.ok(n >= 3 && n <= 5, t.id + ' two-대상 options ' + n);
      else assert.equal(n, 5, t.id);
      assert.equal(new Set(q.stage1.options.map(o => o.join('|'))).size, n, t.id + ' duplicate assignment');
      assert.doesNotMatch(q.prompt, /[{}]/, t.id + ' unresolved prompt');
      assert.ok(['rows', 'columns', 'implicit', 'joint'].includes(q.format), t.id + ' format ' + q.format);
      if (t.map && q.format !== 'columns' && q.format !== 'joint') {
        // The 대상 and extra places are marked A~E, lettered west to east, at points inside them.
        // 실전형 has no options to narrow the pins, and a theme with mapExtras: 0 marks no extras,
        // so there only the 대상 are marked (an extra pin could fit a row as well).
        const m = q.stage1.markers;
        if (q.format === 'implicit' || t.mapExtras === 0) assert.equal(m.length, q.entities.length, t.id + ' markers ' + m.length);
        else assert.ok(m.length >= Math.min(4, t.pool.length) && m.length <= 5, t.id + ' markers ' + m.length);
        assert.deepEqual(m.map(x => x.letter), 'ABCDE'.slice(0, m.length).split(''), t.id);
        for (let i = 1; i < m.length; i++) assert.ok(m[i - 1].point[0] <= m[i].point[0], t.id + ' letters west to east');
        for (const e of q.entities) assert.ok(m.some(x => x.name === e), t.id + ' answer not on the map');
        for (const o of q.stage1.options) for (const name of o) assert.ok(m.some(x => x.name === name), t.id + ' option outside the map');
        assert.deepEqual(q.stage1.candidates, m.map(x => x.name).sort((a, b) => a.localeCompare(b, 'ko')));
        assert.match(q.mapPrompt, /지도에 표시된 A~[C-E]/, t.id);
        assert.doesNotMatch(q.mapPrompt, /[{}]/, t.id);
      }
      if (q.format === 'joint') {
        // 동시 식별: each option places the 대상 and names A~C; only the true pair survives.
        assert.ok(t.joint, t.id);
        assert.deepEqual(q.stage1.options[q.stage1.answer], q.entities.concat(q.hidden), t.id);
        assert.ok(engine.jointIdentifiable(t, q.entities, q.hidden), t.id + ' joint not identifiable');
        assert.deepEqual(engine.jointLeft(t, q.entities, q.hidden), [q.entities.concat(q.hidden)], t.id);
        assert.deepEqual(q.display.columns.filter(c => c.reveal).map(c => c.label), ['A', 'B', 'C'], t.id);
        assert.deepEqual(q.display.rows.map(r => r.label), q.labels, t.id + ' rows keep their symbols');
        for (const c of q.display.columns.filter(x => x.reveal)) assert.ok(q.prompt.includes(c.reveal), t.id + ' prompt lists ' + c.reveal);
        for (const n of q.entities) assert.ok(q.prompt.includes(n), t.id + ' prompt lists ' + n);
        // One wrong option swaps only the 대상, one only the columns.
        const k = q.entities.length, rowsOf = o => o.slice(0, k).join(), colsOf = o => o.slice(k).join();
        const wrong = q.stage1.options.filter((o, i) => i !== q.stage1.answer);
        assert.ok(wrong.some(o => colsOf(o) === q.hidden.join()) && wrong.some(o => rowsOf(o) === q.entities.join()), t.id + ' near options');
      } else if (q.format === 'columns') {
        // 항목 식별: the options assign the hidden columns; only the true one is consistent.
        assert.deepEqual(q.stage1.options[q.stage1.answer], q.hidden, t.id);
        assert.ok(engine.columnsIdentifiable(t, q.entities, q.hidden), t.id + ' columns not identifiable');
        assert.deepEqual(q.display.columns.filter(c => c.reveal).map(c => c.label), ['A', 'B', 'C'], t.id);
        assert.ok(!q.display.columns.some(c => c.reveal && q.prompt.indexOf(c.reveal) < 0), t.id + ' prompt lists the hidden names');
      } else {
        assert.deepEqual(q.stage1.options[q.stage1.answer], q.entities, t.id);
        assert.ok(engine.identifiable(t, q.entities, q.shown), t.id + ' not identifiable');
      }
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
        } else if (s.kind === 'graph') {
          const v = n => {
            const x = K.entities[n].climate, T = x.temperature;
            return {range: x.range, coldest: Math.min(...T), warmest: Math.max(...T), annual: x.annual, summer: x.summerShare}[c.metric];
          };
          assert.equal(v(c.subject) > v(c.object), s.truth, s.text);
        } else if (s.kind === 'place') {
          const x = n => K.entities[n].climate;
          if (c.place === 'hemisphere') assert.equal(x(c.entity).hemisphere === c.value, s.truth, s.text);
          else if (c.place === 'lat') assert.equal(Math.abs(x(c.subject).lat) > Math.abs(x(c.object).lat), s.truth, s.text);
          else assert.equal(x(c.subject).elevation > x(c.object).elevation, s.truth, s.text);
        } else if (s.kind === 'climate') {
          const x = K.entities[c.entity].climate;
          assert.ok(x.type, 'type <보기> only for verified sites: ' + c.entity);
          assert.equal(x.type === c.type, s.truth, s.text);
        } else if (s.kind === 'fact' && c.line) {
          const l = K.entities[c.entity].lines[c.line];
          assert.ok(!l.undecided, s.text);
          assert.equal(l.crosses, s.truth, s.text);
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
        } else if (s.kind === 'data' && c.majority) {
          // 도시화율 50%: the claim is made only 2%p or more away from it.
          const v = engine.value(c.entity, c.majority);
          assert.ok(q.shown.includes(c.majority) && Math.abs(v - 50) >= 2, s.text);
          assert.equal(v > 50 === c.claim, s.truth, s.text);
        } else if (s.kind === 'data' && c.from && c.entity) {
          const a = engine.value(c.entity, c.from), b = engine.value(c.entity, c.to);
          assert.ok(q.shown.includes(c.from) && q.shown.includes(c.to) && Math.abs(b - a) / a >= 0.05, s.text);
          assert.equal(b > a === c.up, s.truth, s.text);
        } else if (s.kind === 'data' && c.from) {
          // A change between two shown columns: difference, or growth (뒤 ÷ 앞).
          const ch = n => (c.ratio ? engine.value(n, c.to) / engine.value(n, c.from) : (engine.value(n, c.to) - engine.value(n, c.from)) * (c.drop ? -1 : 1));
          assert.ok(q.shown.includes(c.from) && q.shown.includes(c.to), s.text);
          assert.equal(ch(c.subject) > ch(c.object), s.truth, s.text);
        } else if (s.kind === 'data' && c.indicator) {
          assert.ok(q.shown.includes(c.indicator));
          assert.equal(engine.value(c.subject, c.indicator) > engine.value(c.object, c.indicator), s.truth, s.text);
        } else if (s.kind === 'data') {
          const amount = n => engine.value(n, c.total) * engine.value(n, c.rate) / c.per;
          assert.equal(amount(c.subject) > amount(c.object), s.truth, s.text);
          assert.notEqual(engine.value(c.subject, c.rate) > engine.value(c.object, c.rate), amount(c.subject) > amount(c.object), 'data items are rate-versus-total traps');
        } else if (s.kind === 'category') {
          // Facts about a religion itself, from the lecture whitelist; at least one side is hidden.
          const f = K.categoryFacts[t.composition].find(x => x.id === c.trait);
          assert.equal(f.status, 'active', s.text);
          if (f.kind === 'order') {
            assert.equal(f.order.indexOf(c.subject) < f.order.indexOf(c.object), s.truth, s.text);
            assert.ok(q.hidden.includes(c.subject) || q.hidden.includes(c.object), s.text);
          } else if (f.kind === 'claim') {
            assert.ok(q.hidden.includes(c.category), s.text);
            assert.ok(f.trueFor.includes(c.category) || f.falseFor.includes(c.category), s.text);
            assert.equal(f.trueFor.includes(c.category), s.truth, s.text);
          } else {
            assert.ok(q.hidden.includes(c.category), s.text);
            assert.equal(f.values[c.category] === c.value, s.truth, s.text);
          }
          for (const x of [c.subject, c.object, c.category].filter(Boolean)) {
            const j = q.hidden.indexOf(x);
            if (j >= 0) assert.ok(new RegExp('(^|[^A-Z])' + 'ABC'[j] + '(?![A-Z])').test(s.text), s.text);
          }
          for (const x of [c.subject, c.object, c.category]) if (q.hidden.includes(x)) assert.ok(!s.text.includes(engine.catLabel(t, x)), 'names a hidden column: ' + s.text);
        } else if (s.kind === 'climateClaim') {
          // A lecture statement about a verified climate type: true for its types, false for its contrasts.
          const k = K.climate.claims.find(x => x.id === c.claim), x = K.entities[c.entity].climate;
          assert.ok(x.type && x.type === c.type, s.text);
          assert.ok(k.falseFor.length && (k.trueFor.includes(c.type) || k.falseFor.includes(c.type)), s.text);
          assert.equal(k.trueFor.includes(c.type), s.truth, s.text);
        } else if (s.kind === 'concept') {
          // A concept-card statement keeps the card's truth; its 대상 appear as their labels.
          const k = K.concepts.find(x => x.id === c.concept);
          assert.ok(k && k.about.every(n => q.entities.includes(n)), s.text);
          assert.equal(s.truth, k.truth, s.text);
          if (q.format !== 'columns') for (const n of k.about) assert.ok(s.text.includes(q.labels[q.entities.indexOf(n)]) && !new RegExp('(^|[^가-힣])' + n + '(?![가-힣])').test(s.text.replace(/\([가-마]\)/g, '')), s.text);
        } else assert.fail('unknown kind ' + s.kind);
        if (s.kind === 'category') assert.match(s.text, /^[ABC]는 |^[가-힣]+(은|는) /, s.text);
        else assert.ok(s.text.startsWith(q.labels.find(l => s.text.startsWith(l)) || '?'), s.text);
        // A share × total <보기> calls a hidden column by its letter.
        if (q.hidden && t.kind === 'composition' && s.kind === 'data' && q.hidden.includes(c.category)) {
          assert.ok(s.text.includes(' ' + 'ABC'[q.hidden.indexOf(c.category)] + ' '), s.text);
          assert.ok(!s.text.includes(engine.catLabel(t, c.category)), 'names a hidden column: ' + s.text);
        }
        for (const label of s.text.match(/\([가-마]\)/g) || []) assert.ok(name(q, label), s.text);
        if (q.format === 'columns') assert.doesNotMatch(s.text, /\([가-마]\)/, '항목 식별 <보기> name the 대상: ' + s.text);
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
      // A two-period table (periodTable) is identified through its year columns on purpose.
      if (t.always && !t.periodTable && q.format !== 'columns') assert.ok(!engine.identifiable(t, q.entities, t.always), t.id + ' identified by ' + t.always);
      assert.ok(st.filter(s => s.kind === 'both').length <= 1, t.id + ' more than one 모두 statement');
      for (const s of st) {
        const c = s.check || {}, set = c.set || c.line || (c.ns ? 'hemisphere' : null);
        if (set) {
          assert.ok(!(t.reveals || []).includes(set), t.id + ' asks what the table shows: ' + s.text);
          if (f.facts) assert.ok(f.facts.includes(set), t.id + ' uses ' + set + ': ' + s.text);
        }
        if (c.ns) assert.ok(K.entities[c.entity].eqDist <= 25, 'hemisphere far from the equator: ' + c.entity);
        // A false claim names an option some country of the same region really has, or (a
        // falseFromOthers set) one another 대상 of the question holds.
        const heldHere = c.set && K.factSets[c.set] && K.factSets[c.set].falseFromOthers && q.entities.some(n => n !== c.entity && ((K.entities[n].facts[c.set] || {}).values || []).includes(c.value));
        if (s.kind === 'fact' && !s.truth && c.set) assert.ok(heldHere || holders[c.set + '|' + K.entities[c.entity].region + '|' + c.value], 'implausible: ' + c.entity + ' ' + s.text);
        if (s.kind === 'both' && !s.truth) assert.ok(holders[c.set + '|' + K.entities[c.b].region + '|' + c.value], 'implausible: ' + c.b + ' ' + s.text);
        assert.ok(!(s.kind === 'data' && c.indicator), 'a <보기> must not just compare two numbers the table shows: ' + s.text);
      }
      // A borrowed domain (대륙 theme's grain columns) is background, as in the engine.
      const own = s => !t.domains || !s.check.ind || (K.indicators[s.check.ind].domain || null) === t.domains[0];
      if (st.filter(s => own(s) && (['compare', 'sign', 'data', 'graph', 'climate', 'concept', 'category'].includes(s.kind) || (s.check.set && (f.focus || []).includes(s.check.set)))).length >= 2) withTheme++;
    }
    focusShare[t.id] = withTheme / SEEDS;
  }
  // Themes whose data support comparisons put at least two theme <보기> in most questions.
  // 상품 수출 구성 has only share × total traps and total-export comparisons of its own; its 0.6 came
  // partly from 광물 산지 statements that could only be true, removed on 2026-10-22.
  assert.ok(focusShare['export-composition'] >= 0.5, 'export-composition ' + focusShare['export-composition']);
  for (const id of ['bloc-indicators', 'continent-indicators', 'country-population', 'country-economy', 'religion-composition', 'electricity-mix', 'climate-graphs',
    'crop-identification', 'livestock-identification', 'country-agriculture', 'country-clues', 'country-urban-change', 'continent-urban-change']) assert.ok(focusShare[id] >= 0.6, id + ' ' + focusShare[id]);
  for (const e of Object.values(K.entities)) if (e.facts.latinLanguage) assert.equal(e.region, 'americas', e.name + ' latinLanguage');
});

test('fact <보기> come only from sets that can also make a false statement', () => {
  for (const t of engine.themes) for (let seed = 1; seed <= SEEDS; seed++) {
    for (const s of engine.build({themeId: t.id, seed}).stage2.statements) {
      if ((s.kind === 'fact' || s.kind === 'both') && s.check.set) assert.ok(K.factSets[s.check.set] && K.factSets[s.check.set].exclusive, t.id + ' true-only set ' + s.check.set + ': ' + s.text);
    }
  }
});

test('map letters sit inside the countries they mark', () => {
  const S = require('../assets/country-boundaries.js'), G = require('../assets/location-grading.js');
  const names = new Set(T.themes.filter(t => t.map && t.entityType === 'country').flatMap(t => t.pool));
  for (const n of names) {
    const e = K.entities[n];
    assert.ok(G.inPolygons({lon: e.label[0], lat: e.label[1]}, S.byName[n].polygons), n + ' label outside');
    assert.ok(e.frame[0] <= e.label[0] && e.label[0] <= e.frame[2] && e.frame[1] <= e.label[1] && e.label[1] <= e.frame[3], n + ' frame');
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

test('questions come in three formats and recent ones are not repeated', () => {
  const formats = {};
  for (const t of engine.themes) for (let seed = 1; seed <= 200; seed++) { const q = engine.build({themeId: t.id, seed}); formats[q.format] = (formats[q.format] || 0) + 1; }
  for (const f of ['rows', 'columns', 'implicit']) assert.ok(formats[f] > 100, f + ' ' + formats[f]);
  assert.ok(formats.joint > 20, 'joint ' + formats.joint);
  // With the last questions passed as avoid, a theme with enough combinations does not repeat within 20.
  for (const id of ['country-population', 'religion-composition', 'climate-graphs', 'electricity-mix']) {
    const recent = [];
    for (let i = 0; i < 20; i++) {
      const q = engine.build({themeId: id, seed: 5000 + i, avoid: recent});
      assert.ok(!recent.includes(q.signature), id + ' repeated ' + q.signature);
      recent.push(q.signature);
    }
  }
  // Particles follow how a name is read.
  assert.equal(E.topic('ASEAN'), '은');
  assert.equal(E.topic('EU'), '는');
});

test('the identification cue of each row names every known relation it takes part in', () => {
  for (const t of engine.themes.filter(x => x.kind === 'indicators')) for (let seed = 1; seed <= 40; seed++) {
    const q = engine.build({themeId: t.id, seed});
    if (!q || q.format === 'columns') continue;
    const k = engine.known(t, q.entities, q.shown);
    q.stage1.cues.filter(c => c.label !== '후보').forEach(c => {
      for (const x of k.relations) if (x.hi === c.name || x.lo === c.name)
        assert.ok(c.cue.includes(K.indicators[x.indicator].label) && c.cue.includes(c.name === x.hi ? x.lo : x.hi), t.id + ' ' + seed + ' ' + c.name + ': ' + x.indicator + ' ' + x.hi + '>' + x.lo);
    });
  }
});

test('table readings never settle the <보기> answer, and the options cannot be gamed by their shape', () => {
  const COMBOS = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3]];
  const parity = p => { let s = 0; for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) if (p[i] > p[j]) s++; return s % 2; };
  let cols = 0, colsHit = 0, rows = 0, oddHit = 0;
  for (const t of engine.themes) for (let seed = 1; seed <= 40; seed++) {
    const q = engine.build({themeId: t.id, seed});
    if (!q) continue;
    const st = q.stage2.statements;
    // Statements read straight from the table (kind 'data') need no identification.
    const left = COMBOS.filter(c => st.every((x, i) => x.kind !== 'data' || c.includes(i) === x.truth)).length;
    assert.ok(left > 1, t.id + ' ' + seed + ': the table alone settles the answer');
    const o = q.stage1.options, ans = q.stage1.answer;
    if (q.format === 'columns' && q.hidden.length === 3) {
      // Before 2026-10-23 the left-out ordering was always a 3-cycle, so parity halved the options.
      const idx = o.map(x => x.map(id => q.hidden.indexOf(id))), all = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
      const miss = all.find(p => !idx.some(x => x.join() === p.join())), keep = idx.map((x, i) => [x, i]).filter(([x]) => parity(x) === parity(miss)).map(([, i]) => i);
      cols++; colsHit += keep.includes(ans) ? 1 / keep.length : 0;
    } else if (q.format !== 'joint') {
      // The option agreeing least with the others, place by place.
      const sc = o.map((x, i) => o.reduce((a, y, j) => a + (j === i ? 0 : x.filter((v, k) => v === y[k]).length), 0)), lo = Math.min(...sc), L = sc.map((v, i) => (v === lo ? i : -1)).filter(i => i >= 0);
      rows++; oddHit += L.includes(ans) ? 1 / L.length : 0;
    }
  }
  assert.ok(colsHit / cols < 0.3, 'columns parity guess ' + (colsHit / cols).toFixed(2));
  assert.ok(oddHit / rows < 0.3, 'odd-one-out guess ' + (oddHit / rows).toFixed(2));
});
