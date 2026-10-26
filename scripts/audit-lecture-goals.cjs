/* Status is evidence-based. Representative content is '구현', not automatically '검증'. */
'use strict';
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
const file=root+'/data/lecture-gap-goals.json',goals=JSON.parse(fs.readFileSync(file,'utf8'));
const F=require('../assets/lecture-goal-facts.js'),T=require('../assets/goal-tables-data.js'),M=require('../assets/materials-engine.js').create(require('../assets/materials-data.js'));
const implemented=new Map();
function add(id,evidence){if(!goals.some(g=>g.id===id))throw Error('Unknown goal '+id);if(!implemented.has(id))implemented.set(id,[]);implemented.get(id).push(evidence);}
for(const [id,items]of Object.entries(F.bindings))add(id,{venue:'OX',file:'assets/lecture-goal-facts.js',items});
for(const t of T.tables)for(const id of t.goalIds)add(id,{venue:'강의 표',table:t.id,file:'data/lecture-goal-table-overrides.json'});
for(const f of M.families)for(const id of M.build(f.id,1).goalIds)add(id,{venue:'자료형·계산',family:f.id,file:'assets/materials-engine.js'});
for(const id of ['G001-2','G004-1','G062-2','G097-3','G135-3'])add(id,{venue:'기출형 <보기>',file:'assets/exam-engine.js',check:id==='G001-2'?'line':id==='G004-1'?'relativePosition':id==='G097-3'?'relativeProductivity':'inverseUrban'});
const runtime=JSON.parse(fs.readFileSync(root+'/audit/lecture-goals/runtime-evidence.json','utf8'));
for(const [id,counts] of Object.entries(runtime.existingExamGoals))if(counts.true&&counts.false)add(id,{venue:'기출형 <보기>',file:'assets/exam-engine.js',runtime:'audit/lecture-goals/runtime-evidence.json',counts});
const C=require('../assets/classification-sets.js');
for(const [id,set] of [['G050-1','languageBranch'],['G050-4','latinLanguage'],['G126-2','westAsiaLanguage']])if(C.byId[set])add(id,{venue:'분류 지도',file:'assets/classification-sets.js',set});
const indexHtml=fs.readFileSync(root+'/index.html','utf8'),locationRows=JSON.parse(indexHtml.match(/<script id="auditData" type="application\/json">(.*?)<\/script>/s)[1]);
if(['몽블랑산','나로드나야산','에베레스트산'].every(n=>locationRows.some(x=>x.name===n&&x.geometry?.kind==='peak')))add('G027-5',{venue:'위치',file:'index.html',names:['몽블랑산','나로드나야산','에베레스트산']});
if(['멕시코','칠레','아르헨티나','브라질'].every(n=>runtime.examCoverage?.['export-composition']?.entities[n]))add('G132-1',{venue:'기출형 <보기>',file:'assets/exam-themes.js',theme:'export-composition',entities:runtime.examCoverage['export-composition'].entities});
const graphGoals=new Set(M.families.flatMap(f=>M.build(f.id,1).goalIds));
const held={
 'G086-1':'1990·2020년 소비량 문항 연결. 1985~1995년×2015~2024년의 가용 110쌍에서 석탄 변화 방향은 일치. 2025년이 비어 있어 ±5년 전체 검증은 유보.',
 'G020-2':'누적선과 지점 식별은 구현했으나 명세의 뭄바이 관측소 표본은 아직 없음. 양곤·다윈·퍼스 자료로 연습.',
 'G061-3':'제시 자료용 그래프와 stock/flow·분모 해석은 구현. 권역 묶기·언어·네트워크의 세부 목표 검토가 남음.',
 'G062-5':'2025년 WUP F20/F14로 같은 해 수도÷(도시+촌락) 연습을 구현. 수도 범위는 DEGURBA 도시이며, 2018년 강의 원자료의 재현은 아님. 2018년 판본 대응 검토가 남음.',
 'G133-1':'최한월+연교차 복원과 치타·딕슨·싱가포르 기후 식별 구현. 명세의 지도 대응과 몽골·기니만 표본은 아직 없음.',
 'G127-2':'세 산업 부가가치 합=100을 명시한 자료형 화면에서 복원·광업 포함을 연습한다. GDP 기준 원비율에 100−2차−3차를 적용하지 않는다. 기존 국가 경제 주제와는 별도 자료형이다.',
 'G097-4':'미국의 산업 비중은 2021년까지만 있어 세 나라의 같은 해 GDP×비중을 별도 자료형으로 연결했다. 기존 국가 경제 주제의 미국·중국 amount 출제와는 다른 경로이다.',
 'G015-4':'브라질리아·양곤의 반구별 우기 정오 출제를 확인했다. 지정 사례 바마코의 월 관측소 자료는 아직 없어 목표 전체 검증은 유보.',
 'G006-2':'지도 위쪽의 방향 설명은 있으나 지중해·인도양 등의 그림 영역을 직접 선택하는 문항은 남음.',
 'G044-1':'싱가포르의 네 종교 건축 사진을 연결했다. 종교별 사진 2장 이상과 정교회 돔·불탑의 추가 예시가 남음.',
 'G044-2':'싱가포르 네 사원은 연결했다. 히랄다·쿠투비아·술탄 아흐메트·아야소피아·앙코르와트·보로부두르·프람바난의 사진·도시 대응은 남음.',
 'G067-2':'리우·멕시코시티·쿠스코 사진을 연결했다. 런던 타워브리지·시드니 오페라하우스 사진 대응은 남음.',
};
// A binding is implementation evidence. Only separately reviewed completion
// criteria may promote a goal; adding one pair must not verify a compound goal.
const verification=JSON.parse(fs.readFileSync(root+'/data/goal-verification.json','utf8')),verified=new Set(verification.verifiedGoals);
const items=goals.map(g=>({id:g.id,group:g.group,venue:g.venue,status:implemented.has(g.id)?verified.has(g.id)?'검증':'구현':'미구현',evidence:implemented.get(g.id)||[],remaining:held[g.id]||(g.venue==='OX'?'대표 정오 쌍을 연결함. 복합 목표의 모든 사례·조건 충족은 아직 별도 검수 전.':implemented.has(g.id)?'연습 연결과 생성 검사는 통과. 복합 완료 기준의 별도 검토가 남음.':'자료와 화면 연결을 아직 구현하지 않음.')}));
for(const x of items)if(x.status==='검증')x.remaining='완료 기준의 계산·출제·범위 검사를 통과함.';
if(process.argv.includes('--write-status')){
 for(const x of items){const g=goals.find(g=>g.id===x.id);if(g.status!=='검증'||x.status==='검증')g.status=x.status;}
 fs.writeFileSync(file,JSON.stringify(goals,null,1)+'\n');
}
const groups=[...new Set(goals.map(g=>g.group))].map(id=>{const gs=goals.filter(g=>g.group===id),counts={미구현:0,구현:0,검증:0};for(const g of gs)counts[g.status]++;return{id,total:gs.length,...counts,status:counts.검증===gs.length?'완료':counts.구현+counts.검증?'진행 중':'미구현'};});
const counts={미구현:0,구현:0,검증:0};for(const g of goals)counts[g.status]++;
const result={date:'2026-10-26',baseCommit:'2665750a5e174d25f7cb7945bcfc1f1d30e98cc0',continuationBase:'a406f99',goalCount:goals.length,groupCount:groups.length,statusCounts:counts,completeGroups:groups.filter(g=>g.status==='완료').map(g=>g.id),content:{newOX:F.items.length,representedOXGoals:Object.keys(F.bindings).length,rebuiltTables:T.tables.length,materialFamilies:M.families.length},verification:['tests/lecture-goal-completion.test.cjs','tests/materials-remaining.test.cjs','tests/materials.test.cjs','tests/materials-continuation.test.cjs','tests/materials-page.test.cjs','tests/lecture-goal-integration.test.cjs','tests/lecture-goal-progress.test.cjs'],limitations:['OX 구현은 대표 문장 연결 상태이며 모든 복합 목표의 완료를 뜻하지 않음.','2026-10-26 공유 미리보기는 실행됐으나 브라우저 보안 정책이 접근을 차단해 실제 화면 검수는 미완료. DOM 동작 검사와 SVG 계산·렌더 검사를 수행함.','G127-2·G137-3: WDI GDP 기준 산업 비중 합계는 세금·보조금 등의 차이로 100이 아닐 수 있음. 원자료를 100에서 바로 빼거나 조용히 재정규화하지 않음.'],groups,items};
const target=root+'/audit/lecture-goals';fs.mkdirSync(target,{recursive:true});fs.writeFileSync(target+'/progress.json',JSON.stringify(result,null,1)+'\n');
let md='# 하위 학습 목표 구현 상태\n\n기준 계획: `2665750` · 후속 구현 기준: `a406f99` · 2026-10-26\n\n';
md+='이 변경은 573개 전체의 완료가 아니다. **검증 '+counts.검증+'개 · 구현 '+counts.구현+'개 · 미구현 '+counts.미구현+'개**다. `구현`은 연습 화면에 내용이 연결되었다는 뜻이며 완료 기준 전부를 확인한 상태는 아니다. 모든 하위 목표가 `검증`인 묶음만 완료다.\n\n';
md+='- 새 OX '+F.items.length+'문장: 기존 `facts.html`에 연결. 기존 217개 ID·정답·학습 기록은 유지.\n- `materials.html`: '+M.families.length+'개 자료형·계산 주제, 식별 후 <보기> 판단, 틀린 문항 다시 풀기.\n- `concepts.html`: 재구성 비교표 '+T.tables.length+'개. 겹치는 지각 변화는 모든 대상을 묶은 답으로 처리.\n- `exam.html`: 위도선 통과·지도 대표점 비교·상대 생산성·도시화 역산 연결.\n\n';
md+='현재 완료 묶음: '+result.completeGroups.join(', ')+'.\n\n';
md+='## 검증 범위\n\n관측소 누적 차분·편차 복원, 태양 계산, 부양비 역산, 시작 비중 가중 증가율, GIS 원문 예시와 동점·가중치, 허용 범위와 정오 양방향 생성을 검사한다. 실제 화면 검사는 공유 미리보기 실행 후 브라우저 보안 정책 차단으로 수행하지 못했다. DOM 제어 코드의 클릭·중복 채점·재방문 복습을 검사했고 SVG 그래프를 렌더해 확인했다.\n\n';
md+='## 부분 구현의 남은 조건\n\n';for(const [id,note]of Object.entries(held))md+='- '+id+': '+note+'\n';
md+='\nOX 296개 목표에 정오 쌍을 연결했다. 개별 내용 검토를 기록한 목표만 `검증`으로 올리고 나머지는 `구현`으로 둔다. 강의의 사실 자체를 외부 자료로 재검증한 것은 아니다.\n\n';
md+='## 이번 후속 구현\n\n`a406f99`에서 이어서 공식 원자료를 추가했다. OICA 2010·2012·2014년 생산량, WUP 2025 F20 수도 인구와 같은 판본 F14 총인구, WDI 2023 출생·사망률의 원본·해시·재생성 스크립트를 저장했다. 자동차 증가량·증가율, 수도 집중, 출생률 복원, 도시 거리 행렬, 최난월 복원, 종교 상대값·선택 집단·기타 범례, 수확 면적·단수·1인당 생산량, 도시·촌락 인구 이동을 기존 자료형 화면에 연결했다.\n\nG127-2·G137-3의 GDP 기준 산업 비중은 합이 100이 아닐 수 있다. 현재 WDI 입력에서 허용오차 0.15%p를 넘는 125개 국가가 있어 `100−2차−3차`를 원자료에 그대로 적용하지 않는다. 이번에는 세 산업 합을 분모로 명시한 별도 자료형과 산업 좌표 문항을 추가했다. G127-2의 기존 국가 경제 주제 출제는 아직 별도 경로이다.\n\n';
md+='## 2026-10-26 후속 작업\n\n이전 세션의 미저장 변경을 보존한 사본에서 남은 23개 목표의 연습 경로를 연결했다. 기본 경로에서 출제되지 않던 해역·수도 고도는 정오 진술이 함께 가능한 국가 조합으로 보완했고, 고정된 후보·열로 식별이 불가능한 경제 표 구성은 즉시 제외하고, 그 밖의 실패 구성은 일반 구성으로 전환한다. 작물 기원, 종교 금기와 사육, 국가 내부 다양성, 환경 사례, 다년도 곡물 비교의 정오 도달을 1,000시드씩 검사했다.\n\n인구 피라미드는 성별 100·전체 100·실제 명수의 분모를 구별하며, 코호트 문제에는 2010·2020년 그림을 함께 제시한다. 인구 집단 누적 막대는 EBS 공개 평가원 원도표에서 읽은 근삿값임을 표시한다. 산업 비중 복원은 세 산업 합=100을 명시하고, 미국·중국 산업 생산액 비교는 두 지표가 함께 있는 2021년으로 맞춘 별도 자료형이다. 중국의 쌀·양 최다 문장은 2015~2022년으로 한정하며, 2023~2024년 쌀 1위 변화를 명시한다.\n\n이번 검증 추가는 `data/goal-verification.json`의 개별 검토 기록과 `tests/lecture-goal-completion.test.cjs`에 근거한다. 모든 573개 목표에 경로가 있어도 미완성 조건이 남은 목표를 완료로 보지 않는다. 사진 추가·그림 영역 선택·관측소 보강·기존 기출형 경로 연결·브라우저 시각 검수는 위 남은 조건을 따른다.\n\n';
md+='## 목표별 연결\n\n| 목표 | 상태 | 연결 | 남은 조건 |\n|---|---|---|---|\n';
for(const x of items)if(x.evidence.length)md+='| '+x.id+' | '+x.status+' | '+x.evidence.map(e=>e.family||e.table||e.venue).join(', ')+' | '+x.remaining.replace(/\|/g,'/')+' |\n';
fs.writeFileSync(root+'/docs/LECTURE-GAP-IMPLEMENTATION.md',md);
console.log(JSON.stringify({counts,active:implemented.size,completeGroups:result.completeGroups}));
