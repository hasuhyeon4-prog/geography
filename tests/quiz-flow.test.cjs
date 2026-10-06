const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const script = [...html.matchAll(/<script>(.*?)<\/script>/gs)].map(m => m[1]).find(s => s.includes('function renderCard()'));
new vm.Script(script);
function source(name) {
  const start = script.indexOf('function ' + name + '(');
  assert.ok(start >= 0, name);
  const firstEnd = script.indexOf('\n', start);
  return script.slice(start, script.slice(start, firstEnd).endsWith('}') ? firstEnd : script.indexOf('\n}', start) + 2);
}
function fixture() {
  const nodes = new Map();
  function node() { return { dataset: {}, classList: { toggle() {} }, setAttribute() {}, replaceChildren() {}, append() {}, querySelector(selector) { return this[selector] ||= node(); } }; }
  const $ = id => { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); };
  const it = { id: 'test', referenceOnly: false, name: '시험 지명', country: '나라 단서', memo: '위치 설명 단서', quick: '추가 단서', notes: [], relations: [], facts: [['위치', '세부 단서']], featureKind: 'region', topic: 'region', continent: 'asia', geometry: {type: 'box', bbox: [0, 0, 10, 10]} };
  const context = {
    $, document: {createElement: node}, map: node(), current: () => it,
    byId: new Map([[it.id, it]]), items: [it], featureStyles: {region: {name: '지역'}}, continents: [{id: 'asia', name: '아시아'}],
    state: {selected: it.id, recall: true, quizType: 'location', revealed: false, queue: [it.id], index: 0, region: 'all', quizOrder: 'nearby', grade: null, manualGrade: false},
    known: new Set(), again: new Set(), reviewSchedule: {}, reviewIntervals: [1, 3, 7, 14, 30],
    riverFor: () => null, persist() { context.saves++; }, saves: 0, renderList() {}, showComplete() {}, toast() {},
    next() {}, renderMap() {}, fitLocationResult() {},
    window: {WGLocationGrading: require('../assets/location-grading.js')}, WGLocationGrading: require('../assets/location-grading.js')
  };
  vm.createContext(context);
  vm.runInContext(['dateKey','daysAfter','shortDate','isDue','readyToMaster','plannedReview','locationQuiz','resetAnswer','renderComparisons','renderCard','mark','advance','reveal'].map(source).join('\n'), context);
  vm.runInContext(script.split('\n').find(l => l.startsWith("$('locationOverride').onclick=")), context);
  return context;
}
test('name-to-location hides all content clues until the answer is revealed', () => {
  const c = fixture(); c.renderCard();
  assert.equal(c.$('itemName').textContent, '시험 지명');
  assert.equal(c.$('description').hidden, true);
  assert.equal(c.$('description').textContent, '');
  for (const id of ['keyFacts','riverFacts','details','extentNote','comparisonLinks','comparisonDetail']) assert.equal(c.$(id).hidden, true, id);
  c.state.guess = {lon: 5, lat: 5}; c.reveal();
  assert.equal(c.$('description').hidden, false);
  assert.match(c.$('description').textContent, /위치 설명 단서/);
  assert.equal(c.state.grade.status, 'correct');
  assert.equal(c.$('locationAutoControls').hidden, false);
  assert.equal(c.$('answerButtons').hidden, true);
  assert.equal(c.saves, 0);
});
test('automatic result records once when advancing', () => {
  const c = fixture(); c.state.guess = {lon: 5, lat: 5}; c.reveal(); c.advance(); c.advance();
  assert.equal(c.saves, 1);
  assert.equal(c.reviewSchedule.test.step, 1);
});
test('user corrections in either direction control the saved review result', () => {
  for (const [guess, initial, corrected, step] of [[{lon: 5, lat: 5}, 'correct', 'again', 0], [{lon: 50, lat: 50}, 'wrong', 'later', 1]]) {
    const c = fixture(); c.state.guess = guess; c.reveal();
    assert.equal(c.state.grade.status, initial);
    c.$('locationOverride').onclick();
    assert.equal(c.$('answerButtons').hidden, false);
    assert.equal(c.$('locationAutoControls').hidden, true);
    assert.equal(c.$('markAgain').querySelector('.answerLabel').textContent, '오답으로 수정');
    assert.equal(c.$('markLater').querySelector('.answerLabel').textContent, '정답으로 수정');
    c.mark(corrected);
    assert.equal(c.reviewSchedule.test.step, step);
    assert.equal(c.saves, 1);
  }
});
test('returning to study or name recall restores the appropriate description', () => {
  const c = fixture(); c.renderCard(); c.state.recall = false; c.renderCard();
  assert.equal(c.$('description').hidden, false);
  assert.match(c.$('description').textContent, /위치 설명 단서/);
  c.state.recall = true; c.state.quizType = 'name'; c.resetAnswer(); c.renderCard();
  assert.equal(c.$('description').hidden, false);
  assert.doesNotMatch(c.$('description').textContent, /위치 설명 단서/);
});
test('both mode menus remove description-to-location and migrate its saved setting', () => {
  for (const id of ['quizType','emptyQuizType']) {
    const select = html.match(new RegExp('<select id="' + id + '"[^>]*>(.*?)</select>', 's'))[1];
    assert.deepEqual([...select.matchAll(/value="([^"]+)"/g)].map(m => m[1]), ['name','location']);
  }
  const declaration = script.split('\n').find(l => l.startsWith('var state='));
  const context = {saved: {quizType: 'description'}, topics: [], regions: []};
  vm.createContext(context); vm.runInContext(declaration, context);
  assert.equal(context.state.quizType, 'location');
});
