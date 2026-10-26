/* Goal-specific reading exercises. Synthetic quantities are explicitly labelled. */
(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f();else r.WGRemainingMaterials=f();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function create(data,D,H){
 var shuffle=H.shuffle,seedState=H.seedState,base=H.base,pair=H.pair,finish=H.finish,table=H.table,round=H.round,fmt=H.fmt,A=H.math,L=['(가)','(나)','(다)'];
 function start(id,title,seed,source){return base(id,title,seed,source);}
 function winner(q,names,values,question,explain){q.stage1={question:question,options:names,answer:values.indexOf(Math.max.apply(null,values)),explain:explain};}
 function comp(values){var total=A.sum(values);if(!(total>0))throw Error('Empty composition');return values.map(function(x){return x/total*100;});}
 function compare(goal,a,b,subject,object,noun){return pair(goal,subject+'는 '+object+'보다 '+noun+' '+(a>b?'크다.':'작다.'),subject+'는 '+object+'보다 '+noun+' '+(a>b?'작다.':'크다.'),'이번 자료의 같은 지표·단위끼리 비교한다.',{op:'compare',a:a,b:b});}
 function reference(q,names,headers,rows){q.assignment=names;q.tables.push(table(['후보'].concat(headers),rows.map(function(v,i){return[names[i]].concat(v);}).sort(function(a,b){return a[0].localeCompare(b[0]);}),'이 문항의 대응 기준'));
 }
 function grainSize(seed){
  var r=seedState(seed),names=shuffle(['선상지·바하다','사구'],r),q=start('grain-size','입도 분포와 평균·분급',seed,'강의 G034-1 비교 관계로 만든 모식 자료');
  q.note='평균 입경과 분포 폭의 비교만 반영한 모식 자료이다. 특정 지형의 실제 측정값이나 보편적인 수치 문턱이 아니다.';
  var v=names.map(function(n){return n==='사구'?[0,0,15,70,15,0]:[10,15,20,25,20,10];});
  q.assignment=names;q.figures.push({kind:'line',x:[1,2,3,4,5,6],xLabel:'입경 구간(왼쪽에서 오른쪽으로 커짐)',yLabel:'각 구간에 속하는 입자 비율(%)',series:v.map(function(x,i){return{name:L[i],values:x};})});
  q.tables.push(table(['대상','입도 비교 기준'],[['선상지·바하다','사구보다 평균 입경이 크고 크기 분포가 넓음'],['사구','상대적으로 작은 모래, 좁은 입경 분포']],'이번 비교의 강의 관계'));
  // The fan schematic must actually be coarser, not merely broader.
  v=names.map(function(n){return n==='사구'?[0,30,65,5,0,0]:[5,5,15,20,25,30];});q.figures[0].series=v.map(function(x,i){return{name:L[i],values:x};});
  q.pairs.push(pair('G034-1','입경 분포가 좁게 모인 자료가 상대적으로 분급이 좋다.','입경 분포가 넓게 퍼진 자료가 상대적으로 분급이 좋다.','분급은 입자 크기가 얼마나 고른가이다. 평균 입경과 분포 폭은 다른 축이다.',{op:'sorting',values:v}));
  q.pairs.push(pair('G034-1','선상지·바하다는 이 비교에서 사구보다 평균 입자가 크다.','사구는 이 비교에서 선상지·바하다보다 평균 입자가 크다.','모식 분포의 무게중심과 폭을 각각 비교한다.',{op:'grainMean',values:v,names:names}));
  return finish(q,r);
 }
 function lakes(seed){
  var r=seedState(seed),names=shuffle(['빙하호','석호','플라야'],r),raw={'빙하호':[100,.1],'석호':[5,15],'플라야':[1,100]},v=names.map(function(n){return raw[n];}),q=start('lake-types','수심·염분으로 호수 구별',seed,'강의 G034-2 · 모식 자료');
  q.note='빙하호의 깊은 수심, 플라야의 높은 염분이라는 강의 비교를 반영한 모식 사례이다. 모든 호수의 수심·염분을 이 수치로 일반화하지 않는다.';
  reference(q,names,['수심(m)','염분(g/kg)'],v);q.figures.push({kind:'scatter',zero:true,xLabel:'염분(g/kg)',yLabel:'수심(m)',points:v.map(function(a,i){return{name:L[i],x:a[1],y:a[0],size:1};})});
  q.pairs.push(pair('G034-2','이 자료에서 가장 깊은 호수는 빙하호이다.','이 자료에서 가장 깊은 호수는 플라야이다.','호수의 형성 유형과 이번 표의 값을 대응한다.',{op:'lakeReading'}));
  q.pairs.push(pair('G034-2','플라야는 이 자료에서 염분이 가장 높다.','플라야는 이 자료에서 염분이 가장 낮다.','건조 지역의 증발·염류 집적과 연결하는 모식 비교이다.',{op:'lakeSalinity'}));
  return finish(q,r);
 }
 function solarRoute(seed){
  var r=seedState(seed),month=seed%2?1:7,names=shuffle(['마닐라→도쿄','도쿄→마닐라','도쿄→웰링턴'],r),q=start('solar-route','여행 경로와 낮 길이 변화',seed,'기존 도시 위도 · 태양 적위 근사 계산');
  var d=A.declination([15,196][month===1?0:1]),v=names.map(function(n){var ns=n.split('→');return ns.map(function(n){return round(A.daylight(data.cities[n].lat,d),3);});});
  q.note=month+'월 같은 날에 이동하는 경우이다. 지형·대기 굴절을 제외한 계산값이며, 동서 이동이나 고도를 낮 길이의 원인으로 쓰지 않는다.';
  q.tables.push(table(['경로','출발 낮 길이(시간)','도착 낮 길이(시간)'],names.map(function(n,i){return[n].concat(v[i]);}),month+'월 중순 근삿값'));
  winner(q,names,v.map(function(x){return x[1]-x[0];}),'출발지보다 도착지에서 낮 길이가 가장 많이 늘어나는 경로는?','두 값의 차이를 비교한다. 북반구 겨울에는 북쪽으로 갈수록 낮이 짧아지며 남반구는 여름이다.');
  q.pairs.push(pair('G023-2','북반구의 두 도시 사이에서 '+month+'월에 북쪽으로 이동하면 낮 길이는 '+(month===1?'짧아진다.':'길어진다.'),'북반구의 두 도시 사이에서 '+month+'월에 북쪽으로 이동하면 낮 길이는 '+(month===1?'길어진다.':'짧아진다.'),'지점 위도와 그날의 태양 적위를 함께 적용한다.',{op:'solarRoute',month:month,declination:d}));
  q.pairs.push(pair('G023-2','같은 남북 이동이라도 계절이 바뀌면 낮 길이 변화 방향이 달라질 수 있다.','북쪽으로 이동하면 계절·반구와 관계없이 낮이 항상 길어진다.','낮 길이는 위도뿐 아니라 계절의 영향을 받는다.',{op:'routeSeason'}));
  return finish(q,r);
 }
 function vitalScatter(seed){
  var r=seedState(seed),names=shuffle(['일본','니제르','독일'],r),rows=names.map(function(n){var d=data.continuation.rates.countries[n];return[round(d.birth,2),round(d.death,2)];}),q=start('vital-scatter','출생률·사망률 산점도',seed,'세계은행 WDI · 2023년 · ‰');
  reference(q,names,['출생률(‰)','사망률(‰)'],rows);q.note='가로 출생률, 세로 사망률이다. 대각선 위쪽은 사망률>출생률이므로 자연 감소이다. 국제 이동은 별도 자료가 필요하다.';
  q.figures.push({kind:'scatter',diagonal:true,zero:true,xLabel:'출생률(‰)',yLabel:'사망률(‰)',points:rows.map(function(v,i){return{name:L[i],x:v[0],y:v[1],size:1};})});
  rows.forEach(function(v,i){q.pairs.push(pair('G054-4',L[i]+'의 자연 증가율은 약 '+fmt(v[0]-v[1],2)+'‰이다.',L[i]+'의 자연 증가율은 약 '+fmt(v[1]-v[0]+10,2)+'‰이다.','가로 좌표−세로 좌표이다. 축의 순서를 바꾸어 읽지 않는다.',{op:'subtract',a:v[0],b:v[1],result:v[0]-v[1]}));});
  q.pairs.push(pair('G054-4','사망률이 그대로일 때 출생률이 높아져 점이 오른쪽으로 움직이면 자연 증가율은 높아진다.','사망률이 그대로일 때 출생률이 높아져 점이 오른쪽으로 움직이면 자연 증가율은 낮아진다.','출생률−사망률의 차이가 커진다.',{op:'vitalMovement'}));
  return finish(q,r);
 }
 function dependencyChange(seed){
  var r=seedState(seed),names=shuffle(['차드','튀르키예','일본'],r),q=start('dependency-change','두 시점 부양비 변화',seed,'WDI 연령 구성 · 2010·2023년');q.note='같은 연도의 청장년 비율=100−유소년−노년이다. 노년층 비율 한 항목만으로 총부양비 변화를 정하지 않는다. 강의의 과거 차드 사례와 판본·기간은 다르다.';
  var rows=names.map(function(n){var s=D.countries[n].series;return{name:n,a:A.age(s.young['2010'],s.old['2010']),b:A.age(s.young['2023'],s.old['2023'])};});
  q.tables.push(table(['국가','2010 유소년(%)','2010 노년(%)','2023 유소년(%)','2023 노년(%)'],rows.map(function(x){return[x.name,x.a.y,x.a.o,x.b.y,x.b.o];}),'두 시점 연령 구성'));
  winner(q,names,rows.map(function(x){return x.b.old-x.a.old;}),'노년 부양비 상승 폭이 가장 큰 국가는?','두 시점 각각 노년층÷청장년층×100을 계산한다.');
  rows.forEach(function(x){q.pairs.push(pair('G059-1',x.name+'의 2023년 총부양비는 약 '+fmt(x.b.total)+'이다.',x.name+'의 2023년 총부양비는 약 '+fmt(x.b.y+x.b.o)+'이다.','총부양비의 분모는 전체 인구가 아니라 청장년층이다.',{op:'dependency',young:x.b.y,old:x.b.o,result:x.b.total}));});
  q.pairs.push(pair('G059-1','청장년층 비율이 높아져도 노년 부양비가 높아질 수 있다.','청장년층 비율이 높아지면 노년 부양비는 반드시 낮아진다.','튀르키예의 두 시점에서 노년층 증가와 청장년층 변화를 함께 계산한다.',{op:'dependencyChange',turkiye:rows.find(function(x){return x.name==='튀르키예';})}));
  return finish(q,r);
 }
 function agricultureTriangle(mode,seed){
  var r=seedState(seed),beverage=mode==='beverage-triangle',names=shuffle(beverage?['아시아','아프리카','남아메리카']:['유럽','앵글로아메리카','오세아니아'],r),crops=beverage?['커피','차(생엽)','카카오']:['밀','쌀','옥수수'],raw=names.map(function(n){return crops.map(function(c){return D.agri[n]['qcl-production:'+c];});}),values=raw.map(comp),goal=beverage?'G080-6':'G076-1',q=start(mode,'대륙별 '+(beverage?'기호 작물':'세 곡물')+' 구성',seed,'FAOSTAT QCL · 2023년 · 생산량(t)');
  reference(q,names,crops.map(function(c){return c+' 생산량(t)';}),raw);q.figures.push({kind:'ternary',labels:crops,points:values.map(function(v,i){return{name:L[i],values:v};})});
  q.note='각 대륙의 제시 세 작물 생산량 합=100%이다. 작물별 세계 생산량이 분모인 그래프와 다르다.'+(beverage?' 차는 생엽 중량이다. 가공 차·커피·카카오 제품의 양이나 수출 비율로 바꾸지 않는다.':'');
  values.forEach(function(v,i){q.pairs.push(pair(goal,L[i]+'에서 '+crops[0]+'의 제시 세 작물 중 비중은 약 '+fmt(v[0])+'%이다.',L[i]+'는 세계 '+crops[0]+' 생산량의 약 '+fmt(v[0])+'%를 차지한다.','이 도표의 전체는 해당 대륙의 선택 세 품목 합이다.',{op:'composition',values:raw[i],part:0,result:v[0]}));});
  q.pairs.push(pair(goal,'한 대륙 내부의 구성비가 높다는 것만으로 그 작물의 세계 생산량 대부분을 차지한다고 할 수 없다.','한 대륙 내부의 구성비가 가장 높은 작물은 그 대륙이 세계 생산의 대부분을 차지한다.','분모가 대륙의 선택 품목 합인지, 세계의 그 품목 합인지 구별한다.',{op:'regionalVsWorld'}));
  return finish(q,r);
 }
 function livestockDenominators(seed){
  var r=seedState(seed),q=start('livestock-denominators','세계·아시아·남아시아의 두 단계 분모',seed,'FAOSTAT QCL · 소(물소 제외) · 2023년'),world=D.agri['세계']['qcl-stocks:소'],asia=D.agri['아시아']['qcl-stocks:소'],south=D.agri['남아시아']['qcl-stocks:소'],a=round(asia/world*100,3),s=round(south/asia*100,3);
  q.note='세계 소 전체=100인 비중과 아시아 소 전체=100인 비중을 구별한다. 반올림된 제시 비율로 계산한다. 물소는 제외한다.';
  q.tables.push(table(['지표','비중(%)'],[['세계 소 중 아시아',a],['아시아 소 중 남아시아',s]],'분모가 다른 두 비율'));
  var result=a*s/100,opts=[result,s,a,100-s,100-a].map(function(x){return fmt(x,2)+'%';});q.stage1={question:'세계 소 사육 두수 중 남아시아가 차지하는 비중은 약 얼마인가?',options:opts,answer:0,explain:'세계 중 아시아 비중×아시아 중 남아시아 비중÷100.'};
  q.pairs.push(pair('G079-2','세계 중 남아시아 비중은 약 '+fmt(result,2)+'%이다.','세계 중 남아시아 비중은 약 '+fmt(s,2)+'%이다.','두 단계 비율을 곱해 세계 분모로 바꾼다.',{op:'productShare',a:a,b:s,result:result}));
  q.pairs.push(pair('G079-2','남아시아의 아시아 내 비중은 세계 내 비중보다 크다.','남아시아의 아시아 내 비중과 세계 내 비중은 항상 같다.','아시아는 세계 전체의 일부이다. 같은 분자라도 분모가 달라 비율이 달라진다.',{op:'nestedDenominator'}));
  return finish(q,r);
 }
 function grainExport(seed){
  var r=seedState(seed),names=shuffle(['유럽','앵글로아메리카','오세아니아'],r),v=names.map(function(n){var a=D.agri[n];return[round(a['fbs-production:곡물 전체']/1e6,3),round(a['fbs-exports:곡물 전체']/1e6,3)];}),q=start('grain-export-scatter','곡물 생산·수출 산점도',seed,'FAOSTAT FBS · 곡물 전체(맥주 제외) · 2023년');
  reference(q,names,['생산(백만 t)','수출(백만 t)'],v);q.note='FBS의 동일 품목·연도·환산 기준이다. 지역 교역에는 역내 국가 간 교역도 포함한다. 강의의 과거 비율을 그대로 재현하지 않는다.';
  q.figures.push({kind:'scatter',zero:true,xLabel:'생산량(백만 t)',yLabel:'수출량(백만 t)',points:v.map(function(x,i){return{name:L[i],x:x[0],y:x[1],size:1};})});
  v.forEach(function(x,i){q.pairs.push(pair('G138-1',L[i]+'의 생산량 대비 수출량은 약 '+fmt(x[1]/x[0]*100)+'%이다.',L[i]+'의 생산량 대비 수출량은 약 '+fmt(x[0]/x[1]*100)+'%이다.','원점 기울기는 세로÷가로=수출÷생산이다. 수출량 자체의 순서와 구별한다.',{op:'quotientShare',a:x[1],b:x[0],result:x[1]/x[0]*100}));});
  q.pairs.push(pair('G138-1','수출량이 많은 지역이 생산량 대비 수출 비율도 반드시 높은 것은 아니다.','세로 좌표가 가장 큰 지역이 원점 기울기도 반드시 가장 크다.','비율에는 생산량이라는 분모가 필요하다.',{op:'exportSlope'}));
  return finish(q,r);
 }
 function cropTrade(seed){
  var r=seedState(seed),names=shuffle(['프랑스','미국','아르헨티나'],r),v=names.map(function(n){var s=D.agri[n];return[round(s['tcl-exports:옥수수']/1e6,3),round(s['tcl-imports:옥수수']/1e6,3),s['qcl-production:옥수수']];}),q=start('crop-trade-bubble','수출·수입 좌표와 생산량 원',seed,'FAOSTAT TCL 옥수수 교역 · QCL 생산량 · 2023년');
  reference(q,names,['수출(백만 t)','수입(백만 t)','생산량(t)'],v);q.note='가로 수출, 세로 수입, 원 면적은 생산량에 비례한다. 생산과 교역의 품목은 모두 옥수수 원품목이다. 원의 중심에서 좌표를 읽는다.';
  var max=Math.max.apply(null,v.map(function(x){return x[2];}));q.figures.push({kind:'scatter',zero:true,diagonal:true,xLabel:'수출량(백만 t)',yLabel:'수입량(백만 t)',sizeLabel:'원 면적: 생산량',points:v.map(function(x,i){return{name:L[i],x:x[0],y:x[1],size:x[2]/max*100};})});
  v.forEach(function(x,i){q.pairs.push(pair('G076-2',L[i]+'는 '+(x[0]>x[1]?'순수출':'순수입')+' 지역이다.',L[i]+'는 '+(x[0]>x[1]?'순수입':'순수출')+' 지역이다.','가로 수출−세로 수입의 부호를 본다. 원 크기는 생산량으로 별개의 지표이다.',{op:'netTrade',exports:x[0],imports:x[1],result:x[0]-x[1]}));});
  return finish(q,r);
 }
 function fossil(mode,seed){
  var r=seedState(seed),country=mode==='fossil-remainder',names=shuffle(country?['브라질','러시아','인도']:['Europe','Oceania','Asia'],r),labels=country?names:names.map(function(n){return{Europe:'유럽',Oceania:'오세아니아',Asia:'아시아'}[n];}),raw=names.map(function(n){var x=country?D.fuels[n]:D.regions[n];return['coal','oil','gas'].map(function(k){return x[k+'_production'];});}),shares=raw.map(comp),q=start(mode,country?'세 화석 연료 합에서 나머지 복원':'대륙별 세 화석 연료 생산 구성',seed,'OWID/EI·EIA · 2023년 · 생산량 TWh');
  q.note='분모는 석탄·석유·가스 생산량의 합이다. 수력·원자력·신재생은 포함되지 않는다.'+(country?' 초기 BRICS 중 제시한 세 나라만 비교한다.':' OWID 원지역 집계이며 North America와 UN Northern America를 혼합하지 않는다. 유럽 집계의 러시아 포함 여부는 원지역 정의를 따른다.');
  if(!country){reference(q,labels,['석탄(TWh)','석유(TWh)','가스(TWh)'],raw);q.figures.push({kind:'ternary',labels:['석탄','석유','천연가스'],points:shares.map(function(v,i){return{name:L[i],values:v};})});}
  else{q.tables.push(table(['국가','석탄(%)','가스(%)'],shares.map(function(x,i){return[names[i],round(x[0],3),round(x[2],3)];}),'세 화석 연료 생산량 합=100% · 석유 비중은 숨김'));winner(q,names,shares.map(function(x){return x[1];}),'세 화석 연료 중 석유 생산 비중이 가장 큰 국가는?','100−석탄 비중−가스 비중으로 석유를 복원한다.');}
  shares.forEach(function(x,i){var goal=country?'G086-4':'G086-3',oil=country?100-round(x[0],3)-round(x[2],3):x[1];q.pairs.push(pair(goal,labels[i]+'의 세 화석 연료 중 석유 비중은 약 '+fmt(oil)+'%이다.',labels[i]+'의 전체 에너지 생산량 중 석유 비중은 이 표만으로 약 '+fmt(oil)+'%라고 확정할 수 있다.','선택한 세 화석 연료 합과 모든 에너지 합은 다르다.',{op:'fossilRemainder',coal:round(x[0],3),gas:round(x[2],3),result:100-round(x[0],3)-round(x[2],3)}));});
  q.pairs.push(pair(country?'G086-4':'G086-3','구성비가 높아도 총생산량이 반드시 많은 것은 아니다.','석탄 구성비가 가장 높은 지역이 석탄 총생산량도 반드시 가장 많다.','실제 생산량 비교에는 해당 구성의 총량도 필요하다.',{op:'fossilComposition'}));
  return finish(q,r);
 }
 function energyPC(mode,seed){
  var r=seedState(seed),names=shuffle(['중국','미국','인도'],r),rows=names.map(function(n){var s=D.fuels[n];return[s.primary_energy_consumption,s.energy_per_capita];}),q=start(mode,mode==='unequal-energy-axis'?'서로 다른 세로축의 에너지 막대':'총에너지와 1인당 소비량',seed,'OWID/EI·EIA · 2023년');
  q.note='총량(TWh)과 1인당 소비량(kWh/명)을 구별한다. 이번 자료의 수치를 읽으며, 그래프 높이만으로 값을 바꾸어 비교하지 않는다.';
  q.tables.push(table(['국가','총소비량(TWh)','1인당(kWh/명)'],rows.map(function(x,i){return[names[i],round(x[0],3),round(x[1],3)];}),'같은 해의 두 지표'));
  winner(q,names,rows.map(function(x){return x[1];}),'1인당 에너지 소비량이 가장 많은 국가는?','총량을 기준으로 고르지 않는다.');
  if(mode==='unequal-energy-axis')names.forEach(function(n,i){var max=Math.ceil(rows[i][1]/10000)*10000; q.figures.push({kind:'grouped-bars',name:n,labels:['2023'],categories:['1인당'],values:[[rows[i][1]]],maximum:max,yLabel:'kWh/명 · 이 그래프의 축 최대 '+max});});
  q.pairs.push(pair('G085-4','중국은 미국보다 총소비량이 많고, 미국은 중국보다 1인당 소비량이 많다.','중국은 미국보다 총소비량이 많으므로 1인당 소비량도 더 많다.','총량은 국가 전체, 1인당 값은 인구를 분모로 삼는다.',{op:'energyPerCapita',china:D.fuels['중국'],usa:D.fuels['미국']}));
  q.pairs.push(pair(mode==='unequal-energy-axis'?'G085-5':'G085-4','나라별 축 최대값이 다르면 막대 높이의 비율이 실제 소비량의 비율과 같지 않을 수 있다.','나라별 축 최대값이 달라도 막대가 같은 높이면 실제 값도 반드시 같다.','세로축 눈금과 단위를 먼저 읽는다.',{op:'unequalAxes'}));
  return finish(q,r);
 }
 function energyProduction(seed){
  var r=seedState(seed),names=shuffle(['중국','미국','오스트레일리아'],r),rows=names.map(function(n){var s=D.fuels[n];return[round(s.coal_production,3),round(s.coal_consumption,3)];}),q=start('coal-production-consumption','생산량 대비 소비량과 세계 비중',seed,'OWID/EI·EIA · 석탄 · 2023년');
  reference(q,names,['생산(TWh)','소비(TWh)'],rows);q.note='생산 대비 소비 비율의 분모는 자국 생산량이다. 수입 의존도나 수출 비율과 같은 지표가 아니다. 좌표축의 세계 생산·세계 소비 분모도 서로 다르다.';
  var wp=D.regions.World.coal_production,wc=D.regions.World.coal_consumption;
  q.figures.push({kind:'scatter',zero:true,xLabel:'세계 석탄 생산 중 비중(%)',yLabel:'세계 석탄 소비 중 비중(%)',points:rows.map(function(x,i){return{name:L[i],x:x[0]/wp*100,y:x[1]/wc*100,size:1};})});
  rows.forEach(function(x,i){q.pairs.push(pair('G083-2',L[i]+'의 생산량 대비 소비량 비율은 약 '+fmt(x[1]/x[0]*100)+'%이다.',L[i]+'의 수입 의존도는 이 표만으로 약 '+fmt(x[1]/x[0]*100)+'%라고 확정된다.','소비÷생산 비율이다. 국내 생산·소비의 차이를 물리적 수입 비율로 바꾸지 않는다.',{op:'quotientShare',a:x[1],b:x[0],result:x[1]/x[0]*100}));});
  q.pairs.push(pair('G083-4','두 좌표의 분모는 각각 세계 석탄 생산량과 세계 석탄 소비량이다.','두 좌표는 모두 해당 국가의 석탄 생산량을 100으로 만든 값이다.','세계의 같은 자원 안에서도 생산과 소비의 전체값은 구분한다.',{op:'worldProductionVsConsumption',worldProduction:wp,worldConsumption:wc}));
  return finish(q,r);
 }
 function renewables(seed){
  var r=seedState(seed),names=shuffle(['중국','브라질','미국'],r),keys=['hydro','wind','solar','other'],raw=names.map(function(n){var e=D.electricity[n];return keys.map(function(k){return e.values[k]*e.generation/100;});}),v=raw.map(comp),q=start('renewables-denominators','선택 발전원 합과 세계 발전원 분모',seed,'Ember/OWID · 2023년 · 네 범주 선택');
  q.note='수력·풍력·태양광·기타의 네 범주 합을 100으로 만들었다. 기타에는 원자료의 잔여 발전 범주가 포함된다. 이 값은 세계 총발전량 중 비율이 아니다. 지열을 기타와 같은 단일 발전원으로 취급하지 않는다.';
  reference(q,names,['수력(TWh)','풍력(TWh)','태양광(TWh)','기타(TWh)'],raw.map(function(v){return v.map(function(x){return round(x,3);});}));
  q.figures.push({kind:'stacked',labels:L,categories:['수력','풍력','태양광','기타'],values:v,xLabel:'선택 네 범주 합=100%'});
  q.pairs.push(pair('G089-5','이 그래프의 한 막대는 해당 국가의 선택 네 범주 발전량 합을 100으로 둔다.','이 그래프의 수력 비중은 세계 총발전량을 분모로 계산했다.','국가 내부 선택 발전원 합과 세계 총발전량을 구별한다.',{op:'selectedGeneration'}));
  q.pairs.push(pair('G138-3','세계의 각 발전원을 각각 100으로 만든 그래프는 이 그래프와 분모가 다르다.','세계의 각 발전원을 각각 100으로 만든 그래프와 이 그래프의 비율은 그대로 곱해도 된다.','전체 범위·연도·대상을 먼저 맞춰야 한다.',{op:'generationDenominators'}));
  q.pairs.push(pair('G085-3','전력 생산 구성과 1차 에너지 소비 구성은 같은 비율이 아니다.','수력 발전 비중이 높으면 모든 수송·난방 에너지도 그 비율만큼 수력이다.','1차 에너지는 발전 외 직접 사용하는 에너지도 포함한다.',{op:'electricityVsPrimary'}));
  var ch=D.electricity['중국'],br=D.electricity['브라질'];q.pairs.push(pair('G085-6','중국의 수력 발전량과 브라질의 수력 발전량은 각각 총발전량×수력 비중으로 비교한다.','수력 비중이 높은 국가가 총발전량과 관계없이 수력 발전량도 반드시 많다.','국가별 발전량이라는 분모를 곱해야 실제량을 구할 수 있다.',{op:'hydroAmount',china:ch.generation*ch.values.hydro/100,brazil:br.generation*br.values.hydro/100}));
  return finish(q,r);
 }
 function australiaTrade(seed){
  var r=seedState(seed),names=shuffle(['Exports','Imports'],r),labels=names.map(function(n){return n==='Exports'?'수출':'수입';}),q=start('australia-trade-change','오스트레일리아의 상대국 비중 변화',seed,'호주 DFAT 공식 표 · 1950-51 회계연도 / 2020 역년');
  q.assignment=labels;q.note='과거는 1950-51 회계연도, 이후는 2020 역년이다. 각 방향·각 시점의 호주 상품 교역 총액을 각각 100으로 삼는다. 총액의 단위·시기가 달라 비중을 무역액 변화로 읽지 않는다.';
  names.forEach(function(n,i){var d=D.australia[n],rows=['United Kingdom','China','Japan'].map(function(k){return d[k];}),a=rows.map(function(x){return round(x.historical,3);}),b=rows.map(function(x){return round(x.later,3);});q.figures.push({kind:'stacked',name:L[i],labels:['1950-51','2020'],categories:['영국','중국','일본','기타'],values:[a.concat(100-A.sum(a)),b.concat(100-A.sum(b))],xLabel:'각 방향·시점의 호주 교역액=100%'});});
  q.tables.push(table(['방향','1950-51 영국 비중(%)','2020 중국 비중(%)'],['Exports','Imports'].map(function(n){return[n==='Exports'?'수출':'수입',round(D.australia[n]['United Kingdom'].historical,3),round(D.australia[n].China.later,3)];}),'방향 대응 기준'));
  q.pairs.push(pair('G104-3','두 시점 사이에 영국 비중은 줄고 중국 비중은 커졌다.','두 시점 사이에 영국 비중은 커지고 중국 비중은 줄었다.','제시된 각 방향 안에서 시점별 비중을 비교한다.',{op:'australiaPartnerChange'}));
  q.pairs.push(pair('G104-3','수출 비중과 수입 비중의 분모는 서로 다르다.','중국의 수출 상대국 비중과 수입 상대국 비중이 같으면 양방향 금액도 반드시 같다.','수출 총액과 수입 총액은 각각 다른 전체이다.',{op:'tradeDirectionDenominator'}));
  return finish(q,r);
 }
 function environmentNews(seed){
  var r=seedState(seed),names=shuffle(['RE100 납품 요구','수입 폐기물 반송'],r),q=start('environment-news','기사의 행위와 대응 수단',seed,'강의 G120-2 사례를 바탕으로 앱이 작성한 모식 기사');
  q.note='실제 보도문을 인용한 것이 아니라 행위와 협약의 대상을 판정하는 연습용 기사이다.';q.assignment=names;
  q.tables.push(table(['기사','상황'],names.map(function(n,i){return[L[i],n==='RE100 납품 요구'?'한 기업이 납품 업체에 공장 사용 전력을 재생에너지로 조달하라고 요구했다.':'한 국가가 통보·동의 절차를 거치지 않고 반입된 폐기물을 수출국으로 돌려보냈다.'];}),'행위의 직접 대상을 읽는다'));
  q.pairs.push(pair('G120-2','사용 전력의 재생에너지 조달 요구는 RE100과 연결된다.','사용 전력의 재생에너지 조달 요구는 람사르 협약의 직접 대상이다.','RE100의 대상은 사용 전력이다. 모든 연료·에너지를 뜻하지 않는다.',{op:'re100News'}));
  q.pairs.push(pair('G120-2','폐기물의 국가 간 이동·반송은 바젤 협약과 연결된다.','폐기물의 국가 간 이동·반송은 오존층 보호를 위한 몬트리올 의정서의 직접 대상이다.','행위가 해양 투기인지 국가 간 폐기물 이동인지 구별한다.',{op:'baselNews'}));
  return finish(q,r);
 }
 function treatyTree(seed){
  var r=seedState(seed),cities=shuffle(['람사르','몬트리올','파리'],r),q=start('treaty-tree','두 질문의 협약 도시 분류',seed,'강의 G121-2 · 협약 도시·대륙');q.assignment=cities;
  q.note='먼저 유럽에 있는지, 아니면 아시아에 있는지를 묻는다. 아니오 경로를 건너뛰어 두 번째 질문부터 적용하지 않는다.';
  q.figures.push({kind:'decision-tree',nodes:['유럽에 있는가?','(가)','아시아에 있는가?','(나)','(다)'],edges:[[0,1,'예'],[0,2,'아니오'],[2,3,'예'],[2,4,'아니오']]});
  // Fixed branch leaves, shuffled city options: do not shuffle the truth of geography.
  q.assignment=['파리','람사르','몬트리올'];
  q.pairs.push(pair('G121-2','아시아의 이란에 있는 람사르는 (나)에 대응한다.','아시아의 이란에 있는 람사르는 유럽 경로인 (가)에 대응한다.','람사르는 이란, 파리는 프랑스, 몬트리올은 캐나다에 있다.',{op:'treatyContinent'}));
  q.pairs.push(pair('G121-2','분류도에서는 앞 질문에서 선택한 경로를 따라 다음 질문을 적용한다.','분류도에서는 앞 질문과 관계없이 모든 도시에 두 번째 질문만 적용한다.','분기 조건의 순서와 적용 대상을 유지한다.',{op:'treeTraversal'}));
  return finish(q,r);
 }
 function ethnicStacks(seed){
  var r=seedState(seed),db=D.ethnicStacks,names=shuffle(Object.keys(db.countries),r),raw=names.map(function(n){return db.countries[n];}),totals=raw.map(A.sum),shares=raw.map(comp),q=start('ethnic-stacks','집단별 누적 인구와 국가 내부 비중',seed,db.exam+' · EBS 공개 원도표 눈금 읽기');
  q.note=db.method+' '+db.zeroNote;q.figures.push({kind:'image',src:db.figure,name:'2015년 원도표의 집단별 인구 합'});
  q.tables.push(table(['국가','총인구(재구성, 천만 명)'].concat(db.categories.map(function(c){return c+'(%)';})),names.map(function(n,i){return[n,totals[i]].concat(shares[i]);}),'원도표 눈금의 근삿값에서 계산한 구성 · 이 표의 표시값 기준'));
  var counts=shares.map(function(row,i){return row.map(function(v){return v*totals[i]/100;});}),values=db.categories.map(function(_,j){return counts.map(function(row){return row[j];});});
  q.figures.push({kind:'stacked',maximum:20,labels:db.categories,categories:names,values:values,xLabel:'집단별 인구(천만 명) · 색 하나는 국가 하나'});
  winner(q,names,counts.map(function(row){return row[1];}),'제시 계산값에서 유럽계 인구수가 가장 많은 국가는?','국가 총인구×그 국가 안의 유럽계 비중÷100. 누적 막대 전체 길이가 아니라 국가별 색 구간의 길이를 비교한다.');
  names.forEach(function(n,i){q.pairs.push(pair('G051-5',n+'의 유럽계 인구 계산값은 약 '+fmt(counts[i][1],2)+'천만 명이다.',n+'의 유럽계 인구수는 국가 총인구와 관계없이 유럽계 비중(%)의 숫자와 같다.','같은 국가의 총인구에 비중을 곱한다. 서로 다른 국가의 비중 순위와 인구수 순위를 구별한다.',{op:'product',a:totals[i],b:shares[i][1]/100,result:counts[i][1]}));});
  q.pairs.push(pair('G051-5','아르헨티나의 유럽계 비중은 브라질보다 높아도, 유럽계 인구수는 브라질이 더 많다.','유럽계 비중이 가장 높은 아르헨티나는 유럽계 인구수도 세 나라 중 반드시 가장 많다.','비중의 분모인 국가 총인구가 다르다. 막대의 최종 길이는 세 국가를 합한 집단별 인구수이다.',{op:'ethnicShareVsCount'}));return finish(q,r);
 }
 function industryAmount(seed){
  var r=seedState(seed),names=shuffle(['미국','중국','인도'],r),year='2021',rows=names.map(function(n){var x=data.countries[n];return[round(x.series.gdp[year],1),round(x.economySeries.industry[year],2)];}),amounts=rows.map(function(x){return x[0]*x[1]/100;}),q=start('industry-amount','같은 해 GDP와 2차 산업 생산액',seed,'세계은행 WDI · 2021년 같은 해 GDP·산업 부가가치 비중');
  q.note='미국의 산업 부가가치 비중은 이 자료에서 2021년까지 있으므로 세 나라 모두 2021년으로 맞췄다. 2023년 GDP에 2021년 비중을 곱하지 않는다. 2차 산업은 제조업 외 광업·건설업 등을 포함한다.';
  q.tables.push(table(['국가','2021 GDP(십억 달러)','2021 2차 산업/GDP(%)'],names.map(function(n,i){return[n].concat(rows[i]);}),'표시값으로 계산 · 같은 연도·같은 분모'));
  winner(q,names,amounts,'제시한 GDP와 산업 비중으로 계산한 2차 산업 부가가치가 가장 많은 국가는?','GDP×산업 비중÷100으로 비교한다.');
  names.forEach(function(n,i){q.pairs.push(pair('G097-4',n+'의 2차 산업 부가가치는 약 '+fmt(amounts[i],1)+'십억 달러이다.',n+'의 2차 산업 부가가치는 GDP를 2차 산업 비중으로 나눈 값이다.','표시된 같은 해 GDP×산업 비중÷100을 계산한다.',{op:'product',a:rows[i][0],b:rows[i][1]/100,result:amounts[i],year:year}));});
  var us=names.indexOf('미국'),cn=names.indexOf('중국');q.pairs.push(pair('G097-4','미국의 총GDP가 중국보다 커도 2차 산업 부가가치는 중국이 더 크다.','총GDP가 큰 미국은 2차 산업 비중과 관계없이 2차 산업 부가가치도 중국보다 반드시 크다.','총량과 비중을 곱한 값의 순서는 총량만의 순서와 다를 수 있다.',{op:'industryAmountComparison',usa:amounts[us],china:amounts[cn],year:year}));return finish(q,r);
 }
 function industryRemainder(seed){
  var r=seedState(seed),names=shuffle(['일본','인도','브라질'],r),raw=names.map(function(n){var x=D.countries[n].economy;return[x.agriculture,x.industry,x.services];}),ratios=raw.map(comp),v=ratios.map(function(x){var industry=round(x[1],2),services=round(x[2],2);return[round(100-industry-services,2),industry,services];}),q=start('industry-remainder','같은 분모에서 산업 비중 복원',seed,'WDI 2023 · 세 산업 부가가치 합으로 명시적 재환산');
  q.note='원자료의 GDP 대비 산업 비중 합은 100이 아닐 수 있다. 이 표는 세 산업 부가가치 합을 분모로 다시 계산해 합=100으로 정의했다. GDP 대비 원비율과 구별한다. 1차 비중은 숨겨져 있다.';
  q.tables.push(table(['국가','2차 / 세 산업 합(%)','3차 / 세 산업 합(%)'],names.map(function(n,i){return[n,v[i][1],v[i][2]];}),'세 산업 합=100 · 표시된 소수 둘째 자리 기준'));
  winner(q,names,v.map(function(x){return x[0];}),'제시한 세 산업 합 중 1차 산업 비중이 가장 높은 국가는?','1차=100−2차−3차. 같은 분모와 합=100이라는 조건을 먼저 확인한다.');
  v.forEach(function(x,i){q.pairs.push(pair('G127-2',names[i]+'의 세 산업 합 중 1차 비중은 '+fmt(x[0],2)+'%이다.',names[i]+'의 GDP 중 1차 비중도 분모 확인 없이 반드시 '+fmt(x[0],2)+'%이다.','표의 재환산된 비중에서 남는 값을 복원한다. 원래 GDP 비중과 섞지 않는다.',{op:'industryRemainder',industry:x[1],services:x[2],result:x[0]}));});
  q.pairs.push(pair('G127-2','2차 산업 비중에는 제조업뿐 아니라 광업·건설업 등이 포함된다.','2차 산업 비중이 높은 국가는 반드시 제조업 비중도 같은 값이다.','광업 중심 국가와 제조업 중심 국가를 구별한다.',{op:'industryIncludesMining'}));return finish(q,r);
 }
 function industryBubble(seed){
  var r=seedState(seed),names=shuffle(['일본','인도','브라질'],r),raw=names.map(function(n){var e=D.countries[n].economy;return[e.agriculture,e.industry,e.services];}),v=raw.map(comp),q=start('industry-bubble','산업 구성 좌표와 1인당 GDP 원',seed,'WDI 2023 · 세 산업 부가가치 합으로 명시적 재환산');
  q.note='이 그림의 산업 비율은 GDP가 아니라 제시한 세 산업 부가가치 합=100으로 재환산한 값이다. 원래 WDI의 GDP 비율과 다르다. 원 면적은 1인당 GDP이다. 국가 총GDP를 원 크기만으로 정하지 않는다.';
  reference(q,names,['1차 원비율/GDP(%)','2차 원비율/GDP(%)','3차 원비율/GDP(%)'],raw);var gdps=names.map(function(n){return D.countries[n].values.gdppc;});
  q.tables.push(table(['국가','1인당 GDP(천 달러)'],names.map(function(n,i){return[n,gdps[i]];}),'원 크기 대응 기준'));
  q.figures.push({kind:'scatter',zero:true,xLabel:'3차 / 세 산업 합(%)',yLabel:'2차 / 세 산업 합(%)',sizeLabel:'원 면적: 1인당 GDP',points:v.map(function(x,i){return{name:L[i],x:round(x[2],3),y:round(x[1],3),size:gdps[i]/Math.max.apply(null,gdps)*100};})});
  v.forEach(function(x,i){var rest=100-round(x[1],3)-round(x[2],3);q.pairs.push(pair('G137-3',L[i]+'의 세 산업 합 중 1차 비중은 약 '+fmt(rest)+'%이다.',L[i]+'의 원래 GDP 중 1차 비중은 이 좌표에서 무조건 100−2차−3차로 구한다.','100−두 비중은 같은 합계가 100이라고 명시된 구성에서만 적용한다.',{op:'industryRemainder',industry:round(x[1],3),services:round(x[2],3),result:rest}));});
  q.pairs.push(pair('G137-3','원이 큰 국가는 1인당 GDP가 높지만 총GDP가 반드시 큰 것은 아니다.','원이 큰 국가는 총인구와 관계없이 총GDP도 반드시 크다.','총GDP=1인당 GDP×인구이다. 원의 범례를 먼저 확인한다.',{op:'gdpBubbleDenominator'}));
  return finish(q,r);
 }
 function photo(mode,seed){
  var r=seedState(seed),spec={
   'oldmap-images':{title:'고지도 원그림 식별',goal:'G006-1',ids:['babylon','ptolemy','to-map','idrisi','cheonhado','daeming','kangnido','kunyu','hemispheres','hereford','portolan','mercator']},
   'coast-images':{title:'해안 경관과 형성 작용',goal:'G036-3',ids:['mangrove','coral','lagoon','sea-stack']},
   'religious-buildings':{title:'건축 경관의 종교',goal:'G044-1',ids:['hindu-temple','church','buddhist-temple','mosque']},
   'traditional-houses':{title:'전통 가옥과 환경 적응',goal:'G052-3',ids:['ger','gassho','stilt']},
   'road-images':{title:'도시 일부 구역의 도로망',goal:'G067-1',ids:['manhattan','paris-roads']},
   'city-images':{title:'도시 문화 경관',goal:'G067-2',ids:['rio','mexico-city','cusco']},
   'irrigation-images':{title:'두 관개 방식의 사진',goal:'G073-1',ids:['pivot-irrigation','qanat']}
  }[mode],selected=D.panels.find(function(p){return p.id===spec.ids[(seed-1)%spec.ids.length];}),q=start(mode,spec.title,seed,'평가원 원그림 · 강의 '+selected.sourceFigure+' 수록 패널');
  q.note='제시 그림의 구조·배치·경관 단서를 보고 판단한다. 해설용 이름·제목 부분은 그림에서 제외했다.';
  q.figures.push({kind:'image',src:selected.path,name:'제시 그림'});
  var options=shuffle([selected.answer].concat(shuffle(spec.ids.filter(function(id){return id!==selected.id;}),r).slice(0,4).map(function(id){return D.panels.find(function(p){return p.id===id;}).answer;})),r);
  q.stage1={question:'제시 그림에 해당하는 대상은?',options:options,answer:options.indexOf(selected.answer),explain:'정답은 '+selected.answer+'이다. 그림의 구체적인 식별 단서를 함께 확인한다.'};
  var clues={babylon:'점토판의 원형 세계',ptolemy:'경위선이 표현된 구세계', 'to-map':'원 안의 T자와 아시아·유럽·아프리카',idrisi:'남쪽이 위인 구세계',cheonhado:'실제·상상 지명이 섞인 원형 관념도',daeming:'중국이 크게 표현된 구세계',kangnido:'중국 중심의 구세계와 확대된 조선',kunyu:'아메리카가 보이는 타원형 세계',hemispheres:'동·서 두 반구의 원형 지도',hereford:'크리스트교 세계관의 T-O 계열',portolan:'연안·항구와 나침반 항해선',mercator:'직선 경위선의 세계 지도',mangrove:'물 위로 드러난 뿌리의 해안 숲',coral:'산호의 석회질 유해가 쌓인 섬',lagoon:'사주에 가로막힌 해안 호수','sea-stack':'해안 절벽과 분리된 바위섬', 'hindu-temple':'인물 조각이 밀집한 사원탑',church:'십자가가 있는 높은 첨탑과 성당 구조','buddhist-temple':'층을 이룬 동아시아식 지붕과 불교 사원',mosque:'돔과 첨탑이 결합한 모스크',ger:'분해·조립하는 원형 골조와 펠트 덮개',gassho:'눈을 흘려보내는 가파른 지붕',stilt:'높인 바닥과 통풍되는 하부 공간',manhattan:'직교하는 격자형 도로가 보이는 맨해튼 일부','paris-roads':'개선문 주변에서 뻗는 방사형 도로',rio:'산 정상의 예수상과 해안 도시 경관','mexico-city':'대규모 격자형 구시가와 소칼로 주변',cusco:'아르마스 광장과 식민 시대 건축','pivot-irrigation':'중앙 수원을 축으로 회전하는 장치와 원형 농지',qanat:'지하 수로의 유지·관리용 수직 구멍이 줄지어 있음'};
  q.stage1.explain+=' 단서: '+clues[selected.id]+'.';
  q.pairs.push(pair(spec.goal,'이 그림의 식별 단서는 '+clues[selected.id]+'이다.','이 그림만으로 해당 지역의 모든 주민·시설·지형이 같은 유형이라고 확정할 수 있다.','사진·지도에 나타난 범위와 대상의 구조를 확인한다. 일부 경관을 전체 지역으로 확대하지 않는다.',{op:'figureIdentification',panel:selected.id,answer:selected.answer,sha256:selected.sha256}));
  if(mode==='oldmap-images')q.pairs.push(pair('G006-2','T-O 지도는 동쪽, 알 이드리시 지도는 남쪽이 위에 표현된다.','T-O 지도와 알 이드리시 지도는 모두 북쪽이 위이므로 대륙 배치도 오늘날 지도와 같다.','위쪽 방향을 확인한 뒤 아시아·지중해·인도양·나일강의 배치를 연결한다.',{op:'historicalOrientation'}));
  else if(mode==='coast-images')q.pairs.push(pair(spec.goal,'맹그로브·산호섬의 생물 작용, 석호의 퇴적, 해식애·시스택의 침식을 구별한다.','맹그로브·산호섬·석호·시스택은 모두 같은 파랑 침식 지형이다.','생물 작용·해안 퇴적·파랑 침식은 형성 과정이 서로 다르다.',{op:'coastProcess'}));
  else if(mode==='religious-buildings')q.pairs.push(pair('G044-2','이번 네 사원·성당·모스크는 싱가포르의 다종교 경관 사례이다.','한 도시에 서로 다른 종교 건축이 있으면 그 도시의 모든 주민은 같은 종교이다.','사원마다 구조·기능을 판별하고 같은 도시 안의 종교 다양성과 연결한다.',{op:'singaporeBuildings'}));
  else if(mode==='traditional-houses')q.pairs.push(pair(spec.goal,'습윤 열대의 고상 구조와 영구 동토 지역의 고상 기초는 환경 적응의 이유가 다르다.','기둥 위에 지은 집은 기후·고도와 관계없이 모두 영구 동토를 피하기 위한 것이다.','높인 바닥이라는 형태가 같아도 통풍·습기 회피인지 동토 융해 방지인지 구별한다.',{op:'houseAdaptation'}));
  else if(mode==='road-images')q.pairs.push(pair(spec.goal,'이 도로 형태는 사진에 보이는 일부 구역의 특징이다.','맨해튼이나 파리의 모든 도로는 예외 없이 사진과 같은 형태이다.','관찰 범위를 도시 전체로 확대하지 않는다.',{op:'roadScope'}));
  else if(mode==='city-images')q.pairs.push(pair(spec.goal,'경관의 식별 단서와 그 도시의 수도 여부는 별도로 확인한다.','예수상이 보이는 리우데자네이루는 현재 브라질의 수도이다.','리우는 브라질의 구 수도이며 현재 수도는 브라질리아이다.',{op:'cityLandscapeVsCapital'}));
  else if(mode==='irrigation-images')q.pairs.push(pair(spec.goal,'카나트는 지하 수로의 완만한 경사를 이용해 물을 옮기며 증발 손실을 줄일 수 있다.','사진의 원형 농지는 카나트의 지하 터널이 지표에서 원형으로 보인 것이다.','중심축 회전식 관개의 원형 농지와 카나트의 수직 구멍 열을 구별한다.',{op:'irrigationProcess'}));
  return finish(q,r);
 }
 function nightLights(seed){
  var r=seedState(seed),q=start('night-lights','인구 밀도·야간 빛 영상',seed,'2024학년도 6월 2번 · 강의 L1-rId125');q.figures.push({kind:'image',src:D.panels.find(function(p){return p.id==='night-lights';}).path,name:'두 지역의 위치·인구 밀도·야간 빛'});q.assignment=['스리랑카','타이완'];q.note='원문 범례와 위치를 함께 본다. 빛의 밝기를 주민 수나 소득의 직접 계수값으로 바꾸지 않는다.';
  q.pairs.push(pair('G007-3','(가)는 스리랑카, (나)는 타이완에 해당한다.','(가)는 타이완, (나)는 스리랑카에 해당한다.','위·경도와 섬 모양을 대응한다. 야간 빛만으로 국가를 정하지 않는다.',{op:'nightLightCountries'}));
  q.pairs.push(pair('G007-3','야간 빛은 센서가 기록한 빛의 신호로, 총인구를 직접 센 값은 아니다.','야간 빛의 밝기 비율은 그 지역 총인구 비율과 항상 같다.','전력 이용·토지 이용 등도 빛에 영향을 미친다.',{op:'nightLightMeaning'}));
  return finish(q,r);
 }
 function chinaGrains(seed){
  var r=seedState(seed),q=start('china-grain-map','중국 곡물 분포의 점지도',seed,'강의 L2-rId100 · 2013년 기출 제시 자료');q.note='점 1개=20만 t이라는 원문 범례를 읽는다. 점은 실제 농장 한 곳이나 단위 면적당 생산량을 뜻하지 않는다.';q.figures.push({kind:'image',src:D.panels.find(function(p){return p.id==='china-grains';}).path,name:'세 곡물의 분포'});q.assignment=['옥수수','밀','쌀'];
  q.pairs.push(pair('G073-4','동북부·북부에 집중한 A는 옥수수, 화북 중심 B는 밀, 남부 중심 C는 쌀이다.','중국 남부에 집중한 C는 밀, 화북 중심 B는 쌀이다.','온도·수분과 농업 지역의 남북 차이를 연결한다.',{op:'chinaGrainRegions'}));
  q.pairs.push(pair('G073-4','같은 범례의 점이 두 배 많으면 표시된 생산량도 두 배이다.','점이 두 배 많은 지역은 단위 면적당 생산량도 반드시 두 배이다.','점의 개수는 총생산량이다. 면적·단수·농장 수와 구별한다.',{op:'grainDotLegend',tonnesPerDot:200000}));
  return finish(q,r);
 }
 function livestockComposition(seed){
  var r=seedState(seed),names=shuffle(['오스트레일리아','중국','브라질'],r),keys=['소','돼지','양'],raw=names.map(function(n){return keys.map(function(k){return D.agri[n]['qcl-stocks:'+k];});}),v=raw.map(comp),q=start('livestock-composition','세 가축의 국가 내부 구성',seed,'FAOSTAT QCL · 2023년 · 소는 물소 제외');reference(q,names,keys.map(function(k){return k+'(마리)';}),raw);q.note='각 국가의 소·돼지·양 사육 두수 합을 100으로 삼은 비율이다. 특정 가축의 세계 두수를 분모로 삼은 점유율과 다르다.';
  q.figures.push({kind:'stacked',labels:L,categories:keys,values:v,xLabel:'국가 내부 세 가축 합=100%'});
  v.forEach(function(x,i){q.pairs.push(pair('G079-3',L[i]+'의 국가 내부 세 가축 중 양 비중은 약 '+fmt(x[2])+'%이다.',L[i]+'의 세계 양 사육 점유율은 이 그래프만으로 약 '+fmt(x[2])+'%라고 확정된다.','지역 내부의 세 가축 합과 세계의 양 두수는 서로 다른 분모이다.',{op:'composition',values:raw[i],part:2,result:x[2]}));});
  q.pairs.push(pair('G079-3','국가별 총사육 두수가 다르면 같은 비중도 실제 두수가 다를 수 있다.','서로 다른 국가의 양 비중이 같으면 양 사육 두수도 반드시 같다.','비율×각 국가의 총두수로 실제량을 구한다.',{op:'stockDenominator'}));return finish(q,r);
 }
 function pyramid(mode,seed){
  var r=seedState(seed),names=shuffle(['아랍 에미리트','이집트','튀르키예'],r),q=start(mode,mode==='pyramid-cohort'?'두 시점 인구 코호트':'성별·연령별 인구와 분모',seed,'World Bank WDI · UN WPP 성·연령별 추계 · 2010·2020년'),db=D.pyramids,format=seed%3;
  if(mode==='pyramid-cohort'){
   q.note='2010년 30~39세 집단은 10년 뒤 40~49세에 해당한다. 두 시점 집단 수 차이에는 사망·국제 이동 등이 반영된다. 그 사이 출생한 사람은 이 코호트에 들어오지 않는다.';
   var values=names.map(function(n){var a=db.countries[n]['2010'],b=db.countries[n]['2020'];return[A.sum(a.male.slice(6,8))+A.sum(a.female.slice(6,8)),A.sum(b.male.slice(8,10))+A.sum(b.female.slice(8,10))];});
   q.tables.push(table(['국가','2010년 30~39세(명)','2020년 40~49세(명)'],values.map(function(v,i){return[names[i]].concat(v);}),'같은 출생 시기의 코호트를 대응'));
   names.forEach(function(n){['2010','2020'].forEach(function(year){var x=db.countries[n][year];q.figures.push({kind:'pyramid',name:n+' '+year+'년',ages:db.ages,male:x.male.map(function(v){return v/1e6;}),female:x.female.map(function(v){return v/1e6;}),xLabel:'실제 인구(백만 명)'});});});
   winner(q,names,values.map(function(v){return v[1]-v[0];}),'대응 코호트의 인구 증가량이 가장 큰 국가는?','연령을 10년 이동시켜 대응한 다음 같은 단위의 인구를 뺀다.');
   values.forEach(function(v,i){q.pairs.push(pair('G058-3',names[i]+'의 대응 코호트 인구 변화는 '+fmt(v[1]-v[0],0)+'명이다.',names[i]+'의 대응 코호트 인구 변화는 2010년 30~39세와 2020년 30~39세를 빼면 구할 수 있다.','같은 연령 칸이 아니라 같은 출생 시기 집단을 비교한다.',{op:'subtract',a:v[1],b:v[0],result:v[1]-v[0]}));});
   q.pairs.push(pair('G058-3','이 코호트 인구가 늘었다면 국제 이동 등 연령 집단에 영향을 준 요인을 함께 검토한다.','이 코호트 인구가 늘었다면 2010~2020년에 태어난 아기가 곧바로 40~49세로 들어온 것이다.','새 출생은 10년 뒤에도 0~9세에 해당한다.',{op:'cohortBirths'}));
  }else{
   q.assignment=names;q.note=format===0?'가로축은 각 성별 인구=100으로 계산한 비율이다. 남녀 각각의 합은 100이지만 남녀 총인구가 같다는 뜻은 아니다.':format===1?'가로축은 국가 전체 인구=100으로 계산한 성·연령 집단의 비율이다. 남녀 막대의 합이 전체 인구를 이룬다.':'가로축은 각 성·연령 집단의 실제 인구(백만 명)이다. 원자료의 성별 총인구에 성별 내 연령 비율을 곱해 복원했다.';
   q.tables.push(table(['후보 국가','2020 남성 총인구(명)','2020 여성 총인구(명)'],names.map(function(n){var x=db.countries[n]['2020'];return[n,x.maleTotal,x.femaleTotal];}),'분모와 함께 읽는 성별 총량'));
   names.forEach(function(n,i){var x=db.countries[n]['2020'],total=x.maleTotal+x.femaleTotal,den=format===0?[x.maleTotal,x.femaleTotal]:format===1?[total,total]:[1e8,1e8],m=x.male.map(function(v){return v/den[0]*100;}),f=x.female.map(function(v){return v/den[1]*100;});
    q.figures.push({kind:'pyramid',name:L[i],ages:db.ages,male:m,female:f,xLabel:format===0?'각 성별 인구=100 (%)':format===1?'국가 전체 인구=100 (%)':'인구(백만 명)'});
    var men=A.sum(x.male.slice(6,8)),women=A.sum(x.female.slice(6,8)),sexRatio=men/women*100;
    q.pairs.push(pair('G057-4',L[i]+'의 30~39세 성비는 여성 100명당 남성 약 '+fmt(sexRatio)+'명이다.',L[i]+'의 30~39세 성비는 남성 100명당 여성 수를 뜻한다.','성비=해당 연령 남성÷해당 연령 여성×100. 각 성별 100인 막대는 성별 총량을 곱해 명수로 복원해야 한다.',{op:'sexRatio',male:men,female:women,result:sexRatio}));
   });
   q.identifyExplain='청장년 남성의 집중, 유소년 구성, 성별 총량을 함께 대응한다. 각 성별 100으로 만든 그림에서는 좌우 폭만으로 남녀 총량을 비교하지 않는다.';
   q.pairs.push(pair('G058-1','막대의 가로축이 명수인지 비율인지, 비율이면 전체 100인지 성별 100인지 먼저 확인한다.','성별 인구를 각각 100으로 표준화한 두 막대는 남녀 실제 인구도 같다는 뜻이다.','표준화한 비율은 총인구의 차이를 지울 수 있다.',{op:'pyramidDenominator',format:format}));
   q.pairs.push(pair('G126-4','아랍 에미리트의 성·연령 구조는 청장년 노동 이주의 집중과 연결해 해석할 수 있다.','아랍 에미리트의 청장년 남성 집중은 출생 성비만으로 충분히 설명된다.','특정 성·연령에 집중된 노동 이동과 출생 성비를 구별한다.',{op:'laborMigrationPyramid'}));
  }
  return finish(q,r);
 }
 function religionRanks(seed){
  var r=seedState(seed),keys=shuffle(['islam','buddhism','hinduism'],r),labels={islam:'이슬람교',buddhism:'불교',hinduism:'힌두교'},q=start('religion-top-two','종교 1·2위로 기호 복원',seed,'Pew 2025 발행 · 2010·2020년 종교 구성');q.assignment=keys.map(function(k){return labels[k];});q.identify='종교 기호 (가)·(나)·(다)에 해당하는 종교를 순서대로 고른 것은?';
  var year=seed%2?'2010':'2020',countries=['말레이시아','네팔','스리랑카','인도','방글라데시'];q.note=year+'년의 무종교를 제외한 개별 종교 순위이다. 1위라는 것이 과반을 뜻하는 것은 아니다.';
  var orders=countries.map(function(n){var v=D.religions[n].series[year];return Object.keys(v).filter(function(k){return k!=='unaffiliated'&&k!=='other';}).sort(function(a,b){return v[b]-v[a];}).slice(0,2);});
  q.tables.push(table(['국가','신자 수 1위','신자 수 2위'],orders.map(function(o,i){return[countries[i],L[keys.indexOf(o[0])],L[keys.indexOf(o[1])]];}),'세 종교 중 기호는 문항마다 바뀜'));
  q.pairs.push(pair('G041-1','말레이시아에서는 이슬람교 신자가 불교 신자보다 많다.','말레이시아에서는 불교 신자가 이슬람교 신자보다 많다.','말레이시아 1위 이슬람교, 2위 불교라는 주어진 순위와 대응한다.',{op:'religionTopTwo',year:year,orders:orders,countries:countries}));
  q.pairs.push(pair('G041-1','스리랑카는 불교·힌두교, 방글라데시는 이슬람교·힌두교 순이다.','스리랑카는 힌두교·불교, 방글라데시는 힌두교·이슬람교 순이다.','다섯 나라의 1·2위 관계를 함께 만족하는 기호 배정을 찾는다.',{op:'religionRankAssignment',keys:keys}));
  return finish(q,r);
 }
 function religionScore(seed){
  var r=seedState(seed),names=shuffle(['힌두교','불교','이슬람교'],r),scores={'힌두교':2,'불교':1,'이슬람교':0},q=start('religion-score','교사 평가 점수로 종교 복원',seed,'강의 G043-4 · 문장 평가 모식 학습지');q.assignment=names;
  q.note='각 행의 두 진술 중 옳은 진술 하나당 1점이다. 0·1·2점이라는 평가 결과를 모두 만족하는 배정은 하나뿐이어야 한다.';
  q.tables.push(table(['종교 기호','학생의 진술 ①','학생의 진술 ②','교사 점수'],names.map(function(n,i){return[L[i],'민족 종교이다.','인도 아대륙에서 기원했다.',scores[n]];}),'종교는 힌두교·불교·이슬람교 중 하나'));
  q.pairs.push(pair('G043-4','2점인 행은 두 진술이 모두 옳은 힌두교이다.','2점인 행은 두 진술이 모두 틀렸다는 뜻이다.','문항의 채점 기준에서 두 개 옳음=2점이다.',{op:'religionScores',scores:scores,names:names}));
  q.pairs.push(pair('G043-4','불교에 대한 틀린 진술 ①은 보편 종교이다로 고친다.','불교에 대한 진술 ① 민족 종교이다는 그대로 옳다.','불교는 인도 아대륙 기원이라는 ②는 맞고 민족 종교라는 ①은 틀리므로 1점이다.',{op:'correctReligionClaim'}));
  q.pairs.push(pair('G043-4','이슬람교의 기원지를 인도 아대륙이라고 한 부분은 아라비아반도로 고친다.','이슬람교는 인도 아대륙 기원 민족 종교이므로 2점이다.','이슬람교는 보편 종교이며 아라비아반도 기원이다.',{op:'islamOriginCorrection'}));
  return finish(q,r);
 }
 function area(mode,seed){
  var r=seedState(seed),isPop=mode==='population-area',names=shuffle(isPop?['아시아','유럽']:['coal','oil','gas'],r),labels=isPop?names:names.map(function(k){return{coal:'석탄',oil:'석유',gas:'천연가스'}[k];}),q=start(mode,isPop?'대륙별 국가 인구 면적 구성':'자원 생산량의 면적 그래프',seed,isPop?'WDI 2023 · 국가·대륙 인구':'OWID/EI·EIA · 2023년 생산량');q.assignment=labels;
  q.note='각 그림 전체는 해당 전체를 100으로 둔다. 조각의 면적이 구성비이며 높이 또는 너비 한쪽만 비율로 읽지 않는다. 서로 다른 그림은 전체 총량도 다를 수 있다.';
  var all=[];
  names.forEach(function(n,i){var members=isPop?(n==='아시아'?['중국','인도','일본']:['독일','프랑스','튀르키예']):['중국','미국','오스트레일리아'];
   // Turkey spans Europe and Asia; never assign its whole population to Europe.
   if(isPop&&n==='유럽')members=['독일','프랑스','영국'];
   var total=isPop?D.continents[n]:D.regions.World[n+'_production'],values=members.map(function(c){return isPop?D.countries[c].values.pop:D.fuels[c][n+'_production'];});if(values.some(function(x){return !Number.isFinite(x);}))throw Error('Missing area input');var other=total-A.sum(values);if(!(other>0))throw Error('Invalid area remainder');
   var entries=members.map(function(c,j){return{name:c,value:values[j]};}).concat([{name:'기타',value:other}]);all.push({name:labels[i],total:total,entries:entries});q.figures.push({kind:'area',name:L[i],entries:entries,caption:isPop?'대륙 인구=100%':'세계의 이 자원 생산량=100%'});
  });
  q.tables.push(table(['후보 전체','총량','구성 단서'],all.slice().sort(function(a,b){return a.name.localeCompare(b.name);}).map(function(x){return[x.name,round(x.total,3),x.entries.slice(0,3).map(function(e){return e.name+' '+fmt(e.value/x.total*100)+'%';}).join(' · ')];}),isPop?'총량 단위: 만 명':'총량 단위: TWh'));
  var goal=isPop?'G139-1':'G083-1';q.pairs.push(pair(goal,'그림에서 기타는 따로 제시하지 않은 나머지 국가들의 합이다.','그림에서 기타는 이름이 기타인 국가 한 곳의 값이다.','잔여 범주의 범위를 구별한다.',{op:'areaRemainder',groups:all}));
  q.pairs.push(pair(goal,'서로 다른 그림의 실제량을 비교할 때는 각 그림 총량×조각 비중으로 계산한다.','서로 다른 그림에서 조각의 면적이 같으면 실제 인구·생산량도 반드시 같다.','그림의 전체를 각각 100으로 만들었으므로 전체 총량이 필요하다.',{op:'areaVsAmount'}));
  q.pairs.push(pair(goal,'같은 그림 안에서는 면적 비율의 순서와 실제량의 순서가 같다.','같은 그림 안에서도 같은 분모인데 면적이 더 작은 조각의 실제량이 반드시 더 크다.','같은 전체를 기준으로 한 비율에서는 순서를 유지한다.',{op:'withinArea'}));
  return finish(q,r);
 }
 function regionalRadar(seed){
  var r=seedState(seed),names=shuffle(['이집트','카자흐스탄','사우디아라비아'],r),v=names.map(function(n){var s=D.radar[n];return[s['SL.AGR.EMPL.ZS'],s['AG.SRF.TOTL.K2'],D.countries[n].values.gdp];}),norm=v.map(function(row){return row.map(function(x,j){return x/Math.max.apply(null,v.map(function(y){return y[j];}))*100;});}),q=start('regional-radar','항목별 최댓값=100 방사형 그래프',seed,'WDI 2023 · 농업 종사자 비율·면적·GDP');reference(q,names,['농업 종사자(%)','면적(km²)','GDP(십억 달러)'],v);
  q.note='각 축마다 제시 세 나라 중 그 항목 최댓값=100이다. 농업 종사자 비율 100%, 면적 100km², GDP 100달러라는 뜻이 아니다.';q.figures.push({kind:'radar',maximum:100,labels:['농업 종사자 비율','면적','GDP'],series:norm.map(function(x,i){return{name:L[i],values:x};})});
  q.pairs.push(pair('G127-1','서로 다른 축의 100은 서로 다른 단위와 최댓값을 기준으로 한다.','서로 다른 축에서 100이면 실제 값과 단위까지 서로 같다.','각 항목의 제시 국가 최댓값으로 나눈 상대값이다.',{op:'radarColumns',raw:v,normalized:norm}));
  q.pairs.push(pair('G127-1','같은 축 안에서는 상대값 순서와 실제 지표 순서가 같다.','같은 축 안에서도 상대값이 큰 나라가 실제 값은 반드시 더 작다.','한 축 안에서는 같은 양의 분모로 나눴으므로 순서를 유지한다.',{op:'radarOrder'}));return finish(q,r);
 }
 function fossilDenominators(seed){
  var r=seedState(seed),names=shuffle(['중국','미국'],r),q=start('fossil-denominators','자원별 세계 몫과 국가 에너지 구성',seed,'OWID/EI·EIA · 2023년');q.assignment=names;q.note='왼쪽 표는 각 자원 세계 소비량=100, 오른쪽 표는 각 국가의 총1차 에너지 소비량=100이다. 같은 자원 이름이 있어도 분모가 다르다.';
  var ws=names.map(function(n){return['coal','oil','gas'].map(function(k){return D.fuels[n][k+'_consumption']/D.regions.World[k+'_consumption']*100;});}),cs=names.map(function(n){return['coal','oil','gas'].map(function(k){return D.fuels[n][k+'_share_energy'];});});
  q.tables.push(table(['자료','세계 석탄 중(%)','세계 석유 중(%)','세계 가스 중(%)'],ws.map(function(x,i){return[L[i]].concat(x.map(function(v){return round(v,3);}));}),'자원별 세계 분모'));
  q.tables.push(table(['자료','국가 내 석탄(%)','국가 내 석유(%)','국가 내 가스(%)'],cs.map(function(x,i){return[L[i]].concat(x);}),'국가 총에너지 분모'));
  q.identifyExplain='중국은 제시 자료에서 국가 내부 석탄 비중이 높다. 미국과 두 분모의 값을 각각 대응한다.';
  q.pairs.push(pair('G086-5','세계 석탄 소비 중 비중과 자국 총에너지 중 석탄 비중은 다른 값이다.','세계 석탄 소비 중 비중이 곧 자국 총에너지 중 석탄 비중이다.','자원 세계 총량과 국가 모든 에너지원 총량을 구별한다.',{op:'fossilTwoDenominators',worldShares:ws,countryShares:cs}));
  q.pairs.push(pair('G086-5','자원별 세계 몫 세 개를 합해 국가 에너지 구성 100%로 읽을 수 없다.','자원별 세계 몫 세 개는 각 국가에서 반드시 합계 100%이다.','각 열의 세계 분모가 서로 다르다.',{op:'worldColumnsNotComposition'}));return finish(q,r);
 }
 function trap(seed){
  var r=seedState(seed),marks=shuffle(['A','B','C'],r),q=start('anticline-trap','배사 구조의 가스·석유·물',seed,'강의 G081-5 · 앱이 그린 모식도');q.figures.push({kind:'anticline',labels:marks});q.assignment=marks;q.identify='천연가스·석유·물의 위치 기호를 순서대로 고른 것은?';q.note='불투수층 아래의 배사 트랩을 단순화했다. 실제 지층 깊이·매장량·압력을 나타내는 수치 자료는 아니다.';
  q.pairs.push(pair('G081-5','일반적인 배사 트랩에서 가스는 석유 위쪽, 물은 석유 아래쪽에 분포한다.','일반적인 배사 트랩에서 물은 가스보다 위쪽에 분포한다.','유체의 밀도 차이와 불투수층에 의한 집적을 구별한다.',{op:'trapOrder',labels:marks}));
  q.pairs.push(pair('G081-5','배사 모식도에서 아래쪽 물층은 석유·가스의 위치와 구별해야 한다.','모식도에서 색칠된 세 층은 모두 석유만 들어 있는 같은 층이다.','모식도의 위치·범례를 통해 서로 다른 유체를 대응한다.',{op:'trapFluids'}));return finish(q,r);
 }
 function meander(seed){
  var r=seedState(seed),marks=shuffle(['A','B'],r),q=start('meander-banks','곡류의 바깥쪽·안쪽 판정',seed,'강의 G037-4 · 앱의 곡류·종단면 모식도');q.figures.push({kind:'meander',rotation:(seed%4)*90,outer:marks[0],inner:marks[1]});q.note='물 흐름 화살표와 굽은 방향을 본다. 그림을 회전해도 바깥쪽·안쪽의 침식·퇴적 관계는 유지된다.';
  q.stage1={question:'곡류의 바깥쪽으로 침식이 상대적으로 활발한 지점은?',options:['A','B'],answer:['A','B'].indexOf(marks[0]),explain:'굽은 바깥쪽은 유속이 상대적으로 빠르고 침식이 활발하다. 화면의 위·아래로 판정하지 않는다.'};
  q.pairs.push(pair('G037-4',marks[1]+'는 굽은 안쪽으로 상대적으로 퇴적이 활발하다.',marks[0]+'는 굽은 바깥쪽이므로 언제나 퇴적만 활발하다.','바깥쪽 침식·안쪽 퇴적의 관계이다.',{op:'meander',rotation:(seed%4)*90,outer:marks[0],inner:marks[1]}));
  q.pairs.push(pair('G037-4','종단면은 하천 흐름 방향을 따라 높이 변화를 나타낸다.','종단면은 하천을 가로질러 양쪽 강둑 사이 폭만 나타낸다.','흐름 방향의 종단면과 흐름에 직각인 횡단면을 구별한다.',{op:'riverProfile'}));return finish(q,r);
 }
 function religionSymbols(seed){
  var r=seedState(seed),symbols=['wheel','crescent','cross'],labels={'wheel':'불교','crescent':'이슬람교','cross':'크리스트교'},s=symbols[seed%3],q=start('religion-symbols','종교 상징과 국장 설명',seed,'강의 G041-4 · 기본 상징 모식도');q.figures.push({kind:'symbol',symbol:s});var opts=shuffle(['불교','이슬람교','크리스트교'],r);q.stage1={question:'제시된 상징을 강의의 종교와 대응한 것은?',options:opts,answer:opts.indexOf(labels[s]),explain:'수레바퀴(법륜)=불교, 초승달과 별=이슬람교, 십자가=크리스트교이다.'};
  q.note='상징의 강의상 대응을 묻는다. 한 상징이 보인다고 모든 주민의 종교·국가의 제도까지 같다고 단정하지 않는다.';
  q.tables.push(table(['국장 설명','국가'],[['법륜을 포함한 국장','스리랑카'],['초승달·별과 농작물을 포함한 국장','파키스탄'],['그리스도교 전통의 방패 문양을 포함한 국장','포르투갈']],'강의의 종교 상징·국가 연결'));
  q.pairs.push(pair('G041-4','파키스탄 국장의 초승달·별은 이슬람교와 연결한다.','파키스탄 국장의 초승달·별은 불교의 법륜과 같은 상징이다.','초승달·별과 법륜을 구별한다.',{op:'emblemReligion'}));
  q.pairs.push(pair('G041-4','국장에 있는 농작물 그림만으로 신자 수 1위 종교를 결정하지 않는다.','국장에 농작물이 있으면 그 작물을 재배하는 모든 나라는 같은 종교이다.','작물·역사·종교 상징이 국장에 함께 들어갈 수 있다. 단서의 성격을 분리한다.',{op:'cropEmblemScope'}));return finish(q,r);
 }
 function mineralRelative(seed){
  var r=seedState(seed),names=shuffle(['멕시코','페루','중국'],r),cols=['은','구리','철광석'],raw=names.map(function(n){return cols.map(function(k){var rows=k==='은'?D.extraMinerals.minerals[k].rows:D.minerals[k].find(function(x){return x.year==='2023';}).countries;var row=rows.find(function(x){return (x.name===n||x.iso3==={'멕시코':'MEX','페루':'PER','중국':'CHN'}[n])&&(x.year==null||x.year==='2023');});if(!row||!(row.value>0))throw Error('Missing comparable mineral row');return row.value;});}),maxima=cols.map(function(_,j){return Math.max.apply(null,raw.map(function(x){return x[j];}));}),v=raw.map(function(x){return x.map(function(a,j){return a/maxima[j]*100;});}),q=start('mineral-relative','광물별 최대값=100 상대값',seed,'BGS 2023 · 광산 생산 · 같은 광물 안에서 비교');
  reference(q,names,['은(kg 금속 함량)','구리(t 금속 함량)','철광석(t 원광)'],raw);q.note='각 광물에서 제시 세 나라 최댓값=100이다. 세계 점유율 100%가 아니다. 광물마다 단위·품목 기준이 다르므로 서로 다른 광물 막대의 길이로 실제 생산량을 비교하지 않는다.';
  q.figures.push({kind:'grouped-bars',name:'광물별 제시 국가 최대=100',labels:L,categories:cols,values:v,maximum:100,yLabel:'상대값'});
  q.pairs.push(pair('G092-1','은의 100과 철광석의 100은 각각 다른 광물의 제시 국가 최댓값이다.','은의 100과 철광석의 100은 실제 생산량과 단위가 서로 같다는 뜻이다.','광물별 기준 최댓값을 각각 나눈 상대값이다.',{op:'mineralNormalize',raw:raw,maxima:maxima,values:v}));
  q.pairs.push(pair('G092-2','같은 광물 안에서는 막대 길이로 제시 국가의 실제 생산량 순서를 비교할 수 있다.','광물이 달라도 막대가 더 긴 광물의 실제 생산량이 반드시 더 많다.','같은 광물 안의 공통 분모와 서로 다른 광물의 분모를 구별한다.',{op:'mineralCompareScope'}));return finish(q,r);
 }
 function sourceFigure(q,id,title){var p=D.panels.find(function(p){return p.id===id;});if(!p)throw Error('Missing source figure '+id);q.figures.push({kind:'image',src:p.path,name:title||'원문 제시 자료'});}
 function northAmericaTrade(seed){
  var r=seedState(seed),q=start('north-america-trade','북미 양방향 교역과 무역 수지',seed,'강의 L2-rId208 · 1990·2017년 기출 제시값 · 억 달러');sourceFigure(q,'north-america-trade');q.assignment=['미국','멕시코','캐나다'];q.note='화살표는 출발 국가의 수출이다. 한 상대국과의 수지와 세계 전체 수지를 구별한다. 세 나라의 양방향 총액은 각 방향 수출액을 더한다.';
  var year=seed%2?2017:1990,usCanada=year===2017?[2821,3200]:[830,954],usMexico=year===2017?[2430,3269]:[284,188],canMexico=year===2017?[60,114]:[5,2];
  q.pairs.push(pair('G104-1',year+'년 미국·캐나다의 양방향 무역액은 '+(usCanada[0]+usCanada[1])+'억 달러이다.',year+'년 미국·캐나다의 양방향 무역액은 '+Math.abs(usCanada[0]-usCanada[1])+'억 달러이다.','양방향 총액은 수출+수입이다. 차이는 상대국에 대한 무역 수지이다.',{op:'add',a:usCanada[0],b:usCanada[1],result:usCanada[0]+usCanada[1]}));
  q.pairs.push(pair('G104-1',year+'년 미국의 대캐나다 무역 수지는 '+(usCanada[0]-usCanada[1])+'억 달러이다.',year+'년 미국의 대캐나다 무역 수지는 '+(usCanada[1]-usCanada[0])+'억 달러이다.','미국을 기준으로 미국→캐나다 수출에서 캐나다→미국 수출을 뺀다.',{op:'subtract',a:usCanada[0],b:usCanada[1],result:usCanada[0]-usCanada[1]}));
  q.pairs.push(pair('G130-4',year+'년 캐나다·멕시코 간 교역은 두 나라 각각의 대미 교역보다 작다.',year+'년 캐나다·멕시코 간 교역은 두 나라 각각의 대미 교역보다 크다.','방향 두 개를 더한 쌍별 총액으로 비교한다.',{op:'northAmericanPairs',year:year,usCanada:usCanada,usMexico:usMexico,canadaMexico:canMexico}));return finish(q,r);
 }
 function euTrade(seed){
  var r=seedState(seed),q=start('eu-trade-arrows','EU 교역 총액과 방향별 품목 비중',seed,'강의 L2-rId209 · 2020~2023 평균 기출 자료');sourceFigure(q,'eu-trade-arrows');q.assignment=['사우디아라비아','이집트','튀르키예'];q.note='사각형 금액은 EU와의 양방향 무역 규모, 화살표의 %는 한 방향에서 1위인 품목의 비중이다. 분모를 바꾸어 곱하지 않는다.';
  q.pairs.push(pair('G104-2','581억 유로에 81.4%를 곱한 값을 사우디아라비아의 대EU 연료 수출액이라고 확정할 수 없다.','581억 유로×81.4%가 사우디아라비아의 대EU 연료 수출액이다.','581은 양방향 합계이고 81.4%의 분모는 한 방향 수출 총액이다. 그 방향 총액이 필요하다.',{op:'twoWayTotalVsExportShare',twoWay:581,share:81.4}));
  q.pairs.push(pair('G104-2','EU→국가의 화살표는 EU의 수출이면서 해당 국가의 수입이다.','EU→국가의 화살표는 해당 국가의 대EU 수출이다.','화살표의 출발 주체와 도착 주체를 먼저 확인한다.',{op:'tradeArrowDirection'}));return finish(q,r);
 }
 function tradeBubble(seed){
  var r=seedState(seed),q=start('trade-bubble','무역 좌표·원의 크기·총인구 역산',seed,'강의 L2-rId206 · 2016학년도 수능 14번');sourceFigure(q,'trade-bubble');q.note='원 가장자리가 아니라 중심에서 수입·수출액을 읽는다. 원의 면적은 1인당 무역액이며 총인구가 아니다. 금액 좌표는 십억 달러, 1인당 값은 달러이다.';
  q.stage1={question:'2013년에 수입액이 가장 큰 기호는?',options:['A','B','C'],answer:0,explain:'가로축이 수입액이다. 2013년 흰 원의 중심이 가장 오른쪽인 A이다.'};
  q.pairs.push(pair('G103-1','2009년 B는 수입액이 수출액보다 커서 적자이다.','2009년 B는 원이 작으므로 수입액이 수출액보다 작아 흑자이다.','가로 수입액과 세로 수출액의 중심 좌표를 비교한다. 원 크기는 수지와 다른 지표이다.',{op:'tradeBalanceFromCenter'}));
  q.pairs.push(pair('G103-2','총인구는 (수출액+수입액)을 1인당 무역액으로 나누어 구한다.','총인구는 수출액과 수입액의 차이를 1인당 무역액으로 나누어 구한다.','분자의 무역액은 합이다. 십억 달러를 달러로 바꾸려면 10억을 곱한다.',{op:'tradePopulationIdentity',currencyScale:1e9}));
  q.pairs.push(pair('G103-2','2013년 A는 C보다 총무역액이 커도 총인구는 더 적을 수 있으며 이 자료에서는 그렇게 판정된다.','2013년 A의 원이 더 크므로 총인구도 반드시 C보다 많다.','총무역액÷1인당 무역액으로 비교한다. 원의 범례는 1인당 값이다.',{op:'bubbleVsPopulation'}));return finish(q,r);
 }
 function tradeTriangle(seed){
  var r=seedState(seed),q=start('trade-composition-triangle','수출·수입 구성 삼각 그래프',seed,'강의 L2-rId207 · 2011년 기출 자료');sourceFigure(q,'trade-triangle');q.assignment=['사우디아라비아','오스트레일리아','중국'];q.note='빈 원=수출 비중, 검은 원=수입 비중이다. 분류되지 않은 상품·취급품을 제외한 나머지 합을 각각 100으로 환산했다. 선은 같은 국가의 두 방향을 연결한다.';
  q.pairs.push(pair('G103-3','같은 국가의 빈 원과 검은 원을 연결한 선은 수출·수입 구성 차이이다.','빈 원과 검은 원의 연결선은 두 해 사이 국가 위치 이동을 뜻한다.','시계열도 이동 경로도 아니다. 2011년 같은 국가의 두 교역 방향이다.',{op:'tradeTriangleDirection'}));
  q.pairs.push(pair('G103-3','수출과 수입은 각각 다른 총액을 100으로 만든 구성이다.','수출·수입에서 한 품목 비중이 같으면 양방향 품목 금액도 반드시 같다.','두 방향의 실제 총액이 없으면 비중만으로 품목 금액을 비교하지 않는다.',{op:'tradeTriangleDenominator'}));return finish(q,r);
 }
 function blocTrade(seed){
  var r=seedState(seed),q=start('bloc-trade-bars','블록의 역내·역외 교역 비율',seed,'강의 L2-rId212 · 2020년 기출 제시 자료');sourceFigure(q,'bloc-trade');q.note='역내·역외의 기준은 해당 블록의 회원 범위이다. GDP·무역 총액·역내 비율·통합 수준은 서로 다른 비교이다.';
  q.stage1={question:'오른쪽 막대에서 역내 교역액 비율이 가장 높은 기호는?',options:['(가)','(나)','(다)','(라)'],answer:0,explain:'(가)의 역내÷(역내+역외)가 가장 높다. (가)는 EU이고 다른 세 블록보다 역내 비율이 크다.'};
  q.pairs.push(pair('G107-1','역내 교역 비율은 역내÷(역내+역외)×100으로 구한다.','역내 교역 비율은 역내÷역외×100으로 구한다.','역내와 역외를 합한 교역 총액이 분모이다.',{op:'intraTradeDenominator'}));
  q.pairs.push(pair('G107-1','EU의 회원 사이 교역이 다른 블록 기준에서도 언제나 역내인 것은 아니다.','어느 국가 쌍이든 한 블록에서 역내이면 모든 블록 기준에서도 역내이다.','역내라는 말의 기준 집합인 블록을 먼저 확인한다.',{op:'blocMembershipScope'}));
  q.pairs.push(pair('G107-2','USMCA의 역내 GDP가 EU보다 커도 통합 수준이 더 높다는 뜻은 아니다.','USMCA의 역내 GDP가 EU보다 크므로 공동 통화·통합 수준도 더 높다.','회원국 경제 규모의 합과 통합 제도의 범위를 분리한다.',{op:'gdpVsIntegration'}));return finish(q,r);
 }
 function iceAnomaly(seed){
  var r=seedState(seed),q=start('sea-ice-anomaly','해빙 범위 편차의 기준·단위',seed,'강의 L2-rId216 · 기출 그래프');sourceFigure(q,'sea-ice-anomaly');q.note='편차의 기준은 1981~2010년 평균이고 세로축 단위는 백만 km²이다. 실측 범위 자체와 편차를 구별한다.';
  q.stage1={question:'편차가 0인 때의 뜻은?',options:['기준 기간 평균과 해빙 범위가 같다.','해빙 면적이 0이다.','북극의 모든 얼음이 사라졌다.'],answer:0,explain:'0은 기준값과의 차이가 0이라는 뜻이다.'};
  q.pairs.push(pair('G110-7','편차 −2는 기준보다 해빙 범위가 200만 km² 좁다는 뜻이다.','편차 −2는 해빙 범위가 −2km²라는 뜻이다.','단위 백만 km²와 편차의 기준을 함께 읽는다.',{op:'anomalyUnits',deviation:-2,scale:1000000}));
  q.pairs.push(pair('G110-7','일시적으로 증가하는 구간이 있어도 제시 기간의 전체 방향은 감소이다.','짧은 기간에 증가한 구간이 하나라도 있으므로 전체 감소 경향은 없다.','단기 변동과 장기 방향을 구별한다.',{op:'trendVsFluctuation'}));return finish(q,r);
 }
 function ozone(seed){
  var r=seedState(seed),q=start('ozone-area','오존 구멍의 연도·계절·결측',seed,'강의 L2-rId217 · 2018학년도 6월 20번');sourceFigure(q,'ozone-area');q.note='연도별 막대는 매년 9월 7일~10월 13일 평균이다. 연중 곡선은 1979~2016년 평균이다. 연도·계절·공간 면적을 구별한다.';
  q.stage1={question:'연도별 그래프에서 1995년을 어떻게 읽어야 하는가?',options:['원문에 자료가 없다고 표시된 해이다.','오존 구멍 면적이 0인 해이다.','오존 구멍이 완전히 회복된 해이다.'],answer:0,explain:'주석의 결측을 0이라는 관측값으로 바꾸지 않는다.'};
  q.pairs.push(pair('G111-3','남반구 9~10월은 봄이며 오존 구멍 면적이 큰 시기이다.','남반구 9~10월은 가을이므로 한국과 같은 계절이다.','남북반구의 계절을 구별한다.',{op:'southernOzoneSeason'}));
  q.pairs.push(pair('G111-3','1980년대 초보다 이후의 면적이 대체로 커도 해마다 예외 없이 증가한 것은 아니다.','제시 기간에는 모든 해에 오존 구멍 면적이 전년보다 커졌다.','장기 경향과 매년의 증감을 구별한다.',{op:'ozoneTrend'}));
  q.pairs.push(pair('G111-3','막대는 해당 연도 전체 평균이 아니라 주석의 특정 기간 평균이다.','막대 하나는 언제나 해당 연도 1~12월 전체 평균이다.','관측 기간·평균 기간을 원문 주석대로 유지한다.',{op:'ozoneAveragingWindow'}));return finish(q,r);
 }
 function iceOzoneMaps(seed){
  var r=seedState(seed),q=start('ice-ozone-maps','북극 해빙과 남극 오존의 흰 영역',seed,'강의 L2-rId218 · 2017학년도 6월 6번');sourceFigure(q,'ice-and-ozone-maps');q.assignment=['북극 해빙','남극 상공 오존량'];q.note='두 그림의 흰 영역은 같은 물질·지표가 아니다. 점선과 색 범례를 각각 읽는다.';
  q.pairs.push(pair('G111-5','(가)의 점선은 해빙의 최대 범위이다.','(가)의 점선은 오존 구멍의 최대 범위이다.','북극 해빙 사진의 주석을 따른다.',{op:'seaIceDottedExtent'}));
  q.pairs.push(pair('G111-5','(나)의 밝은 영역은 대기 중 오존량이 적은 곳이다.','(나)의 밝은 영역은 남극 얼음이 더 두껍게 쌓인 곳이다.','남극 지도 범례는 얼음 면적·두께가 아니라 대기 중 오존량이다.',{op:'ozoneMapLegend'}));return finish(q,r);
 }

 function mapTypes(seed){
  var r=seedState(seed),types=['단계 구분도','점묘도','유선도','도형표현도','등치선도','왜상 지도'],kind=seed%6,q=start('stat-map-types','통계 지도의 표현 방법',seed,'앱이 만든 가상 6개 지역 모식 자료');
  q.figures.push({kind:'stat-map',mode:kind});q.note='가상 지역의 같은 바탕을 이용한 표현 방법의 예시이다. 특정 국가의 관측값이 아니다. 점묘도의 점은 개별 주민 위치가 아니며, 왜상 지도의 면적은 통계량에 비례한다.';
  q.stage1={question:'제시한 지도의 표현 방법은?',options:types,answer:kind,explain:['지역별 비율·밀도를 색의 단계로 나타낸다.','일정한 양을 나타내는 점의 개수로 총량을 표시한다.','선의 방향과 굵기로 이동 방향·양을 나타낸다.','도형의 면적을 총량에 비례시킨다.','같은 값을 갖는 지점을 선으로 연결한다.','통계량에 비례하도록 지역 면적을 바꾼다.'][kind]};
  q.pairs.push(pair('G008-2',q.stage1.explain,['단계 구분도는 점의 개수로 표현한다.','점 하나는 실제 주민 한 명의 집 위치이다.','화살표가 반대 방향이면 이동 방향은 언제나 같다.','원의 반지름이 두 배이면 원 면적도 두 배이다.','등치선은 서로 다른 값을 가진 점을 임의로 잇는다.','왜상 지도에서 지역 면적은 반드시 실제 국토 면적과 같다.'][kind],q.stage1.explain,{op:'statMapType',mode:kind}));
  q.pairs.push(pair('G008-2','통계 지도를 읽을 때 범례의 단위와 분모를 확인한다.','통계 지도는 범례의 단위·분모를 몰라도 모든 순위를 확정할 수 있다.','총량·비율·밀도·이동량을 구별한다.',{op:'mapLegend'}));return finish(q,r);
 }
 function gdpMaps(seed){
  var r=seedState(seed),names=['독일','프랑스','영국'],v=names.map(function(n){return D.countries[n].values;}),q=start('gdp-map-denominators','총 GDP와 1인당 GDP 지도',seed,'세계은행 WDI · 2023년 · Natural Earth 경계');
  q.note='왼쪽은 1인당 GDP(천 달러)의 단계, 오른쪽은 GDP 총액(십억 달러)에 비례하는 원 면적이다. 프랑스는 이 그림의 유럽 범위만 보인다. 원의 반지름이 아닌 면적을 총량에 대응한다.';
  ['gdppc','gdp'].forEach(function(field){q.figures.push({kind:'value-map',name:field==='gdp'?'GDP 총액 · 원 면적':'1인당 GDP · 단계 구분',mode:field,regions:names.map(function(n,i){return Object.assign({name:n,value:v[i][field]},D.maps[n]);}),bounds:[-12,41,16,60]});});
  q.tables.push(table(['국가','GDP(십억 달러)','1인당 GDP(천 달러)'],names.map(function(n,i){return[n,v[i].gdp,v[i].gdppc];}),'두 지도의 범례와 원자료'));
  winner(q,names,v.map(function(x){return x.gdp;}),'GDP 총액의 원이 가장 큰 국가는?','원의 면적이 총액에 비례한다.');
  q.pairs.push(pair('G008-4','같은 1인당 GDP여도 인구가 다르면 GDP 총액은 다를 수 있다.','1인당 GDP 지도의 색이 같으면 GDP 총액도 반드시 같다.','총액=1인당 값×인구이다.',{op:'gdpMapDenominator'}));
  q.pairs.push(pair('G008-4','총 GDP를 나타낸 원의 면적이 두 배이면 표시된 총액도 두 배이다.','총 GDP를 나타낸 원의 반지름이 두 배이면 표시된 총액도 두 배이다.','원 면적은 반지름의 제곱에 비례한다.',{op:'areaVsRadius'}));return finish(q,r);
 }
 function schematicMap(mode,seed){
  var r=seedState(seed),q=start(mode,mode==='facility-map'?'기업 시설의 분포와 기능':'강수량과 산성도 지도',seed,'앱이 만든 가상 지역의 모식 자료');
  if(mode==='facility-map'){
   q.figures.push({kind:'facility-map'});q.note='실제 기업의 위치·시설 수가 아닌 모식도이다. 기업 국적·본사 위치와 모든 시설의 입지는 서로 다를 수 있다.';
   q.stage1={question:'대도시 전문 인력·대학 주변의 △와 여러 해외 시장의 □에 해당하는 기능은?',options:['△ 연구소 · □ 생산 공장','△ 생산 공장 · □ 연구소','△ 적환지 · □ 대학'],answer:0,explain:'범례와 분포를 함께 본다. 연구소는 지식·전문 인력, 공장은 시장·물류·생산 조건을 고려한다.'};
   q.pairs.push(pair('G102-6','본사가 있는 나라와 생산 공장이 있는 나라는 다를 수 있다.','본사가 한 나라에 있으면 모든 연구소·공장도 반드시 그 나라에 있다.','다국적 기업의 시설 기능별 국제 분업이다.',{op:'facilityFunction'}));
   q.pairs.push(pair('G102-6','연구소·조립 공장 등 기능에 따라 중요한 입지 조건이 다르다.','연구소와 모든 생산 공장은 기능과 관계없이 가장 싼 인건비만을 추구한다.','시설 기능과 입지 조건을 대응한다.',{op:'facilityLocation'}));
  }else{
   var rain=[600,1200,900,700,1500,1000],ph=[4,5,4.5,5.5,4.2,5.2];q.note='가상 관측값이다. 강수량의 단위는 mm이고 pH는 수소 이온 농도의 로그 척도다. 관측 기간은 같다고 가정하며 실제 오염 지도를 뜻하지 않는다.';
   q.figures.push({kind:'grid-map',name:'강수량(mm)',values:rain},{kind:'grid-map',name:'pH',values:ph});
   q.stage1={question:'산성도가 가장 높은(수소 이온 농도가 가장 큰) 지역은?',options:['A','B','C','D','E','F'],answer:0,explain:'pH가 가장 작은 A(4.0)를 고른다. 강수량 최대 지역 E와 다르다.'};
   q.pairs.push(pair('G112-5','E의 강수량이 가장 많아도 이 자료에서 가장 산성인 지역은 A이다.','강수량이 가장 많은 E가 pH도 가장 낮다고 판정할 수 있다.','각 지도에서 표시하는 지표·범례를 따로 읽는다.',{op:'rainVsPH',rain:rain,ph:ph}));
   q.pairs.push(pair('G112-5','pH 4인 A의 수소 이온 농도는 pH 5인 B의 10배이다.','pH 4인 A는 pH 5인 B보다 수소 이온 농도가 작다.','pH가 1 낮아지면 수소 이온 농도는 10배이다.',{op:'pHScale',a:4,b:5,result:10}));
  }return finish(q,r);
 }
 function andesConditions(seed){
  var r=seedState(seed),names=shuffle(['에콰도르','페루','볼리비아','브라질'],r),raw={'에콰도르':[true,true,false,false],'페루':[true,false,false,true],'볼리비아':[false,true,true,true],'브라질':[false,false,true,false]},q=start('andes-conditions','남미의 국가·도시 범위 조건',seed,'강의 G131-5 · 국가별 조건과 Natural Earth 지도');
  q.assignment=names;q.identify='지도 (가)·(나)·(다)·(라)의 국가를 순서대로 고른 것은?';q.note='수도 고도는 도시를, 해안·국경·반구 조건은 국토 전체를 대상으로 한다. 볼리비아는 헌법상 수도 수크레와 행정 수도 라파스가 모두 해발 2,000m 이상이다.';
  q.tables.push(table(['후보','태평양 연안','수도 2,000m 이상','아르헨티나와 국경','국토 전체 남반구'],Object.keys(raw).map(function(n){return[n].concat(raw[n].map(function(v){return v?'예':'아니요';}));}),'판정 조건'));
  q.figures.push({kind:'map',bounds:[-85,-57,-32,15],regions:names.map(function(n,i){return Object.assign({letter:['(가)','(나)','(다)','(라)'][i]},D.maps[n]);})});
  q.pairs.push(pair('G131-5','볼리비아와 브라질은 모두 아르헨티나와 국경을 접한다.','에콰도르와 페루는 모두 아르헨티나와 국경을 접한다.','지도상의 접경 관계를 조건 표와 대응한다.',{op:'andesConditions'}));
  q.pairs.push(pair('G131-5','브라질은 적도가 국토를 지나므로 국토 전체가 남반구인 나라는 아니다.','브라질의 수도가 남반구에 있으므로 국토 전체도 남반구에 있다.','도시 한 점의 위치와 국토 전체의 범위를 구별한다.',{op:'pointVsCountry'}));return finish(q,r);
 }
 function asianExports(seed){
  var r=seedState(seed),q=start('asian-export-items','동아시아·오세아니아 수출 품목',seed,'강의 L2-rId232 · 2018년 기출 제시 자료');q.figures.push({kind:'image',src:D.panels.find(function(p){return p.id==='asian-exports';}).path,name:'네 국가의 수출 품목 구성(2018년)'});
  q.assignment=['중국','일본','인도네시아','오스트레일리아'];q.identify='(가)·(나)·(다)·(라)에 해당하는 국가를 순서대로 고른 것은?';q.identifyExplain='기계류·의류는 중국, 기계류·자동차는 일본, 석탄·팜유·천연가스는 인도네시아, 석탄·철광석은 오스트레일리아이다.';q.note='2018년 제시 자료이다. 현재 순위나 국내 생산·고용 구성으로 바꾸지 않는다. 기타는 나머지 여러 품목의 합이다.';
  q.pairs.push(pair('G123-5','석탄·팜유·천연가스가 보이는 (다)는 인도네시아이다.','석탄·팜유·천연가스가 보이는 (다)는 일본이다.',q.identifyExplain,{op:'exportItems2018'}));
  q.pairs.push(pair('G123-5','오스트레일리아의 수출 구성에서는 석탄·철광석이 큰 비중을 차지한다.','이 그림의 오스트레일리아는 의류·자동차가 수출의 대부분을 차지한다.','표시된 수출 품목과 범례를 대응한다.',{op:'exportItems2018'}));return finish(q,r);
 }

 function demographic(mode,seed){
  var r=seedState(seed),names=shuffle(mode==='migration-continents'?['아시아','유럽','아프리카']:['인도','멕시코','독일'],r),q=start(mode,mode==='population-periods'?'기간별 인구 증감 누계':'자연·사회·전체 증가의 분모',seed,'세계은행 WDI / UN WPP · 원자료 2010~2023년');
  if(mode==='population-periods'){
   q.note='WDI 연간 인구·출생률·사망률로 자연 증감 인원을 근사하고 연간 순이동 인원을 더한 계산 자료이다. UN WPP 원표의 정확한 기간별 출생−사망 인원이 아니며, 두 시점 총인구의 정확한 차이로 간주하지 않는다. 같은 사람을 기간마다 중복 누계하지 않는다.';
   var rows=names.map(function(n){return[[2010,2014],[2015,2019]].map(function(p){var natural=0,net=0;for(var y=p[0];y<=p[1];y++){var row=D.demography.countries[n][y];natural+=row.naturalApprox;net+=row.netMigration;}return[round(natural/1e6,3),round(net/1e6,3)];});});
   q.tables.push(table(['국가','2010~14 자연 증감 근사','2010~14 순이동','2015~19 자연 증감 근사','2015~19 순이동'],names.map(function(n,i){return[n].concat(rows[i].flat());}),'단위: 백만 명 · 표시값으로 계산'));
   winner(q,names,rows.map(function(row){return A.sum(row.flat());}),'제시 두 기간의 누적 총증가 계산값이 가장 큰 국가는?','각 기간 자연 증감+순이동을 더하고 두 기간을 합한다.');
   names.forEach(function(n,i){var x=rows[i].flat(),value=A.sum(x);q.figures.push({kind:'grouped-bars',labels:['2010~14','2015~19'],categories:['자연 증감 근사','순이동'],values:rows[i],maximum:Math.max.apply(null,x.map(Math.abs)),yLabel:'백만 명',name:n});q.pairs.push(pair('G053-4',n+'의 두 기간 누적 총증가 계산값은 약 '+fmt(value,3)+'백만 명이다.',n+'의 누적 총증가는 자연 증감을 무시하고 순이동 두 값만 더하면 된다.','두 성분을 같은 단위로 더한다. 모든 수치는 표의 반올림 표시값 기준이다.',{op:'sum',values:x,result:value}));});
  }else{
   var rows=names.map(function(n){if(mode==='migration-continents'){var s=D.groupSeries[n].series;return{n:n,p:s.pop['2023'],natural:s.nir['2023']/10,net:s.netmig['2023']};}var x=D.demography.countries[n]['2023'];return{n:n,p:x.population,natural:(x.birthPerThousand-x.deathPerThousand)/10,net:x.netMigration};});
   rows.forEach(function(x){x.social=x.net/x.p*100;x.total=x.natural+x.social;});q.note='2023년 같은 해 인구를 분모로 한 계산 연습이다. 자연 증가율+순이동률로 전체 증가율을 구성했다. 세계은행의 로그형 연간 인구 증가율이나 두 시점 인구 차이를 그대로 재현한 값이 아니다. 대륙은 기존 UN M49 집계·가용 자료 범위를 따른다.';
   q.tables.push(table(['국가·권역','기준 인구(명)','자연 증가율(%)','구성한 전체 증가율(%)'],rows.map(function(x){return[x.n,x.p,round(x.natural,5),round(x.total,5)];}),'표의 표시된 증가율 차이로 계산'));
   q.figures.push({kind:'scatter',zero:true,diagonal:true,xLabel:'자연 증가율(%)',yLabel:'구성한 전체 증가율(%)',points:rows.map(function(x){return{name:x.n,x:x.natural,y:x.total,size:1};})});
   winner(q,names,rows.map(function(x){return x.social;}),'순이동률(전체−자연)이 가장 높은 대상은?','대각선과의 세로 차이를 읽는다. 대각선 위는 순유입이다.');
   rows.forEach(function(x,i){var tr=q.tables[0].rows[i],a=tr[3],b=tr[2],netRate=a-b;q.pairs.push(pair('G135-1',x.n+'의 순이동률은 약 '+fmt(netRate,5)+'%이다.',x.n+'의 순이동률은 약 '+fmt(b-a+.5,5)+'%이다.','같은 단위의 전체 증가율−자연 증가율이다.',{op:'subtract',a:a,b:b,result:netRate}));});
   q.pairs.push(pair('G057-2','점이 대각선 y=x 위쪽에 있으면 전체 증가율이 자연 증가율보다 커 순유입이다.','점이 대각선 y=x 아래쪽에 있으면 자연 증가율보다 전체 증가율이 작으므로 순유입이다.','가로·세로 축의 정의를 확인하고 전체−자연의 부호를 읽는다.',{op:'netMigrationDiagonal'}));
   q.pairs.push(pair('G057-3','순이동률의 절댓값만으로 순이동 인원 순위를 정하지 않고 같은 해 기준 인구를 곱해야 한다.','순유출률의 절댓값이 작으면 기준 인구에 관계없이 순유출 인원도 반드시 작다.','순이동 인원≈기준 인구×순이동률/100. 인구 규모와 비율을 함께 읽는다.',{op:'migrationDenominator',rows:rows}));
  }return finish(q,r);
 }
 function capacityRanks(seed){
  var r=seedState(seed),db=D.capacity.countries,names=Object.keys(db),q=start('renewable-capacity-ranks','설비 용량·발전량 순위 대조',seed,'IRENA Renewable Energy Statistics 2025 · 2023년');
  var cap=names.slice().sort(function(a,b){return db[b].capacityMW-db[a].capacityMW;}),gen=names.slice().sort(function(a,b){return db[b].generationGWh-db[a].generationGWh;});q.note=D.capacity.scope;
  q.tables.push(table(['순위','설비 용량 국가','MW','발전량 국가','GWh'],cap.map(function(n,i){return[i+1,n,db[n].capacityMW,gen[i],db[gen[i]].generationGWh];}),'두 열은 각각 독립적인 순위'));
  q.stage1={question:'독일과 캐나다의 순위가 두 지표에서 어떻게 달라지는가?',options:['설비 용량 독일>캐나다, 발전량 독일<캐나다','두 지표 모두 독일>캐나다','두 지표 모두 독일<캐나다'],answer:0,explain:'2023년 독일 159,886MW·270,110GWh, 캐나다 107,672MW·418,837GWh이다.'};
  q.pairs.push(pair('G087-3','설비 용량 순위와 연간 발전량 순위는 다를 수 있다.','설비 용량이 큰 국가는 모든 해에 반드시 발전량도 더 많다.','가동 시간·이용률·발전원 구성이 달라질 수 있다.',{op:'capacityVsGeneration',germany:db['독일'],canada:db['캐나다']}));
  q.pairs.push(pair('G087-3','MW와 GWh는 서로 다른 물리량이므로 수치를 바로 빼서 발전 효율을 구할 수 없다.','설비 용량 MW에서 발전량 GWh를 빼면 그대로 발전 효율(%)이다.','전력(용량)과 에너지(발전량), 시간 범위를 구별한다.',{op:'powerVsEnergy'}));return finish(q,r);
 }
 function foodBalance(seed){
  var r=seedState(seed),names=shuffle(['프랑스','독일','인도'],r),q=start('food-stock-balance','생산·교역·재고 수급 계산',seed,'FAOSTAT FBS 2023년 제시 생산·교역 + 명시한 가상 재고 변화');
  var rows=names.map(function(n,i){var x=data.agriculture[n];return[round(x['fbs-production:곡물 전체']/1e6,3),round(x['fbs-imports:곡물 전체']/1e6,3),round(x['fbs-exports:곡물 전체']/1e6,3),[1,-.5,.2][i]];});
  q.note='곡물 전체의 생산·수입·수출은 FAOSTAT FBS(백만 t), 재고 변화는 계산을 위한 가정이다. 재고 증가를 양수·감소를 음수로 정의했다. 원 FAOSTAT Stock Variation의 부호를 그대로 복사한 자료가 아니다.';
  q.tables.push(table(['국가','생산','수입','수출','가정: 재고 증가(+)·감소(−)'],rows.map(function(x,i){return[names[i]].concat(x);}),'단위: 백만 t · 재고 변화는 가상 입력'));
  winner(q,names,rows.map(function(x){return x[0]+x[1]-x[2]-x[3];}),'정의한 공급 가능량(생산+수입−수출−재고 증가)이 가장 큰 국가는?','식용 소비뿐 아니라 사료·가공 등 국내 용도 전체를 포함하는 수급 계산이다.');
  rows.forEach(function(x,i){q.pairs.push(pair('G075-2',names[i]+'의 공급 가능량은 약 '+fmt(x[0]+x[1]-x[2]-x[3],3)+'백만 t이다.',names[i]+'의 공급 가능량은 재고 증가를 더하고 수입은 빼서 구한다.','생산+수입−수출−재고 증가. 재고 감소가 음수이면 이를 빼므로 공급이 늘어난다.',{op:'foodBalance',production:x[0],imports:x[1],exports:x[2],stockIncrease:x[3],result:x[0]+x[1]-x[2]-x[3]}));});
  q.pairs.push(pair('G075-2','수입·재고·재수출이 있으면 수출÷생산을 그해 생산된 물량 중 수출 몫으로 단정할 수 없다.','수출÷생산은 재수출·재고 반출이 있어도 언제나 그해 생산물의 수출 몫이다.','물량의 원천과 귀속 연도를 구별한다.',{op:'reexportsAndStocks'}));return finish(q,r);
 }
 return [
  ['ethnic-stacks','집단별 누적 인구와 비중',ethnicStacks],['industry-remainder','세 산업 합=100에서 나머지 복원',industryRemainder],['industry-amount','GDP×2차 산업 비중',industryAmount],
  ['population-periods','기간별 자연 증감·순이동 누계',function(s){return demographic('population-periods',s);}],['migration-scatter','자연·전체 증가율 산점도',function(s){return demographic('migration-scatter',s);}],['migration-continents','대륙 순이동률과 총인원',function(s){return demographic('migration-continents',s);}],['renewable-capacity-ranks','설비 용량·발전량 순위',capacityRanks],['food-stock-balance','곡물 수급과 가상 재고 변화',foodBalance],
  ['stat-map-types','여섯 통계 지도 유형',mapTypes],['gdp-map-denominators','GDP 총량·1인당 지도',gdpMaps],['facility-map','기업 시설 분포 모식도',function(s){return schematicMap('facility-map',s);}],['rain-ph-maps','강수량·pH 지도',function(s){return schematicMap('rain-ph-maps',s);}],['andes-conditions','남미 조건과 지도 대응',andesConditions],['asian-export-items','아시아·오세아니아 수출 품목',asianExports],
  ['north-america-trade','북미 교역 화살표',northAmericaTrade],['eu-trade-arrows','EU 교역 방향·품목 비중',euTrade],['trade-bubble','무역 좌표·인구 역산',tradeBubble],['trade-composition-triangle','수출·수입 삼각 구성',tradeTriangle],['bloc-trade-bars','블록별 역내·역외 교역',blocTrade],['sea-ice-anomaly','해빙 범위 편차',iceAnomaly],['ozone-area','오존 구멍 시계열',ozone],['ice-ozone-maps','해빙·오존 지도 구별',iceOzoneMaps],
  ['anticline-trap','배사 트랩 모식도',trap],['meander-banks','곡류·종단면 모식도',meander],['religion-symbols','종교 상징·국장',religionSymbols],['mineral-relative','광물 최대=100 상대값',mineralRelative],
  ['population-pyramid','성별·연령별 인구 피라미드',function(s){return pyramid('population-pyramid',s);}],['pyramid-cohort','두 시점 코호트 추적',function(s){return pyramid('pyramid-cohort',s);}],['religion-top-two','종교 1·2위와 기호',religionRanks],['religion-score','종교 학습지 평가 점수',religionScore],['resource-area','자원 생산 면적 그래프',function(s){return area('resource-area',s);}],['population-area','대륙별 국가 인구 면적',function(s){return area('population-area',s);}],['regional-radar','항목별 최대=100 방사형',regionalRadar],['fossil-denominators','세계 자원 몫·국가 구성',fossilDenominators],
  ['oldmap-images','고지도 원그림',function(s){return photo('oldmap-images',s);}],['coast-images','해안 경관 원사진',function(s){return photo('coast-images',s);}],['religious-buildings','실제 종교 건축',function(s){return photo('religious-buildings',s);}],['traditional-houses','전통 가옥 사진',function(s){return photo('traditional-houses',s);}],['road-images','맨해튼·파리 도로망',function(s){return photo('road-images',s);}],['city-images','리우·멕시코시티·쿠스코',function(s){return photo('city-images',s);}],['irrigation-images','관개 시설 사진',function(s){return photo('irrigation-images',s);}],['night-lights','야간 빛·국가 위치',nightLights],['china-grain-map','중국 곡물 점지도',chinaGrains],['livestock-composition','국가 내부 가축 구성',livestockComposition],
  ['grain-size','입도 분포·분급',grainSize],['lake-types','수심·염분·호수',lakes],['solar-route','여행 경로·낮 길이',solarRoute],['vital-scatter','출생률·사망률 산점도',vitalScatter],['dependency-change','두 시점 부양비 변화',dependencyChange],
  ['grain-triangle','대륙의 세 곡물 구성',function(s){return agricultureTriangle('grain-triangle',s);}],['beverage-triangle','대륙의 기호 작물 구성',function(s){return agricultureTriangle('beverage-triangle',s);}],['livestock-denominators','가축의 두 단계 분모',livestockDenominators],['grain-export-scatter','곡물 생산·수출 비율',grainExport],['crop-trade-bubble','곡물 교역·생산량 원',cropTrade],
  ['fossil-triangle','대륙별 화석 연료 구성',function(s){return fossil('fossil-triangle',s);}],['fossil-remainder','화석 연료 나머지 복원',function(s){return fossil('fossil-remainder',s);}],['energy-per-capita','에너지 총량·1인당',function(s){return energyPC('energy-per-capita',s);}],['unequal-energy-axis','에너지의 서로 다른 축',function(s){return energyPC('unequal-energy-axis',s);}],['coal-production-consumption','석탄 생산 대비 소비',energyProduction],['renewables-denominators','발전량 분모의 범위',renewables],['australia-trade-change','호주의 상대국 비중 변화',australiaTrade],['environment-news','환경 기사·대응 수단',environmentNews],['treaty-tree','협약 도시 분류도',treatyTree],['industry-bubble','산업 좌표·1인당 GDP 원',industryBubble]
 ];
}
return{create:create};
});
