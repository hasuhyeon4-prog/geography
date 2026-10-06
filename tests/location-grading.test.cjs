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
test('small countries and low-zoom taps are graded automatically against the displayed area', () => {
  const vatican = item('바티칸', 'country');
  assert.equal(grade(vatican, vatican.geometry.lon, vatican.geometry.lat, 1000).status, 'correct');
  assert.equal(grade(item('프랑스', 'country'), 4.8357, 45.764, 1000).status, 'correct');
  assert.equal(grade(item('프랑스', 'country'), 13.405, 52.52, 1000).status, 'wrong');
});
test('disputed regions follow the same displayed country boundary', () => {
  const guess = {lon: 77.5, lat: 35};
  const inside = grading.inPolygons(guess, countries.byName['인도'].polygons);
  assert.equal(grade(item('인도', 'country'), guess.lon, guess.lat).status, inside ? 'correct' : 'wrong');
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
test('point answers use geographic proximity independently of zoom', () => {
  const london = item('런던', 'city');
  assert.equal(grade(london, -0.1278, 51.5074).status, 'correct');
  assert.equal(grade(london, 2.3522, 48.8566).status, 'wrong');
  assert.equal(grade(london, -0.1278, 51.5074, 400).status, 'correct');
});
test('nearby reference cities never shrink the learning tolerance', () => {
  const target = { id: 'a', geometry: { type: 'point', lon: 0, lat: 0 }, topic: 'city', featureKind: 'city' };
  const neighbor = { id: 'b', geometry: { type: 'point', lon: 0.1, lat: 0 }, topic: 'city', featureKind: 'city' };
  assert.equal(grade(target, 0.1, 0, 1, [target, neighbor]).status, 'correct');
  assert.equal(grade(target, 0, 0.42, 1, [target, neighbor]).status, 'correct');
  assert.deepEqual(grade(target, 0, 0.42, 1, [target, neighbor]), grade(target, 0, 0.42));
  assert.equal(grade(target, 0, 0, 1, [target, neighbor]).status, 'correct');
});
test('Kandy accepts the reported 47 km miss without a neighbor-induced 12 km limit', () => {
  const kandy = item('캔디', 'city');
  const near = {id: 'nearby-reference', featureKind: 'city', geometry: {...kandy.geometry, lat: kandy.geometry.lat - 0.32}};
  const answer = grade(kandy, kandy.geometry.lon, kandy.geometry.lat + 0.42, 1, [kandy, near]);
  assert.equal(answer.distance, 47);
  assert.equal(answer.status, 'correct');
  assert.match(answer.reason, /80 km/);
});
test('tolerance adapts to the answer-time scale but never accepts distant guesses', () => {
  const target = {id: 'a', topic: 'city', featureKind: 'city', geometry: {type: 'point', lon: 0, lat: 0}};
  assert.equal(grade(target, 0, 1, 1).status, 'wrong');
  assert.equal(grade(target, 0, 1, 60).status, 'correct');
  assert.equal(grade(target, 0, 2, 10000).status, 'wrong');
  assert.equal(grade(target, 0, 0.5, NaN).status, 'correct');
  assert.equal(grade(target, 0, 0.5, -100).status, 'correct');
});
test('all point kinds and rivers accept ordinary tapping error', () => {
  for (const kind of ['city','peak','heritage','park','canal','strait','industry']) {
    const target = {id: kind, topic: 'place', featureKind: kind, geometry: {type: 'point', lon: 0, lat: 0}};
    assert.equal(grade(target, 0, 0.42).status, 'correct', kind);
    assert.equal(grade(target, 0, 4, 10000).status, 'wrong', kind);
  }
  const river = {id: 'r', topic: 'river', featureKind: 'river', geometry: {type: 'line', pts: [[0, 0], [0, 10]]}};
  assert.equal(grade(river, 0.42, 5).status, 'correct');
  assert.equal(grade(river, 3, 5, 10000).status, 'wrong');
});
test('rivers grade distance to any segment, not their midpoint', () => {
  const river = { id: 'r', topic: 'river', featureKind: 'river', geometry: { type: 'multiline', lines: [[[0, 0], [0, 10]], [[0, 10], [0, 20]]] } };
  assert.equal(grade(river, 0, 19).status, 'correct');
  assert.equal(grade(river, 10, 19).status, 'wrong');
  assert.equal(grade(river, 0, 19, 400).status, 'correct');
});
test('a crossing is on both river paths and receives an automatic result', () => {
  const a = { id: 'a', topic: 'river', featureKind: 'river', geometry: { type: 'line', pts: [[-1, 0], [1, 0]] } };
  const b = { id: 'b', topic: 'river', featureKind: 'river', geometry: { type: 'line', pts: [[0, -1], [0, 1]] } };
  assert.equal(grade(a, 0, 0, 1, [a, b]).status, 'correct');
});
test('real river source paths accept a well-zoomed path point', () => {
  const nile = item('나일강', 'river');
  const p = nile.geometry.lines[0][0];
  assert.equal(grade(nile, ...p).status, 'correct');
});
test('physical polygons include their entire drawn area', () => {
  const desert = { id: 'd', topic: 'land', featureKind: 'desert', geometry: { type: 'polygons', source: 'Natural Earth 1:10m', polygons: [[[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]] } };
  assert.equal(grade(desert, 5, 5).status, 'correct');
  assert.equal(grade(desert, 0.01, 5).status, 'correct');
  assert.equal(grade(desert, 30, 5).status, 'wrong');
});
test('representative points and schematic extents receive automatic grading', () => {
  for (const geometry of [{ type: 'point', lon: 0, lat: 0 }, { type: 'box', bbox: [-10, -10, 10, 10] }, { type: 'ellipse', lon: 0, lat: 0, rx: 10, ry: 10 }]) {
    assert.equal(grade({ id: 'x', topic: 'region', featureKind: 'industry', geometry }, 0, 0).status, 'correct');
  }
});
test('missing or invalid grading inputs fail closed', () => {
  assert.equal(grading.grade(item('런던', 'city'), { lon: NaN, lat: 0 }).status, 'uncertain');
  assert.equal(grading.grade(item('프랑스', 'country'), { lon: 2, lat: 47 }, {}).status, 'uncertain');
  assert.equal(grading.grade(item('런던', 'city'), null).status, 'wrong');
});
test('schematic polygons, boxes and ellipses grade their actual area, not only their anchor', () => {
  const cases = [
    [{ type: 'poly', pts: [[0, 0], [10, 0], [0, 10]], approximate: true }, [1, 8], [8, 8]],
    [{ type: 'polygons', polygons: [[[[0, 0], [10, 0], [0, 10]]]] }, [1, 8], [8, 8]],
    [{ type: 'box', bbox: [-10, -10, 10, 10] }, [9, 9], [11, 0]],
    [{ type: 'box', bbox: [170, -10, -170, 10] }, [-175, 0], [0, 0]],
    [{ type: 'ellipse', lon: 0, lat: 0, rx: 10, ry: 2 }, [9, 0], [9, 1.9]],
    [{ type: 'ellipse', lon: 0, lat: 0, rx: 10, ry: 2, rot: 45 }, [6, -6], [6, 6]]
  ];
  for (const [geometry, inside, outside] of cases) {
    const it = { id: 'range', topic: 'region', featureKind: 'industry', geometry };
    assert.equal(grade(it, ...inside, 500).status, 'correct', JSON.stringify(geometry));
    assert.equal(grade(it, ...outside, 500).status, 'wrong', JSON.stringify(geometry));
  }
});
test('drawn polygon edges and corners count, while holes stay outside', () => {
  const geometry = { type: 'polygons', polygons: [[[[0, 0], [10, 0], [10, 10], [0, 10]], [[4, 4], [6, 4], [6, 6], [4, 6]]]] };
  const it = { id: 'range', topic: 'land', featureKind: 'desert', geometry };
  for (const point of [[0, 5], [10, 5], [0, 0], [10, 10]]) assert.equal(grade(it, ...point).status, 'correct');
  assert.equal(grade(it, 5, 5).status, 'wrong');
  assert.equal(grade(it, 10.01, 5).status, 'wrong');
});
test('schematic lines and representative points have finite automatic acceptance ranges', () => {
  const line = { id: 'l', topic: 'mountain', featureKind: 'mountain', geometry: { type: 'line', pts: [[0, 0], [0, 10]] } };
  assert.equal(grade(line, 0.5, 5, 500).status, 'correct');
  assert.equal(grade(line, 3, 5, 500).status, 'wrong');
  const point = { id: 'p', topic: 'region', featureKind: 'industry', geometry: { type: 'point', lon: 0, lat: 0 } };
  assert.equal(grade(point, 0.5, 0, 500).status, 'correct');
  assert.equal(grade(point, 3, 0, 500).status, 'wrong');
});
test('every current non-coordinate item has automatic grading data', () => {
  const sectionTopics = { '국가 98': 'country', '도시 103': 'city', '자연지리 · 하천': 'river', '좌표 골격': 'coords' };
  const list = data.auditData.filter(it => !['국가 관계', '지명 → 국가·도시'].includes(it.section)).map(it => ({...it, topic: sectionTopics[it.section] || 'region', geometry: data.geometryData.items[it.id] || it.geometry})).concat(data.contentData.items);
  require('../assets/study-content.js').apply(list);
  for (const it of list.filter(it => it.topic !== 'coords')) {
    it.featureKind = it.mapKind || it.geometry.kind || it.topic;
    assert.notEqual(grade(it, 0, 0, 1000, list).status, 'uncertain', it.name);
  }
});
