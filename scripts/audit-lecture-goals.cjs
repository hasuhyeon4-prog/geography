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
const graphGoals=new Set(M.families.flatMap(f=>M.build(f.id,1).goalIds));
const held={
 'G086-1':'1990·2020년 소비량 문항 연결. 1985~1995년×2015~2024년의 가용 110쌍에서 석탄 변화 방향은 일치. 2025년이 비어 있어 ±5년 전체 검증은 유보.',
 'G020-2':'누적선과 지점 식별은 구현했으나 명세의 뭄바이 관측소 표본은 아직 없음. 양곤·다윈·퍼스 자료로 연습.',
 'G061-3':'제시 자료용 그래프와 stock/flow·분모 해석은 구현. 권역 묶기·언어·네트워크의 세부 목표 검토가 남음.',
 'G062-5':'2025년 WUP F20/F14로 같은 해 수도÷(도시+촌락) 연습을 구현. 수도 범위는 DEGURBA 도시이며, 2018년 강의 원자료의 재현은 아님. 2018년 판본 대응 검토가 남음.',
 'G133-1':'최한월+연교차 복원과 치타·딕슨·싱가포르 기후 식별 구현. 명세의 지도 대응과 몽골·기니만 표본은 아직 없음.',
 'G127-2':'현재 WDI의 GDP 기준 1·2·3차 산업 비중은 합이 100이 아닐 수 있어 1차=100−2차−3차 문항을 연결하지 않음. 세 산업 합을 100으로 명시한 별도 자료가 필요.',
 'G137-3':'현재 WDI 산업 비중을 원자료 그대로 쓸 때 1차=100−2차−3차가 성립하지 않을 수 있음. 원 크기의 분모와 세 산업 합의 분모를 분리한 자료형 설계가 남음.',
};
const verified=new Set([...graphGoals].filter(id=>!held[id]).concat(['G005-1','G038-1','G025-2','G028-1','G028-4','G001-2','G004-1','G062-2','G097-3','G135-3']));
const items=goals.map(g=>({id:g.id,group:g.group,venue:g.venue,status:implemented.has(g.id)?verified.has(g.id)?'검증':'구현':'미구현',evidence:implemented.get(g.id)||[],remaining:held[g.id]||(g.venue==='OX'?'대표 정오 쌍을 연결함. 복합 목표의 모든 사례·조건 충족은 아직 별도 검수 전.':implemented.has(g.id)?'연습 연결과 생성 검사는 통과. 복합 완료 기준의 별도 검토가 남음.':'자료와 화면 연결을 아직 구현하지 않음.')}));
for(const x of items)if(x.status==='검증')x.remaining='완료 기준의 계산·출제·범위 검사를 통과함.';
if(process.argv.includes('--write-status')){
 for(const x of items){const g=goals.find(g=>g.id===x.id);if(g.status!=='검증'||x.status==='검증')g.status=x.status;}
 fs.writeFileSync(file,JSON.stringify(goals,null,1)+'\n');
}
const groups=[...new Set(goals.map(g=>g.group))].map(id=>{const gs=goals.filter(g=>g.group===id),counts={미구현:0,구현:0,검증:0};for(const g of gs)counts[g.status]++;return{id,total:gs.length,...counts,status:counts.검증===gs.length?'완료':counts.구현+counts.검증?'진행 중':'미구현'};});
const counts={미구현:0,구현:0,검증:0};for(const g of goals)counts[g.status]++;
const result={date:'2026-10-25',baseCommit:'2665750a5e174d25f7cb7945bcfc1f1d30e98cc0',continuationBase:'a406f99',goalCount:goals.length,groupCount:groups.length,statusCounts:counts,completeGroups:groups.filter(g=>g.status==='완료').map(g=>g.id),content:{newOX:F.items.length,representedOXGoals:Object.keys(F.bindings).length,rebuiltTables:T.tables.length,materialFamilies:M.families.length},verification:['tests/materials.test.cjs','tests/materials-continuation.test.cjs','tests/materials-page.test.cjs','tests/lecture-goal-integration.test.cjs','tests/lecture-goal-progress.test.cjs'],limitations:['OX 구현은 대표 문장 연결 상태이며 모든 복합 목표의 완료를 뜻하지 않음.','브라우저 설치 파일을 받을 수 없어 실제 Chromium 화면 검사는 수행하지 못함. DOM 동작 검사와 SVG 렌더 확인을 수행함.','G127-2·G137-3: WDI GDP 기준 산업 비중 합계는 세금·보조금 등의 차이로 100이 아닐 수 있음. 원자료를 100에서 바로 빼거나 조용히 재정규화하지 않음.'],groups,items};
const target=root+'/audit/lecture-goals';fs.mkdirSync(target,{recursive:true});fs.writeFileSync(target+'/progress.json',JSON.stringify(result,null,1)+'\n');
let md='# 하위 학습 목표 구현 상태\n\n기준 계획: `2665750` · 후속 구현 기준: `a406f99` · 2026-10-25\n\n';
md+='이 변경은 573개 전체의 완료가 아니다. **검증 '+counts.검증+'개 · 구현 '+counts.구현+'개 · 미구현 '+counts.미구현+'개**다. `구현`은 연습 화면에 내용이 연결되었다는 뜻이며 완료 기준 전부를 확인한 상태는 아니다. 모든 하위 목표가 `검증`인 묶음만 완료다.\n\n';
md+='- 새 OX '+F.items.length+'문장: 기존 `facts.html`에 연결. 기존 217개 ID·정답·학습 기록은 유지.\n- `materials.html`: '+M.families.length+'개 자료형·계산 주제, 식별 후 <보기> 판단, 틀린 문항 다시 풀기.\n- `concepts.html`: 재구성 비교표 '+T.tables.length+'개. 겹치는 지각 변화는 모든 대상을 묶은 답으로 처리.\n- `exam.html`: 위도선 통과·지도 대표점 비교·상대 생산성·도시화 역산 연결.\n\n';
md+='현재 완료 묶음: '+result.completeGroups.join(', ')+'.\n\n';
md+='## 검증 범위\n\n관측소 누적 차분·편차 복원, 태양 계산, 부양비 역산, 시작 비중 가중 증가율, GIS 원문 예시와 동점·가중치, 허용 범위와 정오 양방향 생성을 검사한다. 실제 Chromium 화면 검사는 설치 파일 다운로드 실패로 수행하지 못했다. DOM 제어 코드의 클릭·중복 채점·재방문 복습을 검사했고 SVG 그래프를 렌더해 확인했다.\n\n';
md+='## 부분 구현의 남은 조건\n\n';for(const [id,note]of Object.entries(held))md+='- '+id+': '+note+'\n';
md+='\nOX 296개 목표는 대표 정오 쌍을 모두 만들었지만, 복합 목표의 모든 지명·사례까지 충족하는지 검토가 남아 `구현`으로 둔다. 강의의 사실 자체를 외부 자료로 재검증한 것은 아니다.\n\n';
md+='## 이번 후속 구현\n\n`a406f99`에서 이어서 공식 원자료를 추가했다. OICA 2010·2012·2014년 생산량, WUP 2025 F20 수도 인구와 같은 판본 F14 총인구, WDI 2023 출생·사망률의 원본·해시·재생성 스크립트를 저장했다. 자동차 증가량·증가율, 수도 집중, 출생률 복원, 도시 거리 행렬, 최난월 복원, 종교 상대값·선택 집단·기타 범례, 수확 면적·단수·1인당 생산량, 도시·촌락 인구 이동을 기존 자료형 화면에 연결했다.\n\nG127-2·G137-3의 GDP 기준 산업 비중은 합이 100이 아닐 수 있다. 현재 WDI 입력에서 허용오차 0.15%p를 넘는 125개 국가가 있어 `100−2차−3차`를 원자료에 그대로 적용하지 않는다. 분모가 맞는 제시 자료를 별도로 마련해야 한다.\n\n';
md+='## 목표별 연결\n\n| 목표 | 상태 | 연결 | 남은 조건 |\n|---|---|---|---|\n';
for(const x of items)if(x.evidence.length)md+='| '+x.id+' | '+x.status+' | '+x.evidence.map(e=>e.family||e.table||e.venue).join(', ')+' | '+x.remaining.replace(/\|/g,'/')+' |\n';
fs.writeFileSync(root+'/docs/LECTURE-GAP-IMPLEMENTATION.md',md);
console.log(JSON.stringify({counts,active:implemented.size,completeGroups:result.completeGroups}));
