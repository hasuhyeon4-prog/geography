/* 기출형 주제 정의. Each theme is one kind of 평가원 자료 whose 대상 are hidden as (가)~(라).
 * The engine (assets/exam-engine.js) picks 대상 from `pool`, keeps only selections that the
 * shown data identify through verified relations (data/exam-relations.json), then builds
 * <보기> from assets/entity-kb.js. Schema and the rules for adding a theme:
 * docs/EXAM-FRAMEWORK.md. A theme plays only when status is 'ready'.
 * `followups.facts` lists the fact sets a <보기> may use ('hemisphere' for 북반구·남반구);
 * `followups.focus` marks those that belong to the theme, which <보기> prefer together with
 * comparisons and data items. `map:true` marks the 대상 and extra countries as A~E on a map;
 * `{candidates}` in a prompt becomes their names, or '지도에 표시된 A~E' on the map.
 * `hideable` lists the categories a 항목 식별 question may hide as A~C (indicator themes hide indicators).
 */
(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WGExamThemes=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 var themes=[
  {
   id:'bloc-indicators',status:'ready',title:'경제 블록의 지표 비교',lecture:'2권 P08',exams:['2023학년도 6월 10번','2026학년도 6월 10번'],
   kind:'indicators',entityType:'bloc',pool:['EU','USMCA','ASEAN','MERCOSUR'],pick:[4,4],
   indicators:['bloc-pop','bloc-gdp','bloc-trade','bloc-gdppc','bloc-members','bloc-area'],show:2,
   prompt:'{range}는 EU, USMCA, ASEAN, MERCOSUR 중 하나이다.'
  },
  {
   id:'continent-indicators',status:'ready',title:'대륙(권역)별 인구·경제·곡물 지표',lecture:'1권 P05 · 2권 P06',exams:['2024학년도 수능','2020학년도 6월 17번','2025학년도 수능 12번'],
   // The grain columns (FAOSTAT) are too few for a theme of their own; here they identify and
   // fill <보기> as background, while population stays the theme's focus.
   kind:'indicators',entityType:'continent',domains:[null,'agri'],pool:['아시아','아프리카','유럽','라틴 아메리카','앵글로아메리카','오세아니아'],pick:[3,4],
   always:['cont-pop'],indicators:['cont-density','cont-urban','cont-nir','cont-old','cont-young','cont-netmig','cont-agingIndex','cont-grainNet','cont-rice'],show:2,
   derived:[{rate:'cont-urban',total:'cont-pop',per:100,noun:'도시 인구'},{rate:'cont-old',total:'cont-pop',per:100,noun:'노년층 인구'},{rate:'cont-young',total:'cont-pop',per:100,noun:'유소년층 인구'}],
   prompt:'{range}는 아시아, 아프리카, 유럽, 라틴 아메리카, 앵글로아메리카, 오세아니아 중 하나이다. 러시아는 유럽에 포함한다.'
  },
  {
   id:'country-population',status:'ready',title:'국가별 인구 구조와 도시화',lecture:'1권 P05',exams:['2023학년도 수능','2025학년도 6월 16번','2020학년도 6월 14번'],
   kind:'indicators',entityType:'country',map:true,
   pool:['나이지리아','니제르','에티오피아','말리','세네갈','우간다','탄자니아','수단','이집트','알제리','일본','독일','프랑스','폴란드','스웨덴','벨기에','영국','미국','멕시코','브라질','아르헨티나','인도','인도네시아','베트남','말레이시아','타이','튀르키예','카타르','보츠와나','콩고 민주 공화국'],
   pick:[2,3],always:['pop'],indicators:['young','old','urban','nir'],show:2,
   derived:[{rate:'urban',total:'pop',per:100,noun:'도시 인구'},{rate:'old',total:'pop',per:100,noun:'노년층 인구'},{rate:'young',total:'pop',per:100,noun:'유소년층 인구'},{rate:'nir',total:'pop',per:1000,noun:'자연 증가한 인구 수'}],
   // 인구·도시 문항의 <보기>가 함께 묻는 위치·도시·블록·종교.
   followups:{facts:['capitalCity','bloc','euro','religion','hemisphere','equator','meridian','landlocked'],focus:['capitalCity']},
   prompt:'{range}는 {candidates} 중 하나이다.'
  },
  // 두 시점 도시화 (R7, UN WUP 2025). The two year columns identify through relations the lecture
  // states at each year (data/exam-relations-population-change.json), and a change between them
  // (상승 폭, 촌락 인구 증감) counts once both columns are shown.
  {
   id:'country-urban-change',status:'ready',title:'국가별 도시화율 변화(두 시점)',lecture:'1권 P05',exams:['2020학년도 9월 17번','2024학년도 6월 17번','2026학년도 수능 10번'],
   kind:'indicators',entityType:'country',map:true,periodTable:true,domains:['period',null],noRecall:['urban','pop'],
   // 독일 (2026학년도 수능 10번) has no relation the lecture states for these columns, so it is left out.
   pool:['영국','말레이시아','탄자니아','미국','브라질','니제르','파키스탄','차드'],
   pick:[3,4],always:['wup-share@1970','wup-share@2020','wup-rural@1970','wup-rural@2020'],indicators:['wup-total@2020'],show:1,
   derived:[{rate:'wup-share@2020',total:'wup-total@2020',per:100,noun:'2020년 도시 인구'}],
   changes:[{from:'wup-share@1970',to:'wup-share@2020',noun:'1970~2020년 도시화율 상승 폭',min:3}],
   changeSigns:[{from:'wup-rural@1970',to:'wup-rural@2020',noun:'1970~2020년 촌락 인구',min:5}],
   majority:['wup-share@1970','wup-share@2020'],
   followups:{facts:['capitalCity','bloc','euro','religion','hemisphere','equator','meridian','landlocked'],focus:[]},
   note:'UN WUP 2025의 추정치(국가별 도시 정의)이다. 기출 자료의 판본과 값이 조금 다를 수 있다. 도시화율 50%를 넘으면 도시 인구가 촌락 인구보다 많다.',
   prompt:'{range}는 {candidates} 중 하나이다. 표는 1970년과 2020년의 도시화율과 인구이다.'
  },
  {
   id:'continent-urban-change',status:'ready',title:'대륙별 도시·촌락 인구 변화(두 시점)',lecture:'1권 P05',exams:['2022학년도 수능 4번','2023학년도 수능 14번','2021학년도 9월 20번'],
   // 총인구·도시화율 are sums and ratios of the shown populations, so they are not asked as recall.
   kind:'indicators',entityType:'continent',periodTable:true,domains:['period',null],noRecall:['cont-pop','cont-urban','cwup-total@2020','cwup-share@1950','cwup-share@2020'],
   pool:['아시아','아프리카','유럽','라틴 아메리카','앵글로아메리카'],pick:[3,4],
   always:['cwup-urban@1950','cwup-rural@1950','cwup-urban@2020','cwup-rural@2020'],indicators:['cwup-share@1950','cwup-share@2020','cwup-total@2020'],show:1,
   changes:[{from:'cwup-urban@1950',to:'cwup-urban@2020',ratio:true,noun:'1950~2020년 도시 인구 증가율',more:'높다',min:1.2}],
   changeSigns:[{from:'cwup-rural@1950',to:'cwup-rural@2020',noun:'1950~2020년 촌락 인구',min:5}],
   majority:['cwup-share@1950','cwup-share@2020'],
   note:'UN WUP 2025의 추정치(국가별 도시 정의)이다. 라틴 아메리카는 카리브 지역을 포함하고, 앵글로아메리카는 UN의 Northern America이다. 도시화율이 올라도 촌락 인구가 늘 수 있다.',
   prompt:'{range}는 {candidates} 중 하나이다. 표는 1950년과 2020년의 대륙별 도시 인구·촌락 인구(백만 명)이다.'
  },
  {
   id:'country-economy',status:'ready',title:'국가별 GDP·산업 구조',lecture:'1권 P05 · 2권 P08·P10',exams:['2026학년도 수능 7번','2024학년도 6월 9번','2026학년도 6월 18번'],
   kind:'indicators',entityType:'country',map:true,
   pool:['중국','일본','영국','프랑스','폴란드','알제리','나이지리아','보츠와나','콩고 민주 공화국','독일','멕시코','이집트','인도','브라질','아르헨티나','칠레','타이','탄자니아','사우디아라비아','튀르키예'],
   pick:[2,3],indicators:['pop','gdp','gdppc','manufacturing','agriculture','industry','services','industryEmployment','exports'],show:2,
   derived:[{rate:'manufacturing',total:'gdp',per:100,noun:'제조업 부가가치'}],
   followups:{facts:['exportType','opec','bloc','apec','religion','capitalCity','hemisphere','equator','meridian','landlocked'],focus:['exportType','opec']},
   prompt:'{range}는 {candidates} 중 하나이다. 제조업·2차 산업의 GDP 비중과 종사자 비율을 구별한다.'
  },
  {
   id:'export-composition',status:'ready',title:'상품 수출 구성과 총수출액',lecture:'2권 P08·P11',exams:['2027학년도 9월 13번','2026학년도 6월 16번','2027학년도 6월 7번'],
   kind:'composition',composition:'exports',entityType:'country',what:'상품 수출 구성과 총수출액',reveals:['exportType'],map:true,
   pool:['사우디아라비아','나이지리아','튀르키예','멕시코','칠레','아르헨티나','브라질','오스트레일리아','인도네시아','일본'],
   pick:[3,3],show:['fuel','ores','food','agriculturalRaw','manufactures','other'],amountNoun:'수출액',hideable:['fuel','ores','food','manufactures'],
   followups:{facts:['opec','bloc','apec','latinLanguage','religion','capitalCity','hemisphere','equator','meridian','landlocked'],focus:['opec']},
   note:'상품 수출의 SITC 분류이다. 광석·금속에는 다이아몬드가 포함되지 않으며, 공산품 비중을 제조업 고용 비율로 읽지 않는다. 비율과 같은 해의 총액으로 구한 금액은 근삿값이다.',
   prompt:'{range}는 {candidates} 중 하나이다. 표는 상품 수출액의 품목별 비중과 총액이다. 같은 품목의 비중과 수출 금액을 구별한다.'
  },
  {
   id:'export-items',status:'ready',title:'국가별 수출 상위 품목',lecture:'2권 P08',exams:['2022학년도 수능 3번'],
   kind:'items',entityType:'country',map:true,pool:['나이지리아','칠레','케냐','브라질'],pick:[3,4],
   year:'2019',source:'한국교육과정평가원 2022학년도 수능 3번(강의 2권 P08)',
   items:{
    '나이지리아':[['원유',76.5],['천연가스',10.1],['선박',4.2]],
    '칠레':[['구리',26.5],['구리 제품',19.2],['어패류',3.9]],
    '케냐':[['차',19.1],['화훼류',10.0],['석유 제품',7.6]],
    '브라질':[['대두',11.6],['원유',10.7],['철광석',10.1]]
   },
   note:'나이지리아의 선박에는 원문 주석에 따라 해체용 선박이 포함된다. 케냐의 석유 제품 수출은 원유 매장의 증거가 아니다.',
   // The item table already shows the export type, copper, iron ore, oil and tea.
   reveals:['exportType','minerals','beverage'],
   followups:{facts:['opec','bloc','apec','latinLanguage','capitalCity','religion','christianity','hemisphere','equator','meridian','landlocked'],focus:['opec']},
   prompt:'{range}는 {candidates} 중 하나이다. 표는 수출액 상위 세 품목과 비중(%)이다.'
  },
  {
   id:'electricity-mix',status:'ready',title:'국가별 전력 생산 구성',lecture:'2권 P07',exams:['2025학년도 수능 9번','2027학년도 6월 8번'],
   kind:'composition',composition:'electricity',what:'발전량 구성과 총발전량',entityType:'country',reveals:[],map:true,
   pool:['프랑스','노르웨이','브라질','네팔','아이슬란드','덴마크','캐나다','중국','인도','러시아','이란','독일','케냐','미국','남아프리카 공화국','오스트레일리아'],
   // The verified top sources are only 원자력·수력·풍력, so three 대상, each identified by its own.
   pick:[3,3],everyKnown:true,show:['coal','gas','oil','nuclear','hydro','wind','solar','other'],amountNoun:'발전량',hideable:['coal','gas','nuclear','hydro','wind'],
   followups:{facts:['opec','bloc','euro','apec','religion','christianity','hemisphere','equator','meridian','landlocked'],focus:['opec']},
   prompt:'{range}는 {candidates} 중 하나이다. 표는 발전원별 발전량 비중(%)과 총발전량이다. 비중과 발전량을 구별한다.'
  },
  {
   id:'climate-graphs',status:'ready',title:'기후 그래프로 지역 판별',lecture:'1권 P02',exams:['2025학년도 수능 13번','2024학년도 9월 6번','2026학년도 수능 11번'],
   kind:'climate',entityType:'site',map:true,everyKnown:true,
   // Stations with complete 1991~2020 monthly temperature and precipitation (data/climate-normals.json,
   // plus 싱가포르(창이) from data/climate-normals-extension.json and 이키토스·다르에스살람 from
   // data/climate-normals-round2.json).
   pool:['양곤','발릭파판','다윈','배로(우트키아빅)','퍼스','오클랜드','파리','케이프타운','푸저우','보고타','런던','마르세유','마나우스','딕슨','치타','몬트리올','상파울루','라바트','쿤밍','크라이스트처치','샌프란시스코','선양','덴버','로차','더블린','메시나','브리즈번','창춘','디트로이트','블라디보스토크','로마','보스토크(남극)','리마','브라질리아','아디스아바바','시안','모스크바','로스앤젤레스','싱가포르(창이)','이키토스','다르에스살람'],
   pick:[3,4],
   note:'1991~2020년 관측소 평년값이다. 연교차 = 최난월 평균 기온 − 최한월 평균 기온. 남반구는 계절이 반대이다. 고산 기후는 저위도인데도 연중 서늘하고 연교차가 작다.',
   prompt:'{range}는 {candidates} 중 하나이다. 그래프는 월평균 기온(선)과 월 강수량(막대)이다.'
  },
  {
   id:'religion-composition',status:'ready',title:'국가별 종교 인구 구성',lecture:'1권 P04',exams:['2027학년도 9월 7번','2026학년도 수능 13번','2026학년도 6월 8번','2024학년도 9월 20번','2022학년도 6월 5번'],
   kind:'composition',composition:'religion',entityType:'country',map:true,what:'종교별 인구 비중과 총인구',
   // 레바논·나이지리아 stay as table rows only: their 1위 is not recalled (data/exam-relations.json).
   pool:['말레이시아','네팔','스리랑카','인도','방글라데시','미얀마','필리핀','우즈베키스탄','인도네시아','이스라엘','레바논','나이지리아','파키스탄','타이',
    '캄보디아','라오스','아프가니스탄','튀르키예','포르투갈','남수단'],
   pick:[3,4],show:['christianity','islam','hinduism','buddhism','judaism','unaffiliated','other'],hideable:['christianity','islam','hinduism','buddhism'],
   amountNoun:'신자 수',reveals:['religion'],
   // 동시 식별: countries and three religions both hidden (2026학년도 수능 13번·6월 8번).
   joint:true,jointPrompt:'{range}는 {candidates} 중 하나이고, A~C는 {columns} 중 하나이다. 표는 종교별 인구 비중(%)과 총인구이다.',
   followups:{facts:['islam','buddhism','christianity','bloc','capitalCity','hemisphere','equator','meridian','landlocked'],focus:['islam','buddhism','christianity']},
   prompt:'{range}는 {candidates} 중 하나이다. 표는 종교별 인구 비중(%)과 총인구이다.'
  },
  // 1차 에너지 소비 구성 (R2). Every 대상 has a lecture-named leading source verified every year.
  {
   id:'primary-energy',status:'ready',title:'국가별 1차 에너지 소비 구성',lecture:'2권 P07',exams:['2024학년도 6월 10번','2022학년도 6월 15번','2020학년도 수능 4번'],
   kind:'composition',composition:'primaryEnergy',entityType:'country',map:true,everyKnown:true,
   pool:['중국','인도','러시아','이란','브라질','남아프리카 공화국'],
   // Two-country questions too: 중국·인도·남아공 (석탄 1위) and 러시아·이란 (가스 > 석유) cannot share a
   // question, so with three every question would hold 브라질.
   pick:[2,3],show:['coal','oil','gas','nuclear','hydro','renewables'],hideable:['coal','oil','gas','hydro'],amountNoun:'소비량',what:'1차 에너지 소비 구성과 소비량',
   followups:{facts:['bloc','apec','religion','christianity','islam','capitalCity','hemisphere','equator','landlocked'],focus:[]},
   note:'1차 에너지는 발전에 쓰인 에너지와 수송·난방 등에 직접 쓰인 에너지를 모두 포함한다. 전력 생산 구성과 다르다. 원자력·수력·풍력·태양광 전력은 같은 전력을 화력으로 만들 때 드는 연료량으로 환산했다(대체법, EI). 그래서 물리적 에너지 함량 방식보다 이 비중들이 크게 나온다.',
   prompt:'{range}는 {candidates} 중 하나이다. 표는 1차 에너지 소비량의 에너지원별 비중(%)과 1차 에너지 소비량이다.'
  },
  // 광물 생산 (R2, BGS). Each column is one mineral's world share, so rows compare only within it.
  {
   id:'country-minerals',status:'ready',title:'국가별 광물 생산 비중',lecture:'2권 P07',exams:['2026학년도 수능 9번','2025학년도 6월 12번','2027학년도 6월 13번'],
   kind:'indicators',entityType:'country',map:true,domains:['mineral',null],
   // 콩고 민주 has no 철광석 value and its 구리 order against 페루 flips, so it comes with 칠레 alone.
   pool:['브라질','칠레','볼리비아','남아프리카 공화국','페루','콩고 민주 공화국'],pick:[2,3],
   always:[],indicators:['min-copper','min-iron'],show:2,
   followups:{facts:['latinLanguage','bloc','apec','religion','capitalCity','hemisphere','equator','meridian','landlocked'],focus:['latinLanguage']},
   note:'광물마다 세계 총량(분모)과 단위가 다르다(구리는 금속 함량, 철광석은 광석 무게). 그래서 서로 다른 광물의 비중끼리는 생산량을 비교할 수 없다.',
   prompt:'{range}는 {candidates} 중 하나이다. 표는 세계 생산량에서 각 나라가 차지하는 비중(%)이다.'
  },
  // 미국 주별 제조업 (data/us-state-manufacturing-series.json). The two exam sets never put 오하이오
  // with 미시간 or 워싱턴주, so the whitelist has no pair between them and such draws are not built.
  {
   id:'us-manufacturing',status:'ready',title:'미국 주별 제조업 구성',lecture:'2권 P08',exams:['2016학년도 9월 7번','2027학년도 6월 5번'],
   kind:'indicators',entityType:'usState',map:true,domains:['usMfg'],
   pool:['캘리포니아','텍사스','오하이오','미시간','워싱턴주'],pick:[3,4],
   always:[],indicators:['us-computer','us-petchem','us-machTrans','us-metal','us-aero','us-parts','us-total'],show:3,
   // 업종 출하액 = 총출하액 × 비중 (L2-B0698): asked only where share and amount point opposite ways.
   derived:[{rate:'us-computer',total:'us-total',per:100,noun:'컴퓨터·전자 제품 출하액'},{rate:'us-petchem',total:'us-total',per:100,noun:'석유·석탄 제품과 화학 제품 출하액'},
    {rate:'us-machTrans',total:'us-total',per:100,noun:'기계·운송 장비 출하액'},{rate:'us-metal',total:'us-total',per:100,noun:'1차 금속·금속 가공 제품 출하액'},
    {rate:'us-aero',total:'us-total',per:100,noun:'항공 우주 제품·부품 출하액'},{rate:'us-parts',total:'us-total',per:100,noun:'자동차 부품 출하액'}],
   followups:{facts:['usBelt','usCoast'],focus:[]},
   note:'비중은 각 주의 제조업 총출하액 대비 업종 출하액이다(부가가치·주 총생산과 다른 지표). 업종 출하액은 총출하액 × 비중으로 구한다. 2027학년도 6월 문항의 2024년 생산액과 같은 지표로 보지 않는다.',
   prompt:'{range}는 {candidates} 중 하나이다. 표는 각 주의 제조업 출하액에서 업종이 차지하는 비중(%)과 총출하액이다.'
  },
  // 지역지리: (가)~(다) are described by lecture sentences (data/country-clues.json, filtered in
  // scripts/build-entity-kb.cjs) and found on the map. The pool is every country with a clue.
  {
   id:'country-clues',status:'ready',title:'국가 설명으로 지도에서 찾기',lecture:'2권 P07·P08·P10 · 1권 P00·P04·P05',exams:['2027학년도 9월 9번','2027학년도 9월 12번','2027학년도 9월 18번'],
   kind:'clues',entityType:'country',map:true,
   // 덴마크·잠비아·에콰도르·페루·오스트레일리아 left with their only sentences (KB cluesDropped);
   // 사우디아라비아·말레이시아 because their clues hold part of the name (아라비아반도, 말레이반도);
   // 아르헨티나, alone in the Americas, because its map pins could only be other continents.
   pool:['에스파냐','프랑스','스웨덴','그리스','러시아','튀르키예','아이슬란드','이집트','에티오피아','콩고 민주 공화국','보츠와나','카타르','아랍 에미리트','아프가니스탄','인도','스리랑카','몽골','일본','미얀마','세네갈'],
   pick:[3,3],
   followups:{facts:['religion','christianity','islam','buddhism','bloc','apec','euro','latinLanguage','capitalCity','exportType','hemisphere','equator','meridian','landlocked'],
    focus:['religion','christianity','islam','buddhism','bloc','apec','euro','latinLanguage','capitalCity','exportType']},
   prompt:'{range}는 {candidates} 중 하나이다. 표의 문장은 강의에서 각 나라를 설명한 것이다.'
  },
  // 농목업 (data/agriculture.json, FAOSTAT). `domains` lets these themes recall the agriculture
  // relations and keeps them out of the others; `concepts` adds the concept-card statements.
  {
   id:'crop-identification',status:'ready',title:'3대 식량 작물 식별',lecture:'2권 P06',exams:['2027학년도 9월 17번','2020학년도 수능 3번','2025학년도 9월 11번'],
   kind:'indicators',entityType:'crop',domains:['agri'],concepts:true,
   pool:['밀','쌀','옥수수'],pick:[3,3],always:['crop-production'],indicators:['crop-exports','crop-exportRatio','crop-yield','crop-oceania'],show:2,
   // Only exclusive card sets: a non-exclusive one ('…와 연결된다') would be true every time.
   followups:{facts:['originContinent','topProducer'],focus:['originContinent','topProducer']},
   note:'쌀 생산량은 벼 기준이고, 수출량은 가공품을 환산해 포함한 수급표 값이다.',
   prompt:'{range}는 {candidates} 중 하나이다.'
  },
  {
   id:'livestock-identification',status:'ready',title:'주요 가축 식별',lecture:'2권 P06',exams:['2023학년도 9월 12번','2023학년도 수능 10번','2027학년도 6월 10번'],
   kind:'indicators',entityType:'livestock',domains:['agri'],concepts:true,
   pool:['소','돼지','양'],pick:[3,3],indicators:['lv-stocks','lv-meat','lv-americas','lv-oceania','lv-africa','lv-australia','lv-brazil','lv-china'],show:2,
   followups:{facts:['topRaiser'],focus:['topRaiser']},
   note:'소는 물소를 제외한 값이다. 육류 생산량은 사육 두수와 다른 지표이다.',
   prompt:'{range}는 {candidates} 중 하나이다.'
  },
  {
   id:'country-agriculture',status:'ready',title:'국가별 곡물 생산과 가축 사육',lecture:'2권 P06',exams:['2026학년도 수능 12번','2023학년도 9월 16번','2024학년도 9월 9번'],
   kind:'indicators',entityType:'country',map:true,domains:['agri'],
   pool:['중국','인도','미국','브라질','오스트레일리아','프랑스','아르헨티나','이집트','멕시코','에스파냐','타이','미얀마','베트남','인도네시아','에티오피아','케냐'],
   pick:[3,3],indicators:['agri-wheat','agri-rice','agri-maize','agri-cattle','agri-pigs','agri-sheep','agri-riceExports','agri-coffee','agri-grainNet'],show:2,
   followups:{facts:['religion','bloc','capitalCity','hemisphere','equator','landlocked'],focus:[]},
   note:'쌀 생산량은 벼 기준이다. 곡물 순수출량은 수급표의 수출량에서 수입량을 뺀 값이다.',
   prompt:'{range}는 {candidates} 중 하나이다.'
  }
 ];
 return {themes:themes,byId:Object.fromEntries?Object.fromEntries(themes.map(function(t){return [t.id,t]})):themes.reduce(function(o,t){o[t.id]=t;return o},{})};
});
