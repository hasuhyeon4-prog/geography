/* Exam-facing questions. Raw generators remain reproducible reference data;
 * this layer decides what is given, what must be inferred, and when to explain it.
 * Relevant original exam counterparts are noted beside the rebuilt adapters. */
(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f();else r.WGMaterialExam=f();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
var L=['(가)','(나)','(다)','(라)'],MARKS=['ㄱ','ㄴ','ㄷ','ㄹ'];
function rng(seed){var a=seed>>>0;return function(){a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function shuffle(a,r){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function clone(x){return JSON.parse(JSON.stringify(x));}
function pair(yes,no,explain,check){return{yes:yes,no:no,explain:explain,check:check||{op:'knowledge'}};}
function topic(t){var letters=t.match(/[가-힣]/g),code=letters&&letters[letters.length-1].charCodeAt(0)-44032;return t+(code!=null&&code%28?'은 ':'는 ');}
function comparison(subject,object,noun,a,b,why,check){
 if(!Number.isFinite(a)||!Number.isFinite(b)||Math.abs(a-b)<1e-8)return null;
 return pair(topic(subject)+object+'보다 '+noun+' '+(a>b?'크다.':'작다.'),topic(subject)+object+'보다 '+noun+' '+(a>b?'작다.':'크다.'),why,Object.assign({op:'examComparison',a:a,b:b},check));
}
function choose(pairs,r){
 var ps=shuffle(pairs.filter(Boolean),r).slice(0,4);
 if(ps.length<2)throw Error('Insufficient independent judgments');
 // Four judgments use the familiar five two-statement combinations. With
 // fewer judgments, every displayed combination must be a possible answer;
 // never pad choices with an always-false "none/all" combination.
 var masks=ps.length===4?[3,5,6,10,12]:ps.length===3?[1,2,3,4,5,6]:[1,2];
 var correct=masks[Math.floor(r()*masks.length)],ss=ps.map(function(p,i){var truth=!!(correct&(1<<i));return{text:truth?p.yes:p.no,truth:truth,explain:p.explain,check:p.check,mark:MARKS[i]};});
 var options=shuffle([correct].concat(shuffle(masks.filter(function(m){return m!==correct;}),r).slice(0,4)),r);
 return{question:'자료에 대한 설명으로 옳은 것만을 <보기>에서 고른 것은?',statements:ss,options:options.map(function(m){return MARKS.slice(0,ps.length).filter(function(_,i){return m&(1<<i);}).join(', ');}),answer:options.indexOf(correct)};
}
// These tables were answer keys disguised as givens. Indices are explicit: a
// numerical input/legend is never removed by a broad caption/keyword heuristic.
var HIDE={
 'city-distance':[0],'climate-restore':[1],'religion-relative':[1],'religion-selected':[1],'religion-other':[1],
 'cumulative':[0],'self-deviation':[0],'common-deviation':[0],'reference-deviation':[0],'precip-deviation':[0],'difference':[0],
 'age-triangle':[0],'urban-radar':[0],'urban-rural-scatter':[0],'grain-size':[0],'lake-types':[0],
 'mineral-relative':[0],'regional-radar':[0],'livestock-composition':[0],'grain-triangle':[0],'beverage-triangle':[0],
 'grain-export-scatter':[0],'crop-trade-bubble':[0],'fossil-triangle':[0],'coal-production-consumption':[0],
 'renewables-denominators':[0],'australia-trade-change':[0],'industry-bubble':[0,1],'unequal-energy-axis':[0],'andes-conditions':[0]
};
var DIRECT=new Set(['gis-filters','gis-medical','gis-scoring','gis-directions','gis-weighted','gis-top-two',
 'stat-map-types','facility-map','rain-ph-maps','andes-conditions','oldmap-images','coast-images','religious-buildings',
 'traditional-houses','road-images','city-images','religious-landmarks','oldmap-regions','irrigation-images',
 'night-lights','china-grain-map','religion-score','religion-symbols','treaty-tree','city-tier','anticline-trap','meander-banks']);
// No confirmed question-level basis for the *added* inventory/tie-break task.
// Keep their source data/history, exclude these inventions from the practice pool.
var PAUSED={'food-stock-balance':'가상 재고 변화까지 계산시키는 확장의 기출 근거 미확인','gis-tie-break':'상위 네 국가·추가 동점 기준으로 바꾼 확장의 기출 근거 미확인','solar-altitude':'solar-month의 계절 판단으로 통합','solar-climate':'solar-month의 계절 판단으로 통합',
 'religion-selected':'최대 종교를 제외한 소수 종교 세부 순위 대신 religion-relative의 기호 식별·종교 특성으로 통합',
 'religion-other':'기타 범례 일반론만 반복하는 독립 문항 보류. 종교별 분모는 기호 식별 문항의 조건으로 유지',
 'renewable-capacity-ranks':'기출의 발전원 식별·입지 판단과 다른 국가 순위 대조·MW/GWh 단위 계산 확장 보류',
 'rain-ph-maps':'가상 격자 최솟값만 고르는 문항과 수소 이온 농도 로그 계산 확장 보류. 산성비 원인·영향은 OX·환경 문항에 유지',
 'religious-landmarks':'기출의 문화 전파·융합·국가 종교 판단을 건축물·도시 세부 명칭 암기로 바꾼 독립 유형 보류. 건축·종교 판단은 religious-buildings에 유지',
 'pyramid-cohort':'두 시점의 동일 출생 집단 인원 증가량을 최대로 만드는 계산 확장의 근거 미확인. 기출의 성·연령 구조·노동 이주 판단은 population-pyramid에 유지',
 'meander-banks':'곡류의 침식 사면 한 점을 고르는 독립 유형의 근거 미확인. 기출의 하천 위치·수계·국제 하천 판단과 구별'};
var CONDITIONS={
 'car-growth':'제시한 기간의 국내 자동차 생산량이다.',
 'capital-share':'2018년 인구 자료이며 단위는 천 명이다. 수도의 범위는 제시 자료를 따른다.',
 'birth-death':'2023년 자료이다. 모든 비율의 단위는 ‰이다.',
 'city-distance':'표는 도시 사이의 대권 거리(km)이다.',
 'climate-restore':'표는 지도에 표시한 세 지점의 최한월 평균 기온과 기온의 연교차이다.',
 'religion-relative':'각 국가에서 신자가 가장 많은 종교 집단의 값을 100으로 한 상대값이다. 모든 종교·무종교 범주를 표시하였다.',
 'religion-selected':'크리스트교·이슬람교·힌두교 신자 수의 합을 100으로 한 구성비이다.',
 'religion-other':'국가 전체 인구 대비 종교별 비율이다. 기타에는 따로 표시하지 않은 범주를 합하였다.',
 'cumulative':'그래프는 월별 누적 강수량이다. 0월은 전년 말이다.',
 'self-deviation':'편차 = 각 월평균 기온 − 해당 지점의 연평균 기온.',
 'common-deviation':'편차 = 각 지점의 월평균 기온 − 제시한 세 지점의 같은 달 평균 기온.',
 'reference-deviation':'편차 = 각 지점의 월평균 기온 − 싱가포르의 같은 달 월평균 기온.',
 'precip-deviation':'편차 = 월 강수량 − 해당 지점의 연 강수량÷12.',
 'difference':'가로축은 1월−7월 평균 기온 차이, 세로축은 1월−7월 강수량 차이이다.',
 'age-triangle':'2023년 연령별 인구 구성이다. 유소년은 0~14세, 청장년은 15~64세, 노년은 65세 이상이다.',
 'dependency':'총부양비와 노년 부양비는 청장년층 인구 100명당 인구수이다.',
 'urban-radar':'각 항목에서 제시 세 국가 중 최댓값을 1로 한 상대값이다.',
 'regional-radar':'각 항목에서 제시 국가 중 최댓값을 100으로 한 상대값이다.',
 'lake-types':'그래프는 세 호수의 수심과 염분을 나타낸 모식 자료이다.',
 'grain-size':'입경 구간은 왼쪽에서 오른쪽으로 커진다. 두 지형의 입도 분포를 나타낸 모식 자료이다.',
 'industry-remainder':'세 산업 부가가치의 합을 100으로 재환산하였다.',
 'industry-bubble':'세 산업 부가가치 합=100%. 원의 면적은 1인당 GDP에 비례한다.',
 'livestock-composition':'각 국가의 소·돼지·양 사육 두수 합을 100으로 하였다. 소에서 물소는 제외한다.',
 'grain-triangle':'각 지역의 밀·쌀·옥수수 생산량 합을 100으로 하였다.',
 'beverage-triangle':'각 지역의 커피·차(생엽)·카카오 생산량 합을 100으로 하였다.',
 'fossil-triangle':'각 지역의 석탄·석유·천연가스 생산량 합을 100으로 하였다.',
 'fossil-remainder':'각 국가의 석탄·석유·천연가스 생산량 합=100%.',
 'renewables-denominators':'각 국가의 수력·풍력·태양광·기타 발전량 합을 100으로 하였다.',
 'solar-route':'같은 달의 같은 날에 세 경로로 이동한다.',
 'population-index':'각 국가의 2010년 인구를 100으로 한 지수이다.',
 'soil-temperature':'9월의 두 지점 지중 온도를 나타낸 모식 자료이다.',
 'population-periods':'자연 증감은 근삿값이다. 단위는 백만 명이다.',
 'migration-scatter':'같은 해의 인구를 분모로 전체 증가율을 자연 증가율과 순이동률의 합으로 구성한 자료이다.',
 'migration-continents':'같은 해의 인구를 분모로 전체 증가율을 자연 증가율과 순이동률의 합으로 구성한 자료이다.',
 'pyramid-cohort':'2010년과 2020년의 성·연령별 인구 자료이다.',
 'resource-area':'각 그림 전체의 면적을 100으로 한 생산량 구성비이다.',
 'population-area':'각 그림 전체의 면적을 100으로 한 인구 구성비이다.',
 'energy-change':'1990년과 2020년 에너지원별 소비량(EJ)이다.',
 'energy-composition':'2000년과 2018년 1차 에너지 소비 구성(%)이다.',
 'environment-news':'다음은 환경 관련 기사의 일부를 재구성한 것이다.'
};
var CLIMATE=['cumulative','self-deviation','common-deviation','reference-deviation','precip-deviation','difference'];
// Retain scope/denominator traps; discard tautologies and statements that merely
// repeat an axis label, numeric cell, or the name just answered in stage one.
var WEAK=new Set(['figureIdentification','distanceSymmetry','distanceCompare','cityDistance','declination','solarAltitude','night',
 'month','slope','annual','compare','composition','mineralNormalize','withinArea','areaRemainder','treeTraversal',
 'inclusiveBoundary','medicalWinner','filter','weightedScore','topTwo','tieBreak','weightMeaning','energyChange',
 'energyShareChange','radarColumns','radarOrder','normalize','sorting','grainMean','lakeReading','lakeSalinity',
 'correctReligionClaim','religionScores','exportItems2018','grainDotLegend','nightLightMeaning','nightLightCountries']);
function create(data,math,extra){
 var geography={
  '프랑스':['유럽 연합(EU) 회원국이다.','동남아시아 국가 연합(ASEAN) 회원국이다.','bloc','eu'],
  '독일':['유럽 연합(EU) 회원국이다.','동남아시아 국가 연합(ASEAN) 회원국이다.','bloc','eu'],
  '인도':['힌두교 신자 비율이 가장 높다.','불교 신자 비율이 가장 높다.','religion','hinduism'],
  '니제르':['바다와 접하지 않는 내륙국이다.','대서양과 접한 국가이다.','landlocked','yes'],
  '나이지리아':['수도와 인구 최대 도시가 서로 다르다.','수도와 인구 최대 도시가 같다.','capitalCity','diff'],
  '브라질':['포르투갈어를 공용어로 사용한다.','에스파냐어를 공용어로 사용한다.','latinLanguage','portuguese'],
  '오스트레일리아':['수도와 인구 최대 도시가 서로 다르다.','수도와 인구 최대 도시가 같다.','capitalCity','diff'],
  '미국':['수도와 인구 최대 도시가 서로 다르다.','수도와 인구 최대 도시가 같다.','capitalCity','diff'],
  '멕시코':['수도와 인구 최대 도시가 같다.','수도와 인구 최대 도시가 서로 다르다.','capitalCity','same'],
  '콜롬비아':['수도가 해발 고도 2,000m 이상의 고산 도시이다.','수도가 해수면 부근의 해안 도시이다.','capitalHighland','high'],
  '칠레':['수도와 인구 최대 도시가 같다.','수도와 인구 최대 도시가 서로 다르다.','capitalCity','same'],
  '우루과이':['에스파냐어를 공용어로 사용한다.','포르투갈어를 공용어로 사용한다.','latinLanguage','spanish']
 };
 function geographic(q){return(q.assignment||[]).map(function(n,i){var f=geography[n];return f?pair(L[i]+'는 '+f[0],L[i]+'는 '+f[1],n+': '+f[0],{op:'geographicFact',name:n,set:f[2],value:f[3]}):null;}).filter(Boolean);}
 function climatePairs(q){
  var names=q.assignment,ps=[],sites=data.climate.sites;
  names.forEach(function(n,i){var s=sites[n],p=s.p,t=s.t,summer=s.lat>0?[5,6,7]:[11,0,1],winter=s.lat>0?[11,0,1]:[5,6,7],wet=summer.reduce(function(a,m){return a+p[m];},0)>winter.reduce(function(a,m){return a+p[m];},0),label=L[i];
   if(['다윈','양곤','뭄바이'].includes(n))ps.push(pair(label+'는 여름철에 강수가 집중된다.',label+'는 겨울철에 강수가 집중된다.',n+'는 여름 우기·겨울 건기의 계절성을 보인다.',{op:'climateSeason',name:n,lat:s.lat,summer:summer,winter:winter,summerRain:summer.reduce(function(a,m){return a+p[m];},0),winterRain:winter.reduce(function(a,m){return a+p[m];},0)}));
   if(n==='퍼스')ps.push(pair(label+'는 여름철에 아열대 고압대의 영향을 많이 받는다.',label+'는 겨울철에 아열대 고압대의 영향을 많이 받는다.','퍼스의 지중해성 기후는 여름 건조·겨울 강수이다.',{op:'climateKnowledge',name:n,concept:'cs'}));
   if(n==='창춘')ps.push(pair(label+'는 겨울철에 대륙성 기단의 영향으로 한랭 건조하다.',label+'는 겨울철에 해양성 기단의 영향으로 고온 다습하다.','창춘은 겨울철 대륙성 기단의 영향을 받는 냉대 겨울 건조 기후이다.',{op:'climateKnowledge',name:n,concept:'dw'}));
   if(n==='덴버')ps.push(pair(label+'는 대륙 내부의 스텝 기후 지역이다.',label+'는 연중 습윤한 서안 해양성 기후 지역이다.','덴버는 미국 내륙의 스텝 기후 지역이다.',{op:'climateKnowledge',name:n,concept:'bs'}));
  });
  // These are observations of the supplied stations, used only where the graph
  // actually encodes the required difference/range; never promoted to recall facts.
  if(['self-deviation','common-deviation','reference-deviation'].includes(q.id)){
   var a=sites[names[0]].t,b=sites[names[1]].t;
   ps.push(comparison(L[0],L[1],'기온의 연교차가',Math.max.apply(null,a)-Math.min.apply(null,a),Math.max.apply(null,b)-Math.min.apply(null,b),'각 곡선의 최댓값과 최솟값 차이를 비교한다. 지점별 일정한 기준을 빼면 연교차가 유지된다.',{op:'climateRange',names:names.slice(0,2)}));
   // A varying common reference does not preserve each curve's annual range.
   if(q.id!=='self-deviation')ps.pop();
  }
  var old=q.pairs.filter(function(p){return ['selfDifference','commonDifference','negativeDeviation','differenceMeaning'].includes(p.check.op);});
  if(q.id==='cumulative'){
   var rainfall=sites[names[0]].p,a=rainfall[5]+rainfall[6]+rainfall[7],b=rainfall[11]+rainfall[0]+rainfall[1];
   old.push(pair(L[0]+'의 6·7·8월 강수량 합은 12·1·2월 강수량 합보다 '+(a>b?'크다.':'작다.'),L[0]+'의 6·7·8월 강수량 합은 12·1·2월 강수량 합보다 '+(a>b?'작다.':'크다.'),'누적값 자체가 아니라 각 기간 양 끝 누적값의 차이를 비교한다.',{op:'cumulativeSeason',summer:a,winter:b}));
  }
  // Keep at most one material-reading statement among geographic follow-ups.
  ps=ps.concat(shuffle(old,rng(q.seed+23)).slice(0,1));
  // Monthly seasonality supports hemisphere from *temperature*, but tropical
  // temperature peaks need not be July/January: compare the two named months.
  names.forEach(function(n,i){if(n==='퍼스'||n==='로차')ps.push(pair(L[i]+'는 7월보다 1월에 낮 길이가 길다.',L[i]+'는 1월보다 7월에 낮 길이가 길다.',n+'는 남반구에 있어 1월이 여름이다.',{op:'climateKnowledge',name:n,concept:'southernSummer'}));});
  return ps;
 }
 function numerical(q){
  var groups={},out=[];
  q.pairs.forEach(function(p){var c=p.check||{},m=p.yes.match(/^(.+?)의 (.+?)(?:은|는|이|가) (?:약 )?[-\d,]/);
   if(!m||!Number.isFinite(c.result)||!['add','product','quotient','growth','capitalShare','cropPerPerson','weightedGrowth','workforce','youngDependency','aging','indexAmount','dependency','quotientShare','industryRemainder','fossilRemainder','sum','divideShare'].includes(c.op))return;
   var key=c.op+'|'+m[2];(groups[key]||(groups[key]=[])).push({subject:m[1],noun:m[2],result:c.result,check:c});
  });
  Object.keys(groups).forEach(function(k){var a=groups[k];if(a.length<2)return;
   for(var i=0;i<Math.min(a.length,3);i++){var x=a[i],y=a[(i+1)%a.length];if(Math.abs(x.result-y.result)<Math.max(Math.abs(x.result),Math.abs(y.result))*.03)continue;
    var p=comparison(x.subject,y.subject,x.noun+'이',x.result,y.result,'각 대상의 같은 지표를 같은 분모로 계산한 뒤 비교한다.',{operands:[x.check,y.check],quantity:x.noun});if(p)out.push(p);
   }
  });return out;
 }
 function solar(q){
  var month=q.seed%2?7:1,names=['홍콩','카슈가르','오클랜드'],lat={홍콩:22.3,카슈가르:39.5,오클랜드:-37},decl=month===7?21:-21;
  var rows=names.map(function(n){return[n,Math.round(90-Math.abs(lat[n]-decl))];});
  var ps=[
   pair('제시 시기는 '+month+'월이다.','제시 시기는 '+(month===7?1:7)+'월이다.','홍콩과 오클랜드 중 태양 고도가 높은 쪽을 비교해 직사점이 북반구/남반구에 있는지 판단한다.',{op:'solarSeason',month:month,altitudes:rows}),
   pair('제시 시기의 카슈가르는 오클랜드보다 낮 길이가 '+(month===7?'길다.':'짧다.'),'제시 시기의 카슈가르는 오클랜드보다 낮 길이가 '+(month===7?'짧다.':'길다.'),'북반구 여름에는 북쪽 지점의 낮이 남쪽 지점보다 길다. 1월은 반대이다.',{op:'solarDay',month:month}),
   pair('오클랜드는 제시 시기보다 '+(month===7?'1':'7')+'월의 평균 기온이 '+(month===7?'높다.':'낮다.'),'오클랜드는 제시 시기보다 '+(month===7?'1':'7')+'월의 평균 기온이 '+(month===7?'낮다.':'높다.'),'남반구 오클랜드는 1월이 여름, 7월이 겨울이다.',{op:'solarClimate',month:month})
  ];
  return{figures:[],tables:[{headers:['지점','정오 태양 고도(°)'],rows:rows,caption:'모식 자료'}],condition:'제시 시기는 1월과 7월 중 하나이다.',pairs:ps,title:'태양 고도와 계절',identification:null,note:'1월에는 직사점이 남반구, 7월에는 북반구에 있다. 정오 태양 고도는 그날 직사 위도에 가까울수록 높다. 제시값은 계절 비교를 위한 모식값이며 관측 통계가 아니다.'};
 }
 function city(q){
  var names=shuffle(['로스앤젤레스','샌프란시스코','시카고','휴스턴'],rng(q.seed)),anchors=['뉴욕','보스턴'],all=anchors.concat(names),labs=anchors.concat(L),rows=all.map(function(n,i){return[labs[i]].concat(all.map(function(m){return n===m?0:Math.round(math.distance(data.cities[n],data.cities[m]));}));});
  var facts={'로스앤젤레스':['할리우드를 중심으로 영화 산업이 발달했다.','오대호 연안에 위치한다.'],'샌프란시스코':['지중해성 기후가 나타난다.','겨울보다 여름에 강수가 집중된다.'],'시카고':['오대호 연안의 내륙 교통 중심지이다.','태평양 연안에 위치한다.'],'휴스턴':['선벨트에 위치하며 석유 화학 산업이 발달했다.','북동부의 전통 공업 지역에 위치한다.']};
  var ps=names.map(function(n,i){return pair(L[i]+'는 '+facts[n][0],L[i]+'는 '+facts[n][1],n+'의 위치·도시 기능을 연결한다.',{op:'cityKnowledge',name:n});});
  return{title:'도시 간 거리와 도시 기능',figures:[],tables:[{headers:['도시'].concat(labs),rows:rows,caption:'도시 간 대권 거리(km)'}],condition:'(가)~(라)는 각각 로스앤젤레스, 샌프란시스코, 시카고, 휴스턴 중 하나이다.',pairs:ps,identification:names,note:'뉴욕·보스턴과의 거리, 서부 두 도시 사이의 가까운 거리와 동서 위치를 함께 읽는다. 각 도시의 위치를 복원한 뒤 산업·기후를 대응한다.'};
 }
 // The original picture questions compare expression, process and regional
 // knowledge. Showing three panels makes recognition a step toward judgment.
 var PHOTO={
  'oldmap-images':{
   babylon:[['기원전에 제작된 지도이다.','조선 후기에 제작된 지도이다.'],['바빌론을 세계의 중심에 두었다.','예루살렘을 세계의 중심에 두었다.']],
   ptolemy:[['구형 지구 인식과 경위선망을 반영했다.','중화사상에 따라 중국을 중심에 두었다.'],['아메리카 대륙을 표현하지 않았다.','아메리카 대륙을 표현했다.']],
   'to-map':[['크리스트교 세계관을 반영했다.','이슬람교 세계관을 반영했다.'],['동쪽이 위에 표현되었다.','남쪽이 위에 표현되었다.']],
   idrisi:[['남쪽이 위에 표현되었다.','북쪽이 위에 표현되었다.'],['이슬람교 세계관을 반영했다.','크리스트교 세계관을 반영했다.']],
   cheonhado:[['중국을 중심으로 실제와 상상의 세계를 표현했다.','예루살렘을 중심으로 실제 세계만 표현했다.'],['조선에서 제작되었다.','중국 명대에 제작되었다.']],
   daeming:[['중국에서 제작되었다.','조선에서 제작되었다.'],['지구전후도보다 먼저 제작되었다.','지구전후도보다 나중에 제작되었다.']],
   kangnido:[['조선 전기에 국가 주도로 제작되었다.','조선 후기에 민간에서 제작되었다.'],['아메리카 대륙을 표현하지 않았다.','아메리카 대륙을 표현했다.']],
   kunyu:[['중국에서 제작되었다.','조선에서 제작되었다.'],['아메리카 대륙을 표현했다.','아메리카 대륙을 표현하지 않았다.']],
   hemispheres:[['우리나라에서 제작된 지도이다.','중국에서 제작된 지도이다.'],['대명 혼일도보다 나중에 제작되었다.','대명 혼일도보다 먼저 제작되었다.']],
   hereford:[['크리스트교 세계관을 반영했다.','이슬람교 세계관을 반영했다.'],['동쪽이 위에 표현되었다.','남쪽이 위에 표현되었다.']],
   portolan:[['해안과 항구 정보가 상세해 항해에 이용되었다.','종교적 이상향을 표현하기 위해 제작되었다.'],['항해용 실용 지도의 성격이 강하다.','중국 중심의 관념도 성격이 강하다.']],
   mercator:[['국지적인 각도를 보존한다.','고위도 지역의 면적을 정확히 보존한다.'],['항정선이 직선으로 표현된다.','항정선이 곡선으로 표현된다.']]
  },
  'coast-images':{
   mangrove:[['열대 해안의 식생 경관이다.','한대 해안의 식생 경관이다.'],['해수의 영향을 받는 습윤한 해안에서 나타난다.','건조한 대륙 내부에서 나타난다.']],
   coral:[['따뜻하고 얕은 바다의 생물 작용과 관련 있다.','차갑고 깊은 바다의 빙하 작용과 관련 있다.'],['산호충 유해의 집적으로 형성된다.','파랑의 침식으로 남은 바위이다.']],
   lagoon:[['사주가 만의 입구를 막으며 형성된 호수이다.','빙하가 깊게 침식한 골짜기에 형성된 호수이다.'],['형성에 파랑·연안류의 퇴적 작용이 관여한다.','형성에 용암 분출과 화구 함몰이 관여한다.']],
   'sea-stack':[['파랑의 침식 작용과 관련 있다.','바람의 퇴적 작용과 관련 있다.'],['주로 해안의 돌출부에서 발달하는 침식 경관이다.','주로 만 안쪽에 퇴적물이 쌓여 발달하는 경관이다.']]
  },
  'traditional-houses':{
   ger:[['분해·조립과 이동에 편리해 유목 생활에 적합하다.','지하 수로로 물을 운반하는 데 적합하다.'],['건조 초원의 목축 생활과 관련 있다.','고온 다습한 열대의 정착 벼농사와 관련 있다.']],
   gassho:[['급한 지붕 경사는 쌓인 눈을 내려보내는 데 유리하다.','급한 지붕 경사는 적은 강수의 저장을 주목적으로 한다.'],['겨울철 강설에 적응한 가옥이다.','이동식 유목 생활에 적응한 가옥이다.']],
   stilt:[['높인 바닥은 통풍과 습기 회피에 유리하다.','높인 바닥은 겨울철 눈을 지붕에서 내려보내기 위한 구조이다.'],['사진의 가옥은 고온 다습한 환경에 적응한 것이다.','사진의 가옥은 건조 초원에서 분해·이동하기 위한 것이다.']]
  },
  'religious-buildings':{
   'hindu-temple':[['관련 종교는 남부 아시아에서 기원한 민족 종교이다.','관련 종교는 서남아시아에서 기원한 보편 종교이다.'],['관련 종교에서는 소를 신성시한다.','관련 종교에서는 메카 순례를 의무로 여긴다.']],
   church:[['관련 종교는 서남아시아에서 기원했다.','관련 종교는 남부 아시아에서 기원했다.'],['관련 종교는 보편 종교이다.','관련 종교는 민족 종교이다.']],
   mosque:[['관련 종교는 유일신을 믿는다.','관련 종교는 여러 신을 믿는다.'],['관련 종교에서는 돼지고기 섭취를 금한다.','관련 종교에서는 소를 신성시해 쇠고기를 기피한다.']],
   'buddhist-temple':[['관련 종교는 남부 아시아에서 기원했다.','관련 종교는 서남아시아에서 기원했다.'],['관련 종교의 성지에는 부다가야가 있다.','관련 종교의 성지에는 메카가 있다.']]
  },
  'city-images':{
   rio:[['현재 브라질의 수도가 아니다.','현재 브라질의 수도이다.'],['포르투갈어 문화권에 속한다.','에스파냐어 문화권에 속한다.']],
   'mexico-city':[['아스테카 문명과 관련 있다.','잉카 문명과 관련 있다.'],['국가의 수도이자 인구 최대 도시이다.','국가의 수도와 별개로 발달한 인구 최대 도시이다.']],
   cusco:[['잉카 문명과 관련 있다.','아스테카 문명과 관련 있다.'],['페루에 위치한다.','볼리비아에 위치한다.']]
  }
 };
 function photos(q,r){
  if(q.id==='road-images'&&extra){
   var ids=shuffle(['manhattan','paris-roads'],r),ny=ids.indexOf('manhattan'),pa=1-ny,ps=[
    pair(L[ny]+'의 도시는 국가의 수도가 아니다.',L[ny]+'의 도시는 국가의 수도이다.','뉴욕은 미국의 수도가 아니며 수도는 워싱턴 D.C.이다.',{op:'photoKnowledge',panel:'manhattan',trait:'capital'}),
    pair(L[pa]+'의 도시는 국가의 수도이다.',L[pa]+'의 도시는 국가의 수도가 아니다.','파리는 프랑스의 수도이다.',{op:'photoKnowledge',panel:'paris-roads',trait:'capital'}),
    pair(L[ny]+'의 도시는 '+L[pa]+'의 도시보다 형성 역사가 짧다.',L[ny]+'의 도시는 '+L[pa]+'의 도시보다 형성 역사가 길다.','뉴욕은 파리보다 형성 역사가 짧다.',{op:'photoKnowledge',panel:'manhattan',trait:'history'})];
   return{pairs:ps,figureLayout:'photos',figures:ids.map(function(id,i){return{kind:'image',src:extra.panels.find(function(p){return p.id===id;}).path,name:L[i]};}),tables:[],condition:'다음은 두 도시의 일부 구역이다.',identification:ids.map(function(id){return id==='manhattan'?'뉴욕':'파리';}),note:'격자형 맨해튼과 개선문을 중심으로 도로가 뻗는 파리를 구별한 뒤 수도 여부와 형성 역사를 판단한다.'};
  }
  var spec=PHOTO[q.id];if(!spec||!extra)return null;
  var ids=shuffle(Object.keys(spec),r).slice(0,3),panels=ids.map(function(id){return extra.panels.find(function(p){return p.id===id;});}),ps=[];
  function sentence(label,text){if(text.indexOf('관련 종교')===0)return label+'의 '+text.slice(3);if(/^(급한 지붕 경사|높인 바닥)/.test(text))return label+'에서 '+text;if(text.indexOf('형성에 ')===0)return label+'의 '+text;return label+'는 '+text;}
  ids.forEach(function(id,i){var f=spec[id][0];ps.push(pair(sentence(L[i],f[0]),sentence(L[i],f[1]),panels[i].answer+': '+f[0],{op:'photoKnowledge',panel:id,trait:0}));});
  var f=spec[ids[0]][1];ps.push(pair(sentence(L[0],f[0]),sentence(L[0],f[1]),panels[0].answer+': '+f[0],{op:'photoKnowledge',panel:ids[0],trait:1}));
  return{pairs:ps,figureLayout:'photos',figures:panels.map(function(p,i){return{kind:'image',src:p.path,name:L[i]};}),tables:[],condition:'다음은 서로 다른 대상의 사진 또는 지도이다.',identification:panels.map(function(p){return p.answer;}),note:ps.map(function(p){return p.explain;}).join(' ')};
 }
 function prepare(q){
  var r=rng(q.seed+719),x={title:q.title,condition:CONDITIONS[q.id]||'',figures:clone(q.figures),tables:clone(q.tables.filter(function(_,i){return !(HIDE[q.id]||[]).includes(i);})),referenceTables:clone(q.tables.filter(function(_,i){return (HIDE[q.id]||[]).includes(i);})),note:q.note,source:q.source,revision:3};
  var pairs=[],direct=DIRECT.has(q.id),assignment=q.assignment;
  if(assignment&&assignment.every(function(n){return typeof n==='string';})&&!['climate-restore','resource-area','population-area'].includes(q.id))x.condition+=(x.condition?' ':'')+L.slice(0,assignment.length).join('·')+'는 각각 '+assignment.slice().sort().join(', ')+' 중 하나이다.';
  if(CLIMATE.includes(q.id))pairs=climatePairs(q);
  else pairs=numerical(q).concat(q.pairs.filter(function(p){return !WEAK.has(p.check.op)&&!Number.isFinite(p.check.result);}));
  if(['solar-month','solar-altitude','solar-climate'].includes(q.id)){var s=solar(q);Object.assign(x,s);pairs=s.pairs;}
  if(q.id==='city-distance'){var c=city(q);Object.assign(x,c);x.referenceTables=[];pairs=c.pairs;}
  var photo=photos(q,r);if(photo){Object.assign(x,photo);pairs=photo.pairs;direct=false;}
  if(q.id==='solar-night'){
   pairs=[pair('1월과 7월의 밤 길이 차이가 가장 작은 지점은 마닐라이다.','1월과 7월의 밤 길이 차이가 가장 작은 지점은 도쿄이다.','적도에 가까울수록 낮·밤 길이의 연중 변화 폭이 작다.',{op:'nightSeason'}),pair('웰링턴은 7월보다 1월에 낮 길이가 길다.','웰링턴은 1월보다 7월에 낮 길이가 길다.','남반구의 계절은 북반구와 반대이다.',{op:'nightSeason'})];x.condition='마닐라·도쿄는 북반구, 웰링턴은 남반구에 위치한다. 그래프는 1월 밤 길이−7월 밤 길이이다.';
  }
  if(q.id==='solar-route'){
   var month=q.seed%2?1:7,ns=q.tables[0].rows.map(function(row){return row[0];});
   x.tables=[{headers:['경로'],rows:ns.map(function(n){return[n];}),caption:month+'월의 이동 경로'}];x.condition=month+'월의 같은 날에 이동한다.';
   x.stage=clone(q.stage1);x.stage.explain='1월에는 남쪽으로 갈수록, 7월에는 북쪽으로 갈수록 낮이 길다. 출발·도착 위치를 비교한다.';direct=true;
  }
  if(q.id==='soil-temperature'){
   pairs=q.pairs.filter(function(p){return ['soil2m','frozenDepth','singleMonth'].includes(p.check.op);});x.tables=[];
  }
  if(q.id==='environment-news'){
   x.stage={question:'(가), (나) 기사의 내용과 각각 직접 관련된 국제 환경 협정·협약은?',options:['파리 협정 · 바젤 협약','파리 협정 · 람사르 협약','몬트리올 의정서 · 바젤 협약','람사르 협약 · 몬트리올 의정서','바젤 협약 · 파리 협정'],answer:0,explain:'온실가스 감축은 파리 협정, 유해 폐기물의 국가 간 이동은 바젤 협약과 연결한다.'};
  }
  if(q.id==='lake-types'){
   x.stage=clone(q.stage1);x.stage.explain='빙하호는 빙하 침식으로 깊게 형성될 수 있고, 건조 지역 플라야는 증발로 염류가 집적된다. 제시 모식 자료의 깊이·염분을 함께 대응한다.';direct=true;
  }
  if(q.id==='grain-size'){x.stage=clone(q.stage1);x.stage.explain='선상지·바하다는 사구보다 평균 입경이 크고 입경 분포가 넓다. 평균 입경과 분급을 함께 비교한다.';direct=true;}
  if(q.id==='climate-restore'){
   x.stage=clone(q.stage1);direct=true;
  }
  if(q.id==='religion-selected'||q.id==='religion-other'){
   // Minor-religion ordering was not established knowledge: no lookup quiz on
   // Myanmar's minority shares. Ask the encoded denominator, not that ordering.
   x.condition=CONDITIONS[q.id];
   pairs=q.pairs.filter(function(p){return ['selectedReligions','omittedReligion','subsetComposition','otherNotSingle','otherDependsOnLegend'].includes(p.check.op);});
  }
  if(q.id==='religion-relative'){
   // 2016-09-02: country majorities identify religious symbols, then origin,
   // food taboos and universality are judged. Do not ask four variants of 100%.
   var religions=shuffle(['크리스트교','이슬람교','힌두교','불교'],r),traits={
    '크리스트교':['서남아시아에서 기원한 보편 종교이다.','남부 아시아에서 기원한 민족 종교이다.'],
    '이슬람교':['유일신을 믿으며 돼지고기 섭취를 금한다.','여러 신을 믿으며 소를 신성시한다.'],
    '힌두교':['남부 아시아에서 기원한 민족 종교이다.','서남아시아에서 기원한 보편 종교이다.'],
    '불교':['성지인 부다가야가 남부 아시아에 있다.','성지인 메카가 서남아시아에 있다.']};
   var oldTable=q.tables[0],positions=religions.map(function(n){return oldTable.headers.indexOf(n);});
   x.tables=[{headers:['국가','A','B','C','D'],rows:oldTable.rows.map(function(row,i){return[q.assignment[i]].concat(positions.map(function(j){return row[j];}));}),caption:'각 국가에서 신자가 가장 많은 종교의 값=100'}];x.figures=[];
   x.condition='A~D는 각각 크리스트교, 이슬람교, 힌두교, 불교 중 하나이다. 값은 국가 전체 구성비가 아닌 상대값이다.';
   pairs=religions.map(function(n,i){return pair('ABCD'[i]+'는 '+traits[n][0],'ABCD'[i]+'는 '+traits[n][1],n+': '+traits[n][0],{op:'religionTrait',religion:n});});
   x.identification=religions;x.identificationLabels=['A','B','C','D'];
  }
  if(q.id==='mineral-relative'){
   // 2025-06-12 supplies these 2022 relative values. Do not replace its
   // regional knowledge with Mexico/Peru/China production-rank memorization.
   var names=['볼리비아','브라질','칠레'];
   x.figures=[{kind:'image',src:'assets/goal-figures/mineral-relative-source.png',name:'광물별 상대 생산량과 지도'}];
   x.tables=[];x.referenceTables=[];x.condition='(가)~(다)는 지도에 표시된 세 국가 중 하나이다. 각 광물에서 제시 국가의 최대 생산량=100이다. 2022년 자료이다.';
   x.identification=names;x.source='2025학년도 6월 12번 원문 제시 상대값(2022년)';x.note='철광석의 브라질과 구리의 칠레를 식별하고 안데스·내륙국·언어·국경 관계를 판단한다. 제시 상대값을 세계 전체 점유율이나 영구 순위로 외우지 않는다.';
   var bo=L[names.indexOf('볼리비아')],br=L[names.indexOf('브라질')],ch=L[names.indexOf('칠레')];
   pairs=[pair(bo+'는 바다와 접하지 않는 내륙국이다.',bo+'는 태평양과 접한 국가이다.','볼리비아는 내륙국이다.',{op:'mineralRegionalKnowledge',name:'볼리비아'}),
    pair(br+'는 포르투갈어를 공용어로 사용한다.',br+'는 에스파냐어를 공용어로 사용한다.','브라질의 포르투갈 식민 역사를 연결한다.',{op:'geographicFact',name:'브라질',set:'latinLanguage',value:'portuguese'}),
    pair(ch+'는 '+br+'와 국경을 접하지 않는다.',ch+'는 '+br+'와 국경을 접한다.','칠레와 브라질은 접경하지 않는다.',{op:'mineralRegionalKnowledge',name:'칠레'}),
    pair(bo+'는 '+br+' 및 '+ch+'와 모두 국경을 접한다.',br+'는 '+bo+' 및 '+ch+'와 모두 국경을 접한다.','볼리비아는 브라질·칠레 모두와 접경한다.',{op:'mineralRegionalKnowledge',name:'볼리비아'})];
   direct=false;
  }
  if(q.id==='grain-export-scatter'||q.id==='crop-trade-bubble'||q.id==='coal-production-consumption')x.condition=CONDITIONS[q.id]||'그래프의 각 점은 한 지역을 나타낸다.';
  if(q.id==='grain-export-scatter'){
   var f=q.figures[0],pts=f.points;
   pairs=pts.map(function(a,i){var b=pts[(i+1)%pts.length];return comparison(a.name,b.name,'생산량 대비 수출량 비율이',a.y/a.x,b.y/b.x,'수출량÷생산량을 두 지역에서 각각 비교한다.',{operands:[a,b],quantity:'exportProductionRatio'});});
  }
  if(q.id==='vital-scatter'){
   var v=q.figures[0].points;
   pairs=v.map(function(a,i){var b=v[(i+1)%v.length];return comparison(a.name,b.name,'자연 증가율이',a.x-a.y,b.x-b.y,'출생률−사망률을 각각 비교한다.',{operands:[a,b],quantity:'naturalIncrease'});});x.condition='가로축은 출생률, 세로축은 사망률이다. 단위는 ‰이다.';
  }
  if(q.id==='migration-scatter'||q.id==='migration-continents'){
   var rows=q.tables[0].rows;
   pairs=rows.map(function(a,i){var b=rows[(i+1)%rows.length];return comparison(a[0],b[0],'순이동 인원이',a[1]*(a[3]-a[2])/100,b[1]*(b[3]-b[2])/100,'인구×(전체 증가율−자연 증가율)÷100. 비율과 인원을 구별한다.',{operands:[a,b],quantity:'netMigrationPeople'});});
   // Given population is necessary; duplicate rates are not a separate hint.
  }
  if(q.id==='resource-area'||q.id==='population-area'){
   // Totals remain supplied, but the constituency key is held back.
   x.tables=q.figures.map(function(f,i){return{headers:['자료','전체 총량'],rows:[[L[i],q.tables[0].rows.find(function(row){return row[0]===assignment[i];})[1]]],caption:q.tables[0].caption};});
   x.stage=clone(q.stage1);direct=true;
  }
  if(q.id==='daylight')pairs=q.pairs.filter(function(p){return ['dayRange','hemisphere','polar'].includes(p.check.op);});
  if(q.id==='dependency'){
   var rr=q.tables[0].rows;
   pairs=[comparison(rr[0][0],rr[1][0],'유소년 부양비가',rr[0][1]-rr[0][2],rr[1][1]-rr[1][2],'유소년 부양비는 총부양비에서 노년 부양비를 뺀 값이다.',{quantity:'youngDependency',operands:rr.slice(0,2)}),
    comparison(rr[1][0],rr[2][0],'노령화 지수가',rr[1][2]/(rr[1][1]-rr[1][2]),rr[2][2]/(rr[2][1]-rr[2][2]),'노년 부양비÷유소년 부양비의 대소를 비교한다.',{quantity:'agingIndex',operands:rr.slice(1,3)}),
    comparison(rr[0][0],rr[2][0],'청장년층 인구 비율이',10000/(100+rr[0][1]),10000/(100+rr[2][1]),'전체 인구에서 청장년층이 차지하는 비율과 총부양비를 연결한다.',{quantity:'workforceShare',operands:[rr[0],rr[2]]})];
  }
  if(q.id==='age-triangle'){
   var pp=q.figures[0].points;
   pairs=[comparison(pp[0].name,pp[1].name,'유소년 부양비가',pp[0].values[0]/pp[0].values[1],pp[1].values[0]/pp[1].values[1],'유소년 인구를 청장년층 인구로 나눠 비교한다.',{quantity:'youngDependencyTriangle',operands:pp.slice(0,2)}),
    comparison(pp[1].name,pp[2].name,'노년 부양비가',pp[1].values[2]/pp[1].values[1],pp[2].values[2]/pp[2].values[1],'노년 인구를 청장년층 인구로 나눠 비교한다.',{quantity:'oldDependencyTriangle',operands:pp.slice(1,3)}),
    comparison(pp[0].name,pp[2].name,'노령화 지수가',pp[0].values[2]/pp[0].values[0],pp[2].values[2]/pp[2].values[0],'노년 인구를 유소년 인구로 나눠 비교한다.',{quantity:'agingTriangle',operands:[pp[0],pp[2]]})];
  }
  if(q.id==='urban-rural-scatter'){
   var points=q.figures[0].points,groups=[0,1,2].map(function(i){return{a:points[2*i],b:points[2*i+1]};});
   function grow(g){return(g.b.x+g.b.y)/(g.a.x+g.a.y)-1;}
   function urban(g){return g.b.y/(g.b.x+g.b.y)-g.a.y/(g.a.x+g.a.y);}
   pairs=[comparison(L[0],L[1],'총인구 증가율이',grow(groups[0]),grow(groups[1]),'도시 인구와 촌락 인구를 합해 두 시점의 총인구를 구한다.',{quantity:'scatterTotalGrowth',operands:groups.slice(0,2)}),
    comparison(L[1],L[2],'도시화율 상승 폭이',urban(groups[1]),urban(groups[2]),'각 시점의 도시 인구÷총인구를 구해 두 비율의 차이를 비교한다.',{quantity:'scatterUrbanChange',operands:groups.slice(1,3)}),
    pair('촌락 인구가 증가한 지역에서도 도시화율이 상승할 수 있다.','도시화율이 상승한 지역은 촌락 인구가 반드시 감소했다.','두 인구의 증가율이 다르면 도시·촌락 인구가 함께 늘면서 도시화율이 상승할 수 있다.',{op:'urbanPopulationVsRate'})];
  }
  if(q.id==='urban-change'||q.id==='population-pyramid'){
   // Necessary quantities stay supplied under anonymous row labels. Removing
   // their table would make head counts unanswerable from normalized plots.
   x.tables.forEach(function(t){t.rows.forEach(function(row){var i=(q.assignment||[]).indexOf(row[0]);if(i>=0)row[0]=L[i];});});
  }
  if(q.id==='population-pyramid'){
   var sex=q.pairs.filter(function(p){return p.check.op==='sexRatio';});
   pairs=sex.map(function(p,i){var a=p.check,b=sex[(i+1)%sex.length].check;return comparison(L[i],L[(i+1)%sex.length],'30~39세 성비가',a.male/a.female*100,b.male/b.female*100,'같은 연령 집단의 남성 인구를 여성 인구로 나눠 비교한다.',{quantity:'sexRatio',operands:[a,b]});});
   var u=q.assignment.indexOf('아랍 에미리트');pairs.push(pair(L[u]+'의 청장년층 남성 집중은 노동 이주의 영향과 관련 있다.',L[u]+'의 청장년층 남성 집중은 출생 성비만으로 설명된다.','산유국으로 유입된 외국인 노동자의 성·연령 구성을 연결한다.',{op:'laborMigrationPyramid',name:'아랍 에미리트'}));
  }
  if(q.id==='energy-composition'){
   x.stage=clone(q.stage1);direct=true; // retain country inference, discard free denominator slogans
  }
  if(['eu-trade-arrows','trade-composition-triangle','bloc-trade-bars','fossil-denominators'].includes(q.id)){
   x.stage=clone(q.stage1);direct=true;
  }
  if(q.id==='trade-bubble'){
   x.condition='원의 면적은 1인당 무역액, 원의 중심은 수출액과 수입액이다. 무역액은 수출액과 수입액의 합이다.';
   pairs=[pair('2013년 A는 C보다 인구가 적다.','2013년 A는 C보다 인구가 많다.','수출액+수입액을 1인당 무역액으로 나눠 비교한다. A의 큰 1인당 무역액을 총인구로 오독하지 않는다.',{op:'tradeFigureComparison',basis:'population'}),
    pair('B는 두 시점 모두 무역 적자를 기록했다.','B는 두 시점 모두 무역 흑자를 기록했다.','B는 두 시점 모두 수입액이 수출액보다 크다.',{op:'tradeFigureComparison',basis:'balance'}),
    pair('B의 무역 적자액은 2009년보다 2013년에 많다.','B의 무역 적자액은 2009년보다 2013년에 적다.','각 시점 수입−수출의 차이를 비교한다. 2013년의 차이가 더 크다.',{op:'tradeFigureComparison',basis:'deficitChange'})];
  }
  if(q.id==='gdp-map-denominators'){
   var gr=q.tables[0].rows,ge=gr.find(function(row){return row[0]==='독일';}),fr=gr.find(function(row){return row[0]==='프랑스';}),uk=gr.find(function(row){return row[0]==='영국';});
   pairs=[comparison('독일','프랑스','인구가',ge[1]/ge[2],fr[1]/fr[2],'총 GDP÷1인당 GDP로 같은 해 인구를 비교한다.',{quantity:'gdpPopulation',operands:[ge,fr]}),
    comparison('독일','영국','인구가',ge[1]/ge[2],uk[1]/uk[2],'총 GDP와 1인당 GDP의 분모 관계를 적용한다.',{quantity:'gdpPopulation',operands:[ge,uk]}),
    pair('독일과 프랑스는 모두 유럽 연합(EU) 회원국이다.','영국과 프랑스는 모두 유럽 연합(EU) 회원국이다.','영국은 EU에서 탈퇴했으며 독일·프랑스는 회원국이다.',{op:'euMembership'})];
  }
  if(q.id==='urban-radar'){
   var values=q.figures[0].series;
   pairs=geographic(q).concat([comparison(L[0],L[1],'도시화율이',values[0].values[1],values[1].values[1],'도시화율 축의 상대값을 같은 기준에서 비교한다.',{op:'radarUrbanComparison'})]);
  }
  if(q.id==='energy-per-capita'||q.id==='unequal-energy-axis'){
   // Both metrics are givens in exam comparisons; names are the inference.
   // Do not append unrelated false claims about unequal axes to a plain table.
   var er=q.tables[0].rows,names=er.map(function(row){return row[0];}),perms=[];
   names.forEach(function(a,i){names.forEach(function(b,j){if(i===j)return;var c=names.find(function(_,k){return k!==i&&k!==j;});perms.push([a,b,c].join(' · '));});});
   x.tables=[clone(q.tables[0])];x.tables[0].rows.forEach(function(row,i){row[0]=L[i];});
   x.figures.forEach(function(f,i){f.name=L[i];});
   x.condition='(가)~(다)는 각각 미국, 중국, 인도 중 하나이다. 같은 해 총에너지 소비량과 1인당 소비량이다.';
   x.stage={question:'(가)~(다)에 해당하는 국가를 순서대로 고른 것은?',options:perms,answer:perms.indexOf(names.join(' · ')),explain:'총량이 가장 큰 중국, 1인당 소비가 가장 큰 미국, 상대적으로 작은 1인당 소비의 인도를 두 지표로 함께 대응한다.'};
   x.identification=names;direct=true;
  }
  if(q.id==='migrant-stock'&&extra){
   var mr=q.tables[0].rows,names=mr.map(function(row){return row[0];}),v=names.map(function(n){return extra.demography.countries[n]['2020'];});
   x.figures=[];x.tables=[{headers:['자료','출생률(‰)','사망률(‰)','인구(명)','미국 거주 이민자(명)'],rows:mr.map(function(row,i){return[L[i],v[i].birthPerThousand,v[i].deathPerThousand,v[i].population,row[1]];}),caption:'2020년 · 미국 거주 이민자는 해당 시점의 인원'}];
   x.condition='(가)~(다)는 각각 독일, 멕시코, 인도 중 하나이다.';x.identification=names;
   var ix=names.indexOf('인도'),mx=names.indexOf('멕시코'),de=names.indexOf('독일');
   pairs=[comparison(L[ix],L[mx],'자연 증가율이',v[ix].birthPerThousand-v[ix].deathPerThousand,v[mx].birthPerThousand-v[mx].deathPerThousand,'출생률−사망률을 비교한다.',{quantity:'migrantNaturalRate',operands:[v[ix],v[mx]]}),
    comparison(L[ix],L[mx],'자연 증가 인원이',v[ix].population*(v[ix].birthPerThousand-v[ix].deathPerThousand)/1000,v[mx].population*(v[mx].birthPerThousand-v[mx].deathPerThousand)/1000,'같은 해 인구×자연 증가율÷1000을 비교한다.',{quantity:'migrantNaturalPeople',operands:[v[ix],v[mx]]}),
    pair(L[de]+'는 유럽 연합(EU) 회원국이다.',L[de]+'는 동남아시아 국가 연합(ASEAN) 회원국이다.','독일은 EU 회원국이다.',{op:'geographicFact',name:'독일',set:'bloc',value:'eu'})];
  }
  if(q.id==='renewables-denominators'){
   var raw=q.tables[0],names=q.assignment,totals=names.map(function(n){return raw.rows.find(function(row){return row[0]===n;}).slice(1).reduce(function(a,b){return a+b;},0);}),shares=q.figures[0].values;
   x.tables=[{headers:['자료','제시한 네 범주 발전량 합(TWh)'],rows:totals.map(function(t,i){return[L[i],Math.round(t*1000)/1000];}),caption:'제시 범주의 합 · 전체 에너지 소비량과 구별'}];
   var ci=names.indexOf('중국'),br=names.indexOf('브라질'),us=names.indexOf('미국');
   pairs=[comparison(L[ci],L[br],'수력 발전량이',totals[ci]*shares[ci][0]/100,totals[br]*shares[br][0]/100,'제시 발전량 합×수력 비중으로 비교한다.',{quantity:'renewableHydroAmount',totals:totals,shares:shares,indices:[ci,br],column:0}),
    comparison(L[ci],L[us],'풍력 발전량이',totals[ci]*shares[ci][1]/100,totals[us]*shares[us][1]/100,'제시 발전량 합×풍력 비중으로 비교한다.',{quantity:'renewableWindAmount',totals:totals,shares:shares,indices:[ci,us],column:1}),
    pair(L[br]+'는 포르투갈어를 공용어로 사용한다.',L[br]+'는 에스파냐어를 공용어로 사용한다.','브라질의 포르투갈 식민 역사를 연결한다.',{op:'geographicFact',name:'브라질',set:'latinLanguage',value:'portuguese'})];
  }
  if(q.id==='australia-trade-change'){
   // 2026-09-11 / 2026-CSAT-07 identify partners, not export/import by a key.
   var partners=shuffle(['영국','중국','일본'],r);
   x.figures.forEach(function(f,i){f.name=i?'수입':'수출';f.categories=['영국','중국','일본'].map(function(n){return 'ABC'[partners.indexOf(n)];}).concat(['기타']);});
   x.tables=[];x.condition='A~C는 각각 영국, 중국, 일본 중 하나이다. 각 방향·시점의 호주 교역액 합=100%이다.';
   var uk='ABC'[partners.indexOf('영국')],cn='ABC'[partners.indexOf('중국')],jp='ABC'[partners.indexOf('일본')];
   pairs=[pair(uk+'는 유럽 연합(EU) 회원국이 아니다.',uk+'는 유럽 연합(EU) 회원국이다.','영국은 2020년 EU에서 탈퇴했다.',{op:'partnerKnowledge',name:'영국'}),
    pair(jp+'는 '+cn+'보다 노년 인구 비율이 높다.',jp+'는 '+cn+'보다 노년 인구 비율이 낮다.','일본은 중국보다 고령화 수준이 높다.',{op:'partnerKnowledge',name:'일본'}),
    pair(cn+'와 '+jp+'는 모두 APEC 회원국이다.',uk+'와 '+jp+'는 모두 APEC 회원국이다.','중국·일본·호주는 APEC 회원국이며 영국은 아니다.',{op:'partnerKnowledge',name:'APEC'})];
   x.identification=partners;x.identificationLabels=['A','B','C'];
  }
  if(['sea-ice-anomaly','ozone-area','ice-ozone-maps'].includes(q.id)){
   var ice=q.id==='sea-ice-anomaly',ozone=q.id==='ozone-area';
   pairs=ice?[
    pair('자료의 장기 변화는 대기 중 온실가스 증가와 관련 있다.','자료의 장기 변화는 성층권 오존량 증가만으로 설명된다.','북극 해빙 감소를 지구 온난화와 연결한다.',{op:'environmentCause',issue:'warming'}),
    pair('기후 변화 대응을 위한 국제 합의에는 파리 협정이 있다.','기후 변화 대응을 위한 국제 합의에는 람사르 협약이 있다.','파리는 기후 변화, 람사르는 습지 보전이다.',{op:'environmentTreaty',issue:'warming'}),q.pairs.find(function(p){return p.check.op==='trendVsFluctuation';})
   ]:ozone?[
    pair('오존층 감소는 지표에 도달하는 자외선 증가를 일으킬 수 있다.','오존층 감소는 지표에 도달하는 자외선 감소를 일으킬 수 있다.','성층권 오존은 자외선을 흡수한다.',{op:'environmentCause',issue:'ozone'}),
    pair('이 문제에 직접 대응하는 국제 규제는 몬트리올 의정서이다.','이 문제에 직접 대응하는 국제 규제는 교토 의정서이다.','몬트리올은 오존층 파괴 물질 규제이다.',{op:'environmentTreaty',issue:'ozone'}),
    pair('남극의 9~10월은 봄이다.','남극의 9~10월은 가을이다.','남반구 계절을 그래프의 관측 시기와 연결한다.',{op:'southernOzoneSeason'})
   ]:[
    pair('(가)의 변화는 온실효과 강화와 관련 있다.','(가)의 변화는 성층권 오존층 파괴와 관련 있다.','(가)는 북극 해빙, (나)는 남극 상공 오존량이다.',{op:'environmentCause',issue:'warming'}),
    pair('(나)와 직접 관련된 규제는 몬트리올 의정서이다.','(나)와 직접 관련된 규제는 람사르 협약이다.','오존층 파괴 물질 규제를 적용한다.',{op:'environmentTreaty',issue:'ozone'}),
    pair('(나)의 오존 감소는 지표 자외선 증가로 이어질 수 있다.','(나)의 오존 감소는 지표 자외선 감소로 이어질 수 있다.','자외선 흡수 기능을 연결한다.',{op:'environmentCause',issue:'ozone'})
   ];
  }
  if(q.id==='religion-top-two'){
   var traits={'이슬람교':['서남아시아에서 기원한 보편 종교이다.','남부 아시아에서 기원한 민족 종교이다.'],'불교':['남부 아시아에서 기원한 보편 종교이다.','서남아시아에서 기원한 민족 종교이다.'],'힌두교':['남부 아시아에서 기원한 민족 종교이다.','서남아시아에서 기원한 보편 종교이다.']};
   pairs=q.assignment.map(function(n,i){return pair(L[i]+'는 '+traits[n][0],L[i]+'는 '+traits[n][1],'국가별 종교 순위로 기호를 복원한 뒤 기원지와 전파 성격을 대응한다. '+n+': '+traits[n][0],{op:'religionOrigin',religion:n});});
   x.condition='무종교를 제외한 국가별 종교 순위이다. (가)·(나)·(다)는 각각 불교, 이슬람교, 힌두교 중 하나이다.';
  }
  // Country recognition has a purpose only if it is still needed at the final
  // judgment. Insert a sourced regional fact instead of a third cyclic ratio.
  var facts=geographic({assignment:x.identification||q.assignment});
  if(!direct&&!x.stage&&facts.length&&pairs.length>=2&&!['religion-selected','religion-other','religion-relative'].includes(q.id)){
   var numbers=pairs.filter(function(p){return p&&p.check.op==='examComparison';});
   if(numbers.length>2)pairs=pairs.filter(function(p){return numbers.indexOf(p)<0;}).concat(shuffle(numbers,r).slice(0,2));
   var fact=shuffle(facts,r)[0];pairs=shuffle(pairs.filter(Boolean),r).slice(0,3).concat([fact]);
  }
  // A direct recognition/calculation task stands on its own; never append a
  // compulsory, unrelated 'all residents are identical' second question.
  pairs=pairs.filter(function(p,i,a){return p&&a.findIndex(function(v){return v&&v.yes===p.yes&&v.no===p.no;})===i;});
  if(!x.stage){
   if(direct||pairs.filter(Boolean).length<2)x.stage=clone(q.stage1);
   else{x.stage=choose(pairs,r);x.judgment=true;}
  }
  if(!x.judgment){
   // Six permutation choices were a generator accident, not extra difficulty.
   var keep=shuffle(x.stage.options.map(function(_,i){return i;}).filter(function(i){return i!==x.stage.answer;}),r).slice(0,4);keep=shuffle([x.stage.answer].concat(keep),r);
   var oldAnswer=x.stage.answer;x.stage.options=keep.map(function(i){return x.stage.options[i];});x.stage.answer=keep.indexOf(oldAnswer);
   x.stage.explain=x.stage.explain==='제시한 기준표의 값과 그래프의 값을 대응한다.'?'자료의 분포·계절성·구성으로 대상을 식별한다. '+q.assignment.join(' · '):x.stage.explain;
  }
  // Reorder stand-alone supplied choices as well (including custom tasks).
  if(q.id==='environment-news'){var order=shuffle(x.stage.options.map(function(_,i){return i;}),r),old=x.stage.answer;x.stage.options=order.map(function(i){return x.stage.options[i];});x.stage.answer=order.indexOf(old);}
  if(!Object.prototype.hasOwnProperty.call(x,'identification'))x.identification=q.stationNames||q.assignment||null;
  return x;
 }
 return{prepare:prepare,paused:PAUSED};
}
return{create:create};
});
