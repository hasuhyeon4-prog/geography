// The 강의 표 page (concepts.html) asks only within one lecture table: a description belongs to
// the row the lecture gives it, so options must come from that table and the asked column must
// separate its rows.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const ROOT = path.join(__dirname, '..');
const T = require('../assets/concept-tables.js');

test('the committed asset is the build output of data/concepts', () => {
  execFileSync('node', [path.join(ROOT, 'scripts/build-concept-tables.cjs'), '--check'], {stdio: 'pipe'});
});

test('every table keeps its lecture cells, and an askable column separates all its rows', () => {
  const cards = {};
  for (const t of T.tables) {
    const card = cards[t.domain] || (cards[t.domain] = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/concepts', t.domain + '.json'), 'utf8')));
    assert.ok(t.rows.length >= 2 && t.columns.length >= 1, t.id);
    assert.match(t.lecture, /^[12]권 P\d\d$/, t.id);
    for (const c of t.columns) {
      const set = Object.entries(card.sets).find(([k, s]) => k.startsWith(t.block + '-') && s.label === c.label)[1];
      // Cells are the lecture's, except that lost line breaks get a separator back ('영향; 아마존').
      const bare = x => x.replace(/Af 바깥/g, '열대 우림 바깥').replace(/[;\s·]/g, '');
      t.rows.forEach((r, i) => assert.equal(c.cells[i] && bare(c.cells[i]), set.values[r] ? bare(set.values[r].join(' · ')) : null, t.id + ' ' + r));
      if (c.cells.some(x => x && /\n/.test(x))) assert.fail(t.id + ' raw line break in ' + c.label);
      if (c.askable) {
        assert.ok(c.cells.every(Boolean), t.id + ' ' + c.label);
        assert.equal(new Set(c.cells).size, c.cells.length, t.id + ' ' + c.label);
      }
    }
  }
  // A table is practised only with three or more rows of one kind and a column that separates them.
  for (const t of T.tables) if (!t.studyOnly) assert.ok(t.rows.length >= 3 && t.columns.some(c => c.askable), t.id);
  for (const t of T.tables) if (t.rows.length < 3) assert.ok(t.studyOnly, t.id + ' has two rows');
  assert.ok(T.tables.filter(t => !t.studyOnly).length >= 40, 'tables left to practise');
});

test('no row name, part or stem is left in what a question shows', () => {
  const page = fs.readFileSync(path.join(ROOT, 'concepts.html'), 'utf8');
  const src = page.match(/function mask\(text,t,own\)\{[\s\S]*?\n\}/)[0];
  const mask = new vm.Script('(' + src.replace('function mask', 'function') + ')').runInNewContext({});
  for (const t of T.tables) {
    if (t.studyOnly) continue;
    // Every part of a row's name that no other row shares (메카 of 메카·메디나, 쿠르드 of 쿠르드 분포권).
    const own = t.rows.map(r => r.split(/[·()/,\s]+/).concat([r]).filter(x => x.length >= 2 && t.rows.filter(o => o.includes(x)).length === 1));
    for (const c of t.columns.filter(x => x.askable)) c.cells.forEach((cell, i) => {
      const shown = [mask(cell, t, i), mask(cell, t, -1)];
      t.rows.forEach((r, j) => own[j].forEach(x => shown.forEach(v => assert.ok(!v.includes(x), `${t.id} ${c.label}: '${x}' in ${v}`))));
    });
  }
});

test('the page script parses and every page links to it', () => {
  const page = fs.readFileSync(path.join(ROOT, 'concepts.html'), 'utf8');
  new vm.Script([...page.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1]);
  for (const f of ['classify.html', 'rankings.html', 'facts.html', 'exam.html']) assert.match(fs.readFileSync(path.join(ROOT, f), 'utf8'), /href="concepts\.html"/, f);
});
