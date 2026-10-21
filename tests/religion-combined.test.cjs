const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const C=require('../assets/classification-sets.js');
const S=require('../assets/country-boundaries.js');
const s=C.byId.religion;

test('one religion menu replaces separate source sets and migrates their saved selection',()=>{
 const ids=C.visibleSets().map(s=>s.id);
 assert.equal(ids.filter(id=>id==='religion').length,1);
 for(const id of ['christianity','islam','buddhism']){assert.ok(!ids.includes(id));assert.equal(C.resolveSetId(id),'religion');assert.ok(C.byId[id])}
 assert.equal(C.resolveSetId('minerals'),'minerals');
 assert.equal(C.resolveSetId('fossil'),'religion','a saved set that was removed opens the default set');
});
test('details follow the ranked religion, with exceptions kept out of detail grading',()=>{
 for(const [n,big,small] of [['브라질','christianity','catholic'],['미국','christianity','protestant'],['러시아','christianity','orthodox'],['이란','islam','shia'],['사우디아라비아','islam','sunni'],['중국','buddhism','mahayana'],['타이','buddhism','theravada'],['몽골','buddhism','tibetan']]){
  const p=C.religionProfile(n);assert.equal(p.religion,big,n);assert.equal(p.detail,small,n);assert.equal(p.detailRequired,true,n);
 }
 for(const n of ['독일','오만','에티오피아','대한민국','싱가포르','인도','이스라엘'])assert.equal(C.religionProfile(n).detailRequired,false,n);
 assert.equal(C.religionProfile('대한민국').religion,'christianity');
 assert.equal(C.religionProfile('대한민국').detail,null,'Buddhist cultural tradition is not the detail of Christianity');
 assert.equal(C.has(s,'대한민국','mahayana'),true,'the Buddhist tradition map still preserves its own scope');
 assert.equal(C.religionProfile('타이완').graded,false);
});
test('combined answers require both levels when a detail is known',()=>{
 assert.ok(C.isCorrect(s,'이란',{religion:'islam',detail:'shia'}));
 assert.ok(!C.isCorrect(s,'이란',{religion:'islam',detail:'sunni'}));
 assert.ok(!C.isCorrect(s,'이란',{religion:'buddhism',detail:'shia'}));
 assert.ok(!C.isCorrect(s,'이란',{religion:'islam'}));
 assert.ok(C.isCorrect(s,'독일',{religion:'christianity',detail:null}));
 assert.ok(C.isCorrect(s,'오만',{religion:'islam',detail:null}));
 assert.ok(!C.isCorrect(s,'타이완',{religion:'buddhism',detail:'mahayana'}));
});
test('painting details excludes mixed countries while broad painting still grades them',()=>{
 const names=Object.keys(S.byName);
 const g=C.gradePaint(s,'catholic',['필리핀','독일','스리랑카'],names,'all');
 assert.ok(g.correct.includes('필리핀'));
 assert.ok(g.excluded.includes('독일'));
 assert.ok(!g.missed.includes('독일')&&!g.wrong.includes('독일'));
 assert.ok(g.wrong.includes('스리랑카'));
 assert.ok(C.gradePaint(s,'christianity',['독일'],names,'all').correct.includes('독일'));
 assert.ok(C.has(s,'브라질','christianity')&&C.has(s,'브라질','catholic'));
 assert.equal(C.option(s,'shia').label,'시아파');
});

