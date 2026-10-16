const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = require('../assets/rankings.js');
const get = id => R.rankings.find(r => r.id === id);
const order = id => get(id).items.map(i => i.name);

test('every ranking is sorted, cited, dated, and in a known group', () => {
  const groups = new Set(R.groups.map(g => g.id));
  const ids = new Set();
  for (const r of R.rankings) {
    assert.ok(!ids.has(r.id), r.id); ids.add(r.id);
    assert.ok(groups.has(r.group), r.id);
    for (const k of ['title', 'unit', 'year', 'source', 'phrase', 'low']) assert.ok(r[k], r.id + ' ' + k);
    assert.ok(r.items.length >= 2, r.id);
    for (let i = 1; i < r.items.length; i++) assert.ok(r.items[i - 1].value >= r.items[i].value, r.id + ' sorted');
    assert.equal(new Set(r.items.map(i => i.name)).size, r.items.length, r.id + ' duplicate item');
  }
});

test('bloc rankings cover all four blocs on every indicator', () => {
  for (const r of R.rankings.filter(x => x.group === 'bloc')) assert.deepEqual([...order(r.id)].sort(), ['ASEAN', 'EU', 'MERCOSUR', 'USMCA'], r.id);
  assert.deepEqual(order('bloc-pop'), ['ASEAN', 'USMCA', 'EU', 'MERCOSUR']);
  assert.equal(order('bloc-gdp')[0], 'USMCA');
  assert.equal(order('bloc-trade')[0], 'EU');
  assert.equal(order('bloc-members')[0], 'EU');
});

test('continent rankings use the six 평가원 continents and agree with lecture anchors', () => {
  for (const r of R.rankings.filter(x => x.group === 'continent')) assert.equal(r.items.length, 6, r.id);
  assert.equal(order('cont-pop')[0], '아시아');
  assert.ok(order('cont-pop').indexOf('유럽') < order('cont-pop').indexOf('라틴 아메리카'), 'Europe (with Russia) outnumbers Latin America');
  assert.equal(order('cont-density')[0], '아시아');
  assert.equal(order('cont-old')[0], '유럽');
  assert.equal(order('cont-nir')[0], '아프리카');
  const mig = Object.fromEntries(get('cont-netmig').items.map(i => [i.name, i.value]));
  for (const c of ['앵글로아메리카', '유럽', '오세아니아']) assert.ok(mig[c] > 0, c + ' net inflow');
  for (const c of ['라틴 아메리카', '아프리카', '아시아']) assert.ok(mig[c] < 0, c + ' net outflow');
});

test('production and religion rankings keep the well-known leaders', () => {
  assert.equal(order('coal-prod')[0], '중국');
  assert.equal(order('maize-prod')[0], '미국');
  assert.equal(order('wheat-prod')[0], '중국');
  assert.equal(order('cocoa-prod')[0], '코트디부아르');
  assert.equal(order('coffee-prod')[0], '브라질');
  assert.equal(order('elec-mix')[0], '석탄');
  assert.equal(order('primary-mix')[0], '석유');
  assert.deepEqual(order('religion-world').slice(0, 2), ['크리스트교', '이슬람교']);
  assert.ok(order('rice-cont')[0] === '아시아');
});

test('the rankings page parses and every quiz page links the other two', () => {
  const root = path.join(__dirname, '..');
  const page = fs.readFileSync(path.join(root, 'rankings.html'), 'utf8');
  for (const [, src] of page.matchAll(/<script src="([^"?]+)/g)) assert.ok(fs.existsSync(path.join(root, src)), src);
  const inline = [...page.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  assert.equal(inline.length, 1);
  new vm.Script(inline[0]);
  for (const f of ['classify.html', 'rankings.html', 'facts.html']) {
    const html = fs.readFileSync(path.join(root, f), 'utf8');
    for (const target of ['classify.html', 'rankings.html', 'facts.html']) assert.match(html, new RegExp('href="' + target.replace('.', '\\.') + '"'), f + ' → ' + target);
    assert.match(html, new RegExp('href="' + f.replace('.', '\\.') + '" aria-current="page"'), f + ' marks itself');
  }
});
