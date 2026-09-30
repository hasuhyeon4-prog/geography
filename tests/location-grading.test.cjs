const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const grading = require('../assets/location-grading.js');
const countries = require('../assets/country-boundaries.js');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const data = Object.fromEntries(Array.from(html.matchAll(/<script id="([^"]+)" type="application\/json">(.*?)<\/script>/gs), m => [m[1], JSON.parse(m[2])]));
function item(name, topic, featureKind) {
  const raw = data.auditData.find(x => x.name === name && !['국가 관계', '지명 → 국가·도시'].includes(x.section)) || data.contentData.items.find(x => x.name === name);
  assert.ok(raw, name);
  return { ...raw, geometry: data.geometryData.items[raw.id] || raw.geometry, topic, featureKind: featureKind || topic };
}
function grade(it, lon, lat, precisionKm = 1, items = []) {
  return grading.grade(it, { lon, lat, precisionKm }, { countries, items });
}
test('139 country mappings have usable polygons and preserve anchor identity', () => {
  assert.equal(Object.keys(countries.byName).length, 139);
  const raw = data.auditData.filter(x => x.section === '국가 98').map(x => ({ ...x, geometry: data.geometryData.items[x.id] || x.geometry }));
  raw.push(...data.contentData.items.filter(x => x.topic === 'country'));
  for (const it of raw) assert.equal(grading.inPolygons(it.geometry, countries.byName[it.name].polygons), true, it.name);
});
test('country grading uses its area, not distance to the representative flag', () => {
  assert.equal(grade(item('프랑스', 'country'), 4.8357, 45.764).status, 'correct');
  assert.equal(grade(item('프랑스', 'country'), 13.405, 52.52).status, 'wrong');
  assert.equal(grade(item('러시아', 'country'), 129.7, 62).status, 'correct');
  assert.equal(grade(item('미국', 'country'), -147.7, 64.8).status, 'correct');
});
test('borders, small countries and low-zoom taps defer without recording a false result', () => {
  assert.equal(grade(item('프랑스', 'country'), 7.58, 47.59).status, 'uncertain');
  assert.equal(grade(item('바티칸', 'country'), 12.453418, 41.903323).status, 'uncertain');
  assert.equal(grade(item('프랑스', 'country'), 4.8357, 45.764, 1000).status, 'uncertain');
});
test('disputed territory defers for the nearby country', () => {
  assert.equal(grade(item('인도', 'country'), 77.5, 35).status, 'uncertain');
});
test('polygon holes exclude lakes or enclaves from the country interior', () => {
  const square = [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]], [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]]];
  assert.equal(grading.inPolygons({ lon: 2, lat: 2 }, [square]), true);
  assert.equal(grading.inPolygons({ lon: 5, lat: 5 }, [square]), false);
});
test('antimeridian rings accept either side of 180 but exclude Greenwich', () => {
  const poly = [[[[170, 10], [-170, 10], [-170, 20], [170, 20], [170, 10]]]];
  assert.equal(grading.inPolygons({ lon: 179, lat: 15 }, poly), true);
  assert.equal(grading.inPolygons({ lon: -179, lat: 15 }, poly), true);
  assert.equal(grading.inPolygons({ lon: 0, lat: 15 }, poly), false);
});
test('point answers require geographic proximity and enough zoom', () => {
  const london = item('런던', 'city');
  assert.equal(grade(london, -0.1278, 51.5074).status, 'correct');
  assert.equal(grade(london, 2.3522, 48.8566).status, 'wrong');
  assert.equal(grade(london, -0.1278, 51.5074, 400).status, 'uncertain');
});
test('a nearby different city cannot silently count as the target city', () => {
  const target = { id: 'a', geometry: { type: 'point', lon: 0, lat: 0 }, topic: 'city', featureKind: 'city' };
  const neighbor = { id: 'b', geometry: { type: 'point', lon: 0.1, lat: 0 }, topic: 'city', featureKind: 'city' };
  assert.notEqual(grade(target, 0.1, 0, 1, [target, neighbor]).status, 'correct');
  assert.equal(grade(target, 0, 0, 1, [target, neighbor]).status, 'correct');
});
test('rivers grade distance to any segment, not their midpoint', () => {
  const river = { id: 'r', topic: 'river', featureKind: 'river', geometry: { type: 'multiline', lines: [[[0, 0], [0, 10]], [[0, 10], [0, 20]]] } };
  assert.equal(grade(river, 0, 19).status, 'correct');
  assert.equal(grade(river, 10, 19).status, 'wrong');
  assert.equal(grade(river, 0, 19, 400).status, 'uncertain');
});
test('crossing rivers are ambiguous', () => {
  const a = { id: 'a', topic: 'river', featureKind: 'river', geometry: { type: 'line', pts: [[-1, 0], [1, 0]] } };
  const b = { id: 'b', topic: 'river', featureKind: 'river', geometry: { type: 'line', pts: [[0, -1], [0, 1]] } };
  assert.equal(grade(a, 0, 0, 1, [a, b]).status, 'uncertain');
});
test('real river source paths accept a well-zoomed path point', () => {
  const nile = item('나일강', 'river');
  const p = nile.geometry.lines[0][0];
  assert.equal(grade(nile, ...p).status, 'correct');
});
test('trusted physical polygons grade only their safe interior', () => {
  const desert = { id: 'd', topic: 'land', featureKind: 'desert', geometry: { type: 'polygons', source: 'Natural Earth 1:10m', polygons: [[[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]] } };
  assert.equal(grade(desert, 5, 5).status, 'correct');
  assert.equal(grade(desert, 0.01, 5).status, 'uncertain');
  assert.equal(grade(desert, 30, 5).status, 'wrong');
});
test('representative points and schematic extents do not imply precise coverage', () => {
  for (const geometry of [{ type: 'point', lon: 0, lat: 0 }, { type: 'box', bbox: [-10, -10, 10, 10] }, { type: 'ellipse', lon: 0, lat: 0, rx: 10, ry: 10 }]) {
    assert.equal(grade({ id: 'x', topic: 'region', featureKind: 'industry', geometry }, 0, 0).status, 'uncertain');
  }
});
test('missing or invalid grading inputs fail closed', () => {
  assert.equal(grading.grade(item('런던', 'city'), { lon: NaN, lat: 0 }).status, 'uncertain');
  assert.equal(grading.grade(item('프랑스', 'country'), { lon: 2, lat: 47 }, {}).status, 'uncertain');
  assert.equal(grading.grade(item('런던', 'city'), null).status, 'wrong');
});
