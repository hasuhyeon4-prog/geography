'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const data=require('../data/lecture-goal-table-overrides.json');
const goals=require('../data/lecture-gap-goals.json');
const G=require('../assets/goal-tables.js').create(data);
const forward=G.inventory('what','all'),reverse=G.inventory('which','all');
const all=forward.concat(reverse);
test('every lecture-table goal and every eligible column is reached by a real quiz',()=>{
 for(const g of goals.filter(x=>x.venue==='강의 표'))assert.ok(all.some(q=>q.t.goalIds.includes(g.id)),g.id);
 for(const t of G.tables)for(let j=0;j<t.columns.length;j++){
  if(t.skipQuizColumns.includes(t.columns[j].label))continue;
  assert.ok(all.some(q=>q.t.id===t.id&&q.col===j),t.id+' '+t.columns[j].label);
 }
 for(const q of all){assert.ok(q.custom.options.length>=2&&q.custom.options.length<=5,q.key);assert.equal(new Set(q.custom.options).size,q.custom.options.length);assert.ok(q.custom.options[q.custom.answer]);assert.ok(q.t.source.length);assert.ok(q.t.exams);}
 assert.equal(new Set(all.map(q=>q.key)).size,all.length,'stable question keys cannot collide');
});
test('answers reproduce the source cell and reverse answers include every duplicate',()=>{
 for(const q of forward.filter(q=>q.col!==undefined)){
  const t=data.tables.find(t=>t.id===q.t.id);assert.equal(q.custom.options[q.custom.answer],t.rows[q.row][q.col+1]);
 }
 for(const q of reverse.filter(q=>q.col!==undefined)){
  const t=data.tables.find(t=>t.id===q.t.id),value=t.rows[q.row][q.col+1];
  const expected=t.rows.filter(r=>r[q.col+1]===value).map(r=>r[0]).join(' · ');
  assert.equal(q.custom.options[q.custom.answer],expected,q.key);
 }
 const duplicate=reverse.find(q=>q.t.id==='goal-crust-change'&&q.custom.description==='소멸');
 assert.equal(duplicate.custom.options[duplicate.custom.answer],'해양–대륙 수렴 · 해양–해양 수렴');
 const common=reverse.find(q=>q.t.id==='goal-film-festivals'&&q.col===1);
 assert.ok(common);
});
test('transposed climate and political comparisons teach the intended objects',()=>{
 const rows=id=>G.tables.find(t=>t.id==='goal-table-'+id).rows;
 assert.deepEqual(rows('l1-b0343'),['BW 사막','BS 스텝']);
 assert.deepEqual(rows('l1-b0400'),['ET 툰드라','EF 빙설','H 고산']);
 assert.deepEqual(rows('l2-b0830'),['ASEAN','MERCOSUR']);
 assert.deepEqual(rows('l2-b1029'),['교토 의정서','파리 협정']);
 const period=all.filter(q=>q.key.startsWith('goal-relation|what|old-map-period-'));
 assert.equal(period.length,5);
 assert.ok(period.some(q=>q.custom.options[q.custom.answer]==='대명 혼일도가 먼저'));
});
test('added examples are actually answer targets and data vintages remain explicit',()=>{
 const targets=id=>G.tables.find(t=>t.id===id).rows;
 for(const name of ['아틀라스','캅카스','그레이트디바이딩','케이프'])assert.ok(targets('goal-mountain-groups').includes(name));
 for(const name of ['포스토이나','항순동','보홀','짱안','탐루앙','플리트비체','블루라군','타우포·로토루아'])assert.ok(targets('goal-field-trip-processes').includes(name));
 assert.equal(targets('goal-food-ingredients').length,10);
 assert.equal(targets('goal-environment-days').length,4);
 const membership=data.tables.find(t=>t.id==='goal-table-l2-b0830');
 assert.ok(membership.rows.some(r=>r[0]==='ASEAN'&&r.join(' ').includes('2025')));
 assert.ok(membership.rows.some(r=>r[0]==='MERCOSUR'&&r.join(' ').includes('2024')&&r.join(' ').includes('자격 정지')));
 assert.ok(data.questions.some(q=>q.id==='desert-cold-current-pair'));
 assert.ok(data.questions.some(q=>q.id==='coast-process-sequence'));
 assert.ok(data.questions.some(q=>q.id==='delta-process-category'));
});
test('generated table asset is reproducible offline',()=>{
 require('node:child_process').execFileSync(process.execPath,['scripts/build-goal-tables.cjs','--check'],{cwd:require('node:path').resolve(__dirname,'..')});
});