class Element{
 constructor(tag){this.tagName=tag;this.children=[];this.attributes={};this.style={};this.className=''}
 append(...items){this.children.push(...items.filter(x=>x!=null))}
 appendChild(x){this.append(x)}
 setAttribute(k,v){this.attributes[k]=v}
 get textContent(){return this.text||this.children.map(x=>typeof x==='string'?x:x.textContent).join(' ')}
 set textContent(x){this.text=x;this.children=[]}
}
const script=[...fs.readFileSync(require.resolve('../classify.html'),'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
function functionSource(name){
 const start=script.indexOf('function '+name+'(');assert.ok(start>=0,name);
 const firstEnd=script.indexOf('\n',start);
 return script.slice(start,script.slice(start,firstEnd).endsWith('}')?firstEnd:script.indexOf('\n}',start)+2);
}
function flow(name,oldHistory={}){
 const panel=new Element('div');panel.scrollTop=0;panel.scrollHeight=800;
 const c={C,store:{history:JSON.parse(JSON.stringify(oldHistory))},state:{setId:'religion',mode:'assign',queue:[name],index:0,answer:null,religionChoice:null,right:0,wrongNames:[],showNames:false},document:{createElement:tag=>new Element(tag),createTextNode:t=>t,addEventListener:(type,fn)=>{if(type==='keydown')c.keydown=fn}},$:()=>panel,save(){},renderAll(){},renderMap(){},focusQuestion(){},fitRegion(){},Set};
 vm.createContext(c);
 vm.runInContext(['set','history','wasMissed','el','optionLabel','color','swatch','label','religionText','renderReligionQuestion','recordPart','chooseReligion','chooseReligionDetail','answerWith','nextQuestion'].map(functionSource).join('\n'),c);
 c.label=n=>n;
 vm.runInContext(script.slice(script.indexOf("document.addEventListener('keydown'"),script.indexOf('\nvar lastSize=')),c);
 return {c,panel};
}
test('actual quiz asks broad religion first, then detail, recording the country once',()=>{
 const {c,panel}=flow('이란');
 c.renderReligionQuestion(panel,'이란');
 assert.match(panel.textContent,/1\. 신자 수 1위/);assert.doesNotMatch(panel.textContent,/시아파|수니파|이란/);
 c.chooseReligion('islam');c.chooseReligion('islam');
 assert.equal(c.state.answer,null);assert.equal(c.state.right,0);
 assert.equal(c.store.history.religion['이란'].right,1);
 panel.children=[];c.renderReligionQuestion(panel,'이란');
 assert.match(panel.textContent,/시아파/);assert.doesNotMatch(panel.textContent,/이란/);
 c.chooseReligionDetail('shia');c.chooseReligionDetail('shia');
 assert.equal(c.state.right,1);assert.equal(c.store.history.religionCombined_v1['이란'].right,1);
 assert.equal(c.store.history.islam['이란'].right,1);
 assert.equal(c.store.history.religion['이란'].right,1);
});
test('wrong broad/right detail and right broad/wrong detail both stay wrong overall',()=>{
 const a=flow('이란').c;a.chooseReligion('buddhism');a.chooseReligionDetail('shia');
 assert.equal(a.state.right,0);assert.equal(a.store.history.religion['이란'].last,false);assert.equal(a.store.history.islam['이란'].last,true);
 const b=flow('브라질').c;b.chooseReligion('christianity');b.chooseReligionDetail('protestant');
 assert.equal(b.state.right,0);assert.equal(b.store.history.christianity['브라질'].last,false);
});
test('mixed detail is automatically skipped without making the broad question ungraded',()=>{
 for(const [n,id] of [['독일','christianity'],['오만','islam'],['인도','hinduism']]){
  const {c,panel}=flow(n);c.chooseReligion(id);assert.equal(c.state.right,1,n);assert.ok(c.state.answer,n);
  c.renderReligionQuestion(panel,n);assert.match(panel.textContent,/이번 나라 정답/);
  c.nextQuestion();assert.equal(c.state.religionChoice,null,n);
 }
});
test('legacy misses seed combined review without merging old scores or discarding history',()=>{
 const old={religion:{이란:{right:2,wrong:0,last:true}},islam:{이란:{right:0,wrong:1,last:false}}};
 const {c}=flow('이란',old);
 assert.ok(c.wasMissed('이란',c.history()));
 assert.equal(c.history()['이란'],undefined);
 c.chooseReligion('islam');c.chooseReligionDetail('shia');
 assert.equal(c.store.history.religion['이란'].right,3);
 assert.equal(c.store.history.islam['이란'].wrong,1);
 assert.equal(c.store.history.islam['이란'].right,1);
 assert.equal(c.store.history.religionCombined_v1['이란'].right,1);
 assert.equal(c.wasMissed('이란',c.history()),false);
});
test('keyboard follows the active stage and can advance after a religion without detail',()=>{
 const event=key=>({key,target:{tagName:'DIV'},preventDefault(){}});
 const a=flow('이란').c;a.keydown(event('2'));assert.equal(a.state.answer,null);a.keydown(event('2'));assert.equal(a.state.right,1);a.keydown(event('Enter'));assert.equal(a.state.index,1);
 const b=flow('인도').c;b.keydown(event('4'));assert.equal(b.state.right,1);b.keydown(event('Enter'));assert.equal(b.state.index,1);
});
