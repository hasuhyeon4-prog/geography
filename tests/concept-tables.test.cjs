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
      t.rows.forEach((r, i) => assert.equal(c.cells[i], set.values[r] ? set.values[r].join(' · ') : null, t.id + ' ' + r));
      if (c.askable) {
        assert.ok(c.cells.every(Boolean), t.id + ' ' + c.label);
        assert.equal(new Set(c.cells).size, c.cells.length, t.id + ' ' + c.label);
      }
    }
  }
  assert.ok(T.tables.every(t => t.columns.some(c => c.askable)), 'each table can be practised');
});

test('the page script parses and every page links to it', () => {
  const page = fs.readFileSync(path.join(ROOT, 'concepts.html'), 'utf8');
  new vm.Script([...page.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1]);
  for (const f of ['classify.html', 'rankings.html', 'facts.html', 'exam.html']) assert.match(fs.readFileSync(path.join(ROOT, f), 'utf8'), /href="concepts\.html"/, f);
});
