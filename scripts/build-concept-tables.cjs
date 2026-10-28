/* Build assets/concept-tables.js: the lecture comparison tables held in data/concepts/*.json.
 *
 * Usage: node scripts/build-concept-tables.cjs [--check]
 * Each concept-card set is one column (`<block>-cN`) or one row attribute (`<block>-rN`) of a
 * lecture table; grouping the sets by block gives the table back. Cells are copied as written.
 * A column whose cells are all present and all different is `askable`: the 강의 표 page asks
 * which row a cell belongs to only there, so every answer is the lecture table's own.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets/concept-tables.js');

// File → area name; the lecture order comes from the tables' own sections.
const DOMAINS = {
  oldmaps: '고지도', 'geographic-information': '지리 정보', climate: '기후', 'climate-processes': '기후 형성',
  landforms: '지형', 'landform-places': '지형 경관', religion: '종교', 'religion-practices': '종교 생활',
  'religion-places': '성지', culture: '생활 문화', conflicts: '갈등·분쟁', cities: '도시', 'city-functions': '도시 기능',
  energy: '에너지·자원', industry: '공업', environment: '환경',
};
// '2026_수능_14' → '2026학년도 수능 14번'; '2014_6_13' → '2014학년도 6월 13번'.
function examName(id) {
  const [y, s, n] = id.split('_');
  return y + '학년도 ' + (s === '수능' ? '수능' : s + '월') + (n ? ' ' + n + '번' : '');
}
const examOrder = id => { const [y, s, n] = id.split('_'); return [+y, s === '수능' ? 11 : +s, +n || 0]; };
const later = (a, b) => { const x = examOrder(a), y = examOrder(b); return y[0] - x[0] || y[1] - x[1] || y[2] - x[2]; };

// Lecture lines that lost their break in extraction ('영향아마존'): the separator is restored.
const CELL_FIX = [
  ['영향아마존', '영향; 아마존'], ['없음연교차', '없음; 연교차'], ['(스콜)용탈', '(스콜); 용탈'], ['이동남·동남아', '이동; 남·동남아'],
  ['많은 비연 강수량', '많은 비; 연 강수량'], ['교대Af 바깥 저위도\n', '교대; 열대 우림 바깥 저위도·'], ['뚜렷강수', '뚜렷; 강수'],
  ['집중호우벼농사', '집중호우; 벼농사'], ['키 큰 풀야생', '키 큰 풀; 야생'], ['대륙 동안동아시아', '대륙 동안; 동아시아'],
];
const fixCell = c => CELL_FIX.reduce((t, [a, b]) => t.split(a).join(b), c).replace(/\n/g, ' ');
// Review of 2026-10-22 (audit of every table): columns whose cells fit several rows, restate the
// row, or are editorial notes are shown in the table but never asked; tables whose rows are not
// comparable things are study-only. Tables with fewer than three rows are study-only as well,
// since a question there is a coin flip.
const NOT_ASKED = {
  'climate-processes:L1-B0308': ['대표 연결', '자료에서 보이는 흔적'], 'climate-processes:L1-B0316': ['판정 문장'],
  'climate:L1-B0390': ['식생', '생활', '공통'],
  'oldmaps:L1-B0162': ['대표 표현'], 'oldmaps:L1-B0169': ['첫 식별', '관련 배경지식'], 'oldmaps:L1-B0174': ['관련 배경지식'],
  'geographic-information:L1-B0201': ['헷갈리는 경계', '판정 질문'], 'geographic-information:L1-B0205': ['할 수 없는 일·대표 함정'],
  'landforms:L1-B0758': ['운반·퇴적 주체'], 'landforms:L1-B0855': ['시간적 연결', '형성 과정'], 'landforms:L1-B0859': ['형성 조건', '형태'],
  'religion:L1-B0961': ['기원지 기준'], 'religion:L1-B0995': ['주의'], 'religion-practices:L1-B1101': ['주의'], 'religion-practices:L1-B1107': ['시간 자료 처리'],
  'culture:L1-B1290': ['과잉 일반화 방지'], 'conflicts:L1-B1186': ['주된 판정'], 'conflicts:L1-B1188': ['구별할 쟁점'], 'conflicts:L1-B1212': ['국가 내 위치'],
  'cities:L1-B1706': ['함정 제거'], 'cities:L1-B1630': ['판정 포인트'], 'city-functions:L1-B1613': ['정의', '같지 않을 수 있는 것'],
  'city-functions:L1-B1637': ['예시적 관계'], 'city-functions:L1-B1641': ['관찰 지표', '주의'], 'energy:L2-B0452': ['대표 용도'],
  'energy:L2-B0324': ['지리적으로 연결되는 조건', '통계가 세는 것'], 'industry:L2-B0644': ['이어지는 설명'], 'industry:L2-B0649': ['성장 배경과 특징'],
};
const STUDY_ONLY = {
  'climate-processes:L1-B0305': '기압대 이동·반구·위도대가 섞여 같은 종류의 대상이 아님',
  'landforms:L1-B0702': '행이 동굴 속 위치이고 지형은 열에 있음',
  'landforms:L1-B0888': '지형·작용·하천 유형·이용이 섞여 같은 종류의 대상이 아님',
};
// What could give a row away inside a cell: its name and the parts of it ('메카·메디나' → 메카),
// and each part without its last syllable when three or more ('유대교' → 유대, '쿠르드족' → 쿠르드).
// A part every row shares ('…지도') tells nothing and is left alone.
function nameTokens(rows) {
  const parts = r => [...new Set([r, ...r.split(/[·()/,\s]+/)].map(x => x.trim()).filter(x => x.length >= 2))];
  const stems = r => parts(r).flatMap(p => (p.length >= 3 && /[가-힣]$/.test(p) ? [p, p.slice(0, -1)] : [p]));
  const all = rows.map(r => [...new Set(stems(r))]);
  return all.map(list => list.filter(t => all.filter(other => other.includes(t)).length < 2 || rows.length < 2).sort((a, b) => b.length - a.length));
}
const domains = [], tables = [];
for (const id of Object.keys(NOT_ASKED).concat(Object.keys(STUDY_ONLY))) if (!Object.keys(DOMAINS).includes(id.split(':')[0])) throw new Error('review names an unknown file: ' + id);
for (const [file, name] of Object.entries(DOMAINS)) {
  const card = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/concepts', file + '.json'), 'utf8'));
  const groups = new Map();
  for (const [key, set] of Object.entries(card.sets)) {
    const m = key.match(/^(.+)-[cr](\d+)$/);
    if (!m) continue;
    if (!groups.has(m[1])) groups.set(m[1], []);
    groups.get(m[1]).push([+m[2], set]);
  }
  let section = null;
  for (const [block, cols] of groups) {
    cols.sort((a, b) => a[0] - b[0]);
    const rows = [];
    for (const [, set] of cols) for (const n of Object.keys(set.values)) if (!rows.includes(n)) rows.push(n);
    if (rows.length < 2) continue;
    const src = Object.values(cols[0][1].evidence)[0][0].source;
    section = section || src.section;
    const exams = new Set();
    for (const n of rows) for (const id of ((card.entities[n] || {}).source || {}).priorAuditExamIds || []) exams.add(id);
    const id = file + ':' + block, skip = NOT_ASKED[id] || [];
    const columns = cols.map(([, set]) => {
      const cells = rows.map(n => (set.values[n] ? fixCell(set.values[n].join(' · ')) : null));
      return {label: set.label, cells, askable: cells.every(c => c) && new Set(cells).size === cells.length && !skip.includes(set.label)};
    });
    for (const label of skip) if (!columns.some(c => c.label === label)) throw new Error(id + ': no column ' + label);
    const study = STUDY_ONLY[id] || (rows.length < 3 ? '대상이 두 개뿐이라 고르기 문항이 되지 않음' : !columns.some(c => c.askable) ? '모든 행을 구별하는 열이 없음' : null);
    tables.push(Object.assign({id, domain: file, lecture: src.volume + '권 ' + src.section, block,
      rows, tokens: nameTokens(rows), columns, exams: [...exams].sort(later).map(examName)}, study ? {studyOnly: study} : {}));
  }
  if (section) domains.push({id: file, name, section});
}
// A table rebuilt for a lecture goal (data/lecture-goal-table-overrides.json) that holds every
// cell of a table here replaces it on the 강의 표 page, so the same cells are not asked twice.
// Its exam links move to the goal table.
const norm = s => String(s).replace(/\s/g, '');
const goalTables = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/lecture-goal-table-overrides.json'), 'utf8')).tables
  .map(g => ({id: g.id, cells: new Set(g.rows.flatMap(r => r.slice(1).filter(Boolean).map(c => norm(r[0]) + '|' + norm(c))))}));
const goalExams = {}, replaced = [];
for (let i = tables.length - 1; i >= 0; i--) {
  const t = tables[i], cells = t.rows.flatMap((r, k) => t.columns.filter(c => c.cells[k]).map(c => norm(r) + '|' + norm(c.cells[k])));
  const g = goalTables.find(g => cells.every(c => g.cells.has(c)));
  if (!g) continue;
  goalExams[g.id] = [...new Set((goalExams[g.id] || []).concat(t.exams))];
  replaced.push(t.id);
  tables.splice(i, 1);
}
for (let i = domains.length - 1; i >= 0; i--) if (!tables.some(t => t.domain === domains[i].id)) domains.splice(i, 1);
domains.sort((a, b) => a.section.localeCompare(b.section));
const order = Object.fromEntries(domains.map((d, i) => [d.id, i]));
tables.sort((a, b) => order[a.domain] - order[b.domain]);

const text = '/* Generated by scripts/build-concept-tables.cjs from data/concepts/*.json. Do not edit by hand. */\n' +
  "(function(root,data){if(typeof module==='object'&&module.exports)module.exports=data;else root.WGConceptTables=data})" +
  "(typeof globalThis!=='undefined'?globalThis:this," + JSON.stringify({domains, tables, goalExams}) + ');\n';
if (process.argv.includes('--check')) {
  if (fs.readFileSync(OUT, 'utf8') !== text) { console.error('assets/concept-tables.js differs from the build'); process.exit(1); }
} else fs.writeFileSync(OUT, text);
console.log('domains', domains.length, 'tables', tables.length, 'rows', tables.reduce((s, t) => s + t.rows.length, 0),
  'askable columns', tables.reduce((s, t) => s + t.columns.filter(c => c.askable).length, 0), 'study-only tables', tables.filter(t => t.studyOnly).length, 'replaced by goal tables', replaced.length);
const known = new Set(tables.map(t => t.id).concat(replaced));
for (const id of Object.keys(NOT_ASKED).concat(Object.keys(STUDY_ONLY))) if (!known.has(id)) throw new Error('review names an unknown table: ' + id);
