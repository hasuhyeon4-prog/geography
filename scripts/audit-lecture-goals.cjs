/* Status is evidence-based. Representative content is '구현', not automatically '검증'. */
'use strict';
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
const file=root+'/data/lecture-gap-goals.json',goals=JSON.parse(fs.readFileSync(file,'utf8'));
const F=require('../assets/lecture-goal-facts.js'),T=require('../assets/goal-tables-data.js'),M=require('../assets/materials-engine.js').create(require('../assets/materials-data.js'));
const implemented=new Map();
function add(id,evidence){if(!goals.some(g=>g.id===id))throw Error('Unknown goal '+id);if(!implemented.has(id))implemented.set(id,[]);implemented.get(id).push(evidence);}
for(const [id,items]of Object.entries(F.bindings))add(id,{venue:'OX',file:'assets/lecture-goal-facts.js',items});
for(const t of T.tables)for(const id of t.goalIds)add(id,{venue:'강의 표',table:t.id,file:'data/lecture-goal-table-overrides.json'});
// Goals with no practice route are held, never verified. The eight held on 2026-10-28,
// after their materials families were deleted, are covered by data/held-goal-ox.tsv.
const paused=new Map();
for(const f of M.families)for(const id of M.build(f.id,1).goalIds)add(id,{venue:'자료형·계산',family:f.id,file:'assets/materials-engine.js'});
for(const id of ['G001-2','G004-1','G062-2','G097-3','G135-3'])add(id,{venue:'기출형 <보기>',file:'assets/exam-engine.js',check:id==='G001-2'?'line':id==='G004-1'?'relativePosition':id==='G097-3'?'relativeProductivity':'inverseUrban'});
const runtime=JSON.parse(fs.readFileSync(root+'/audit/lecture-goals/runtime-evidence.json','utf8'));
for(const [id,counts] of Object.entries(runtime.existingExamGoals))if(counts.true&&counts.false)add(id,{venue:'기출형 <보기>',file:'assets/exam-engine.js',runtime:'audit/lecture-goals/runtime-evidence.json',counts});
const C=require('../assets/classification-sets.js');
for(const [id,set] of [['G050-1','languageBranch'],['G050-4','latinLanguage'],['G126-2','westAsiaLanguage'],['G106-1','schengen']])if(C.byId[set])add(id,{venue:'분류 지도',file:'assets/classification-sets.js',set});
const indexHtml=fs.readFileSync(root+'/index.html','utf8'),locationRows=JSON.parse(indexHtml.match(/<script id="auditData" type="application\/json">(.*?)<\/script>/s)[1]);
if(['몽블랑산','나로드나야산','에베레스트산'].every(n=>locationRows.some(x=>x.name===n&&x.geometry?.kind==='peak')))add('G027-5',{venue:'위치',file:'index.html',names:['몽블랑산','나로드나야산','에베레스트산']});
if(['멕시코','칠레','아르헨티나','브라질'].every(n=>runtime.examCoverage?.['export-composition']?.entities[n]))add('G132-1',{venue:'기출형 <보기>',file:'assets/exam-themes.js',theme:'export-composition',entities:runtime.examCoverage['export-composition'].entities});
const graphGoals=new Set(M.families.flatMap(f=>M.build(f.id,1).goalIds));
const held=JSON.parse(fs.readFileSync(root+'/data/lecture-goal-review-gaps.json','utf8')).gaps;
const browserFile=root+'/audit/lecture-goals/browser-qa-20261026.json',browserQA=fs.existsSync(browserFile)?JSON.parse(fs.readFileSync(browserFile,'utf8')):null;
// A binding is implementation evidence. Only separately reviewed completion
// criteria may promote a goal; adding one pair must not verify a compound goal.
const verification=JSON.parse(fs.readFileSync(root+'/data/goal-verification.json','utf8')),verified=new Set(verification.verifiedGoals);
for(const id of verified)if(held[id])throw Error('A partial goal cannot be verified: '+id);
const items=goals.map(g=>({id:g.id,group:g.group,venue:g.venue,status:implemented.has(g.id)?verified.has(g.id)?'검증':'구현':paused.has(g.id)?'보류':'미구현',evidence:implemented.get(g.id)||[],remaining:held[g.id]||(g.venue==='OX'?'대표 정오 쌍을 연결함. 복합 목표의 모든 사례·조건 충족은 아직 별도 검수 전.':implemented.has(g.id)?'연습 연결과 생성 검사는 통과. 복합 완료 기준의 별도 검토가 남음.':'자료와 화면 연결을 아직 구현하지 않음.')}));
for(const x of items)if(x.status==='검증')x.remaining='완료 기준의 계산·출제·범위 검사를 통과함.';
for(const x of items)if(x.status==='보류'){x.evidence=paused.get(x.id).map(p=>({venue:'자료형·계산(보류)',family:p.family,deleted:'2026-10-28'}));x.remaining='유일한 연습 경로였던 보류 자료형을 삭제함: '+paused.get(x.id).map(p=>p.family+' — '+p.reason).join('; ');}
if(process.argv.includes('--write-status')){
 for(const x of items){const g=goals.find(g=>g.id===x.id);g.status=x.status;}
 fs.writeFileSync(file,JSON.stringify(goals,null,1)+'\n');
}
const groups=[...new Set(goals.map(g=>g.group))].map(id=>{const gs=items.filter(g=>g.group===id),counts={미구현:0,구현:0,검증:0,보류:0};for(const g of gs)counts[g.status]++;return{id,total:gs.length,...counts,status:counts.검증===gs.length?'완료':counts.검증+counts.보류===gs.length?'보류 포함':counts.구현+counts.검증?'진행 중':'미구현'};});
const counts={미구현:0,구현:0,검증:0,보류:0};for(const g of items)counts[g.status]++;
const result={date:'2026-10-26',baseCommit:'2665750a5e174d25f7cb7945bcfc1f1d30e98cc0',continuationBase:'a406f99',reviewBase:'1c08ea9a35794f89534ea6b5bf79d0aeac82ca88',browserQA,goalCount:goals.length,groupCount:groups.length,statusCounts:counts,completeGroups:groups.filter(g=>g.status==='완료').map(g=>g.id),content:{newOX:F.items.length,representedOXGoals:Object.keys(F.bindings).length,rebuiltTables:T.tables.length,materialFamilies:M.families.length},verification:['tests/goal-completion.test.cjs','tests/lecture-goal-review.test.cjs','tests/lecture-goal-completion.test.cjs','tests/materials-remaining.test.cjs','tests/materials.test.cjs','tests/materials-continuation.test.cjs','tests/materials-page.test.cjs','tests/lecture-goal-integration.test.cjs','tests/lecture-goal-progress.test.cjs'],limitations:['문장·표의 단순 연결만으로 검증 처리하지 않으며 개별 완료 기준과 누락 조건의 검수 기록을 따른다. 외부 사실·통계 전체 재감사와 구별한다.','실제 Chromium 153에서 106개 자료형을 390·810·1280px 화면으로 열어 두 단계 채점·다음 문항을 검사했다. 브라우저 동작 확인은 개별 목표의 내용 완료와 별개이다.','G127-2·G137-3: WDI GDP 기준 산업 비중 합계는 세금·보조금 등의 차이로 100이 아닐 수 있음. 원자료를 100에서 바로 빼거나 조용히 재정규화하지 않음.'],groups,items};
const target=root+'/audit/lecture-goals';fs.mkdirSync(target,{recursive:true});fs.writeFileSync(target+'/progress.json',JSON.stringify(result,null,1)+'\n');
let md='# 하위 학습 목표 구현 상태\n\n기준 계획: `2665750` · 후속 구현 기준: `a406f99` · 2026-10-26\n\n';
md+='현재 **검증 '+counts.검증+'개 · 보류 '+counts.보류+'개 · 구현 '+counts.구현+'개 · 미구현 '+counts.미구현+'개**다. `보류`는 유일한 연습 경로인 자료형이 출제 풀에서 빠진 목표다. `구현`은 연습 화면에 내용이 연결되었다는 뜻이며 완료 기준 전부를 확인한 상태는 아니다. 모든 하위 목표가 `검증`인 묶음만 완료다.\n\n';
md+='- 새 OX '+F.items.length+'문장: 기존 `facts.html`에 연결. 기존 217개 ID·정답·학습 기록은 유지.\n- `materials.html`: '+M.families.length+'개 자료형·계산 주제, 식별 후 <보기> 판단, 틀린 문항 다시 풀기.\n- `concepts.html`: 재구성 비교표 '+T.tables.length+'개. 겹치는 지각 변화는 모든 대상을 묶은 답으로 처리.\n- `exam.html`: 위도선 통과·지도 대표점 비교·상대 생산성·도시화 역산 연결.\n\n';
md+='현재 완료 묶음('+result.completeGroups.length+'개): '+result.completeGroups.join(', ')+'.\n\n'+(groups.some(g=>g.status==='보류 포함')?'보류 목표가 있어 완료가 아닌 묶음: '+groups.filter(g=>g.status==='보류 포함').map(g=>g.id).join(', ')+'.\n\n':'');
md+='## 검증 범위\n\n관측소 누적 차분·편차 복원, 태양 계산, 부양비 역산, 시작 비중 가중 증가율, GIS 원문 예시와 동점·가중치, 허용 범위와 정오 양방향 생성을 검사한다. 실제 Chromium 153에서 106개 자료형×390·810·1280px의 312회 두 단계 채점·다음 문항 전환을 검사했다. 세 화면 폭에서 문서 넘침·요청 실패·스크립트 오류를 확인하고 그래프 글자 경계를 검사했다. DOM 검사에서는 중복 채점·재방문 복습도 확인한다. 상세 결과는 `audit/lecture-goals/browser-qa-20261026.json`이다.\n\n';
md+='## 부분 구현의 남은 조건\n\n';for(const [id,note]of Object.entries(held))md+='- '+id+': '+note+'\n';
md+='\nOX 목표는 개별 내용 검토를 기록한 경우에만 `검증`으로 올리고 그렇지 않으면 `구현`으로 둔다. 강의의 사실 자체를 외부 자료로 재검증한 것은 아니다.\n\n';
md+='## 2026-10-26 보완 결과\n\n초기 검수의 185개 잔여 조건을 보완했다. 원래 부족했던 조건과 보완 증거는 `data/goal-completion-review-20261026.json`, 실제 정오 도달·계산·기준 연도 검사와 그림 검사는 `tests/goal-completion.test.cjs`에 기록한다. OX를 추가하고 지정된 기존 기출형 경로를 연결했으며, 원래 1955·2015년 부양비와 2018년 수도 인구 자료, 빠진 관측소·사진·그림 선택을 복원했다. 산업 비중의 복원 자료는 세 산업 부가가치 합=100으로 명시한다. 고정 연도 통계는 제시된 범위에서만 사용하며 역사적 회상 비교로 확장하지 않는다. 2025년 석탄 끝점은 미국 EIA와 중국 국가통계국의 별도 출처·단위·잠정 여부를 표시했다. 바마코는 경계 부근의 쾨펜 유형을 검증으로 올리지 않고 계절성 자료로만 사용한다.\n\n';
md+='## 목표별 연결\n\n| 목표 | 상태 | 연결 | 남은 조건 |\n|---|---|---|---|\n';
for(const x of items)if(x.evidence.length)md+='| '+x.id+' | '+x.status+' | '+x.evidence.map(e=>e.family||e.table||e.venue).join(', ')+' | '+x.remaining.replace(/\|/g,'/')+' |\n';
fs.writeFileSync(root+'/docs/LECTURE-GAP-IMPLEMENTATION.md',md);
console.log(JSON.stringify({counts,active:implemented.size,completeGroups:result.completeGroups}));
