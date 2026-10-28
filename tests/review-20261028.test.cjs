'use strict';
// Regressions for the 2026-10-27 review: wording cues, coin-flip items,
// boilerplate corrections, phone-width charts and held goals.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),M=require('../assets/materials-engine'),D=require('../assets/materials-data'),C=require('../assets/materials-charts'),E=M.create(D);
const ABS=/반드시|항상|모두|만으로|오직|예외 없이|관계없이|완전히|[가-힣]만 |[가-힣]만이|에만|만을/,HEDGE=/수 있다|단정|않는다|않다|구별|아니|살펴|연결/;
const active=E.families.filter(f=>!E.paused[f.id]);

test('OX truth cannot be guessed from absolute or hedged wording',()=>{
 const pairs=['data/lecture-goal-ox.tsv','data/goal-completion-ox.tsv'].flatMap(f=>fs.readFileSync(path.join(ROOT,f),'utf8').split(/\r?\n/)).filter(l=>l&&!l.startsWith('#')).map(l=>l.split('|'));
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
