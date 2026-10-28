'use strict';
// Regressions for the 2026-10-27 review: wording cues, coin-flip items,
// boilerplate corrections, phone-width charts and held goals.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),M=require('../assets/materials-engine'),D=require('../assets/materials-data'),C=require('../assets/materials-charts'),E=M.create(D);
const ABS=/반드시|항상|모두|만으로|오직|예외 없이|관계없이|완전히|[가-힣]만 |[가-힣]만이|에만|만을/,HEDGE=/수 있다|단정|않는다|않다|구별|아니|살펴|연결/;
const active=E.families.filter(f=>!E.paused[f.id]);

test('OX truth cannot be guessed from absolute or hedged wording',()=>{
 const pairs=['data/lecture-goal-ox.tsv','data/goal-completion-ox.tsv','data/lecture-coverage-ox.tsv'].flatMap(f=>fs.readFileSync(path.join(ROOT,f),'utf8').split(/\r?\n/)).filter(l=>l&&!l.startsWith('#')).map(l=>l.split('|'));
 assert.ok(pairs.length>500);
 const guess=s=>ABS.test(s)&&!HEDGE.test(s)?false:true;
 const right=pairs.reduce((n,[,yes,no])=>n+(guess(yes)===true)+(guess(no)===false),0);
 assert.ok(right/(2*pairs.length)<=.55,'wording rule guesses '+(100*right/(2*pairs.length)).toFixed(1)+'%');
 for(const re of [ABS,HEDGE]){const o=pairs.filter(p=>re.test(p[1])).length,x=pairs.filter(p=>re.test(p[2])).length;assert.ok(Math.abs(o-x)<=pairs.length*.05,re+' O '+o+' X '+x);}
});

test('material statements keep cue words on both sides and corrections are item-specific',()=>{
 const cue={};
 for(const f of active)for(let seed=1;seed<=30;seed++){
  const x=E.exam(E.build(f.id,seed));
  assert.ok(x.stage.options.length>2,f.id+' is a coin flip');
  assert.doesNotMatch(x.stage.explain||'',/분포·계절성·구성으로 대상을 식별/,f.id);
  for(const s of x.stage.statements||[]){
   for(const w of ['반드시','항상','관계없이']){if(s.text.includes(w)){cue[w]=cue[w]||[0,0];cue[w][s.truth?0:1]++;}}
   assert.doesNotMatch(s.text,/복원한 값|다윈는|양곤는|웰링턴는|가옥은 [가-힣]/,f.id);
   assert.doesNotMatch(s.text,/[가-힣]{2}(?:합계|수|인구|가치|부양비)이 (?:크|작)다/,f.id+' '+s.text);
   if(s.check.op==='examComparison')assert.match(s.explain,/계산값/,f.id);
  }
 }
 for(const [w,[t,f]] of Object.entries(cue))assert.ok(t>=f*.4,w+' true '+t+' false '+f);
});

test('the labels of two-candidate items vary, so (가) is not always the same country',()=>{
 for(const id of ['energy-change','population-area','fossil-denominators','grain-size']){
  const first=new Set();for(let seed=1;seed<=20;seed++)first.add(E.exam(E.build(id,seed)).identification[0]);
  assert.ok(first.size>1,id);
 }
});

test('phone charts scale text instead of forcing a 640px drawing',()=>{
 assert.doesNotMatch(fs.readFileSync(path.join(ROOT,'assets/materials.css'),'utf8'),/\.figure svg\{[^}]*min-width:640px/);
 const f=E.exam(E.build('cumulative',1)).figures[0],plain=C.render(f),big=C.render(f,{textScale:1.6});
 const size=s=>Math.max(...[...s.matchAll(/font-size="([\d.]+)"/g)].map(m=>+m[1]));
 assert.ok(size(big)>size(plain)*1.5);assert.equal(C.render(f),plain,'desktop rendering is unchanged after a scaled render');
 for(const m of big.matchAll(/<text x="([\d.-]+)" y="([\d.-]+)"/g)){assert.ok(+m[1]>=0&&+m[1]<=700);assert.ok(+m[2]>=0&&+m[2]<=480);}
});

test('a goal reachable only through a paused family is held, never verified',()=>{
 const goals=require('../data/lecture-gap-goals.json'),progress=require('../audit/lecture-goals/progress.json');
 const held=goals.filter(g=>g.status==='보류').map(g=>g.id).sort();
 assert.deepEqual(held,['G022-2','G037-4','G041-2','G044-2','G058-3','G075-2','G087-3','G112-5']);
 for(const id of held)assert.notEqual(progress.groups.find(g=>g.id===id.split('-')[0]).status,'완료',id);
});

test('lecture-coverage pairs bind to OX goals and lecture blocks, with balanced cues of their own',()=>{
 const goals=new Map(JSON.parse(fs.readFileSync(path.join(ROOT,'data/lecture-gap-goals.json'),'utf8')).map(g=>[g.id,g]));
 const pairs=fs.readFileSync(path.join(ROOT,'data/lecture-coverage-ox.tsv'),'utf8').split(/\r?\n/).filter(l=>l&&!l.startsWith('#')).map(l=>l.split('|'));
 assert.ok(pairs.length>=200);
 for(const p of pairs){assert.equal(p.length,4,p.join('|'));assert.equal(goals.get(p[0])?.venue,'OX',p[0]);assert.match(p[3],/^L[12]-B\d{4}$/);assert.notEqual(p[1],p[2]);}
 const F=require('../assets/lecture-goal-facts.js'),src=new Set(F.items.map(q=>q.source));
 for(const p of pairs)assert.ok(src.has('강의 '+p[3]+' · '+p[0])||F.bindings[p[0]],p[3]);
 for(const re of [ABS,HEDGE]){const o=pairs.filter(p=>re.test(p[1])).length,x=pairs.filter(p=>re.test(p[2])).length;assert.ok(Math.abs(o-x)<=pairs.length*.05,re+' O '+o+' X '+x);}
});

test('강의 표 asks no coin flips and no table twice',()=>{
 const T=require('../assets/concept-tables.js'),D=require('../assets/goal-tables-data.js'),G=require('../assets/goal-tables.js').create(D);
 const all=[...G.inventory('which','all'),...G.inventory('what','all')];
 for(const q of all){assert.ok(q.custom.options.length>=3,q.key);assert.equal(new Set(q.custom.options).size,q.custom.options.length,q.key);}
 const norm=s=>String(s).replace(/\s/g,''),goal=D.tables.map(g=>new Set(g.rows.flatMap(r=>r.slice(1).filter(Boolean).map(c=>norm(r[0])+'|'+norm(c)))));
 for(const t of T.tables){const cells=t.rows.flatMap((r,k)=>t.columns.filter(c=>c.cells[k]).map(c=>norm(r)+'|'+norm(c.cells[k])));assert.ok(!goal.some(g=>cells.every(c=>g.has(c))),t.id+' repeats a goal table');}
 const asked=new Set(all.flatMap(q=>q.t.goalIds||[]));for(const t of D.tables)for(const id of t.goalIds)assert.ok(asked.has(id),id+' lost its 강의 표 questions');
 assert.ok(Object.keys(T.goalExams).length>=20);
});
