/* 기출형 주제 정의. Each theme is one kind of 평가원 자료 whose 대상 are hidden as (가)~(라).
 * The engine (assets/exam-engine.js) picks 대상 from `pool`, keeps only selections that the
 * shown data identify through verified relations (data/exam-relations.json), then builds
 * <보기> from assets/entity-kb.js. Schema and the rules for adding a theme:
 * docs/EXAM-FRAMEWORK.md. A theme plays only when status is 'ready'.
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
   id:'continent-indicators',status:'ready',title:'대륙(권역)별 인구·경제 지표',lecture:'1권 P05',exams:['2024학년도 수능','2020학년도 6월 17번'],
   kind:'indicators',entityType:'continent',pool:['아시아','아프리카','유럽','라틴 아메리카','앵글로아메리카','오세아니아'],pick:[3,4],
   always:['cont-pop'],indicators:['cont-density','cont-urban','cont-nir','cont-old','cont-young','cont-netmig','cont-agingIndex'],show:2,
   derived:[{rate:'cont-urban',total:'cont-pop',per:100,noun:'도시 인구'},{rate:'cont-old',total:'cont-pop',per:100,noun:'노년층 인구'},{rate:'cont-young',total:'cont-pop',per:100,noun:'유소년층 인구'}],
   prompt:'{range}는 아시아, 아프리카, 유럽, 라틴 아메리카, 앵글로아메리카, 오세아니아 중 하나이다. 러시아는 유럽에 포함한다.'
  },
  {
   id:'country-population',status:'ready',title:'국가별 인구 구조와 도시화',lecture:'1권 P05',exams:['2023학년도 수능','2025학년도 6월 16번','2020학년도 6월 14번'],
   kind:'indicators',entityType:'country',
   pool:['나이지리아','니제르','에티오피아','말리','세네갈','우간다','탄자니아','수단','이집트','알제리','일본','독일','프랑스','폴란드','스웨덴','벨기에','영국','미국','멕시코','브라질','아르헨티나','인도','인도네시아','베트남','말레이시아','타이','튀르키예','카타르','보츠와나','콩고 민주 공화국'],
   pick:[2,3],always:['pop'],indicators:['young','old','urban','nir'],show:2,
   derived:[{rate:'urban',total:'pop',per:100,noun:'도시 인구'},{rate:'old',total:'pop',per:100,noun:'노년층 인구'},{rate:'young',total:'pop',per:100,noun:'유소년층 인구'},{rate:'nir',total:'pop',per:1000,noun:'자연 증가한 인구 수'}],
   prompt:'{range}는 선택지에 나온 국가 중 하나이다.'
  },
  {
   id:'country-economy',status:'ready',title:'국가별 GDP·산업 구조',lecture:'1권 P05 · 2권 P08·P10',exams:['2026학년도 수능 7번','2024학년도 6월 9번','2026학년도 6월 18번'],
   kind:'indicators',entityType:'country',
   pool:['중국','일본','영국','프랑스','폴란드','알제리','나이지리아','보츠와나','콩고 민주 공화국','독일','멕시코','이집트','인도','브라질','아르헨티나','칠레','타이','탄자니아','사우디아라비아','튀르키예'],
   pick:[2,3],indicators:['pop','gdp','gdppc','manufacturing','agriculture','industry','services','industryEmployment','exports'],show:2,
   derived:[{rate:'manufacturing',total:'gdp',per:100,noun:'제조업 부가가치'}],
   prompt:'{range}는 선택지에 나온 국가 중 하나이다. 제조업·2차 산업의 GDP 비중과 종사자 비율을 구별한다.'
  },
  {
   id:'export-composition',status:'ready',title:'상품 수출 구성과 총수출액',lecture:'2권 P08·P11',exams:['2027학년도 9월 13번','2026학년도 6월 16번','2027학년도 6월 7번'],
   kind:'composition',composition:'exports',entityType:'country',reveals:['exportType'],
   pool:['사우디아라비아','나이지리아','튀르키예','멕시코','칠레','아르헨티나','브라질','오스트레일리아','인도네시아','일본'],
   pick:[3,3],show:['fuel','ores','food','agriculturalRaw','manufactures','other'],amountNoun:'수출액',
   note:'상품 수출의 SITC 분류이다. 광석·금속에는 다이아몬드가 포함되지 않으며, 공산품 비중을 제조업 고용 비율로 읽지 않는다. 비율과 같은 해의 총액으로 구한 금액은 근삿값이다.',
   prompt:'{range}는 상품 수출액의 품목별 비중과 총액이 표와 같은 국가이다. 같은 품목의 비중과 수출 금액을 구별한다.'
  },
  {
   id:'export-items',status:'ready',title:'국가별 수출 상위 품목',lecture:'2권 P08',exams:['2022학년도 수능 3번'],
   kind:'items',entityType:'country',pool:['나이지리아','칠레','케냐','브라질'],pick:[3,4],
   year:'2019',source:'한국교육과정평가원 2022학년도 수능 3번(강의 2권 P08)',
   items:{
    '나이지리아':[['원유',76.5],['천연가스',10.1],['선박',4.2]],
    '칠레':[['구리',26.5],['구리 제품',19.2],['어패류',3.9]],
    '케냐':[['차',19.1],['화훼류',10.0],['석유 제품',7.6]],
    '브라질':[['대두',11.6],['원유',10.7],['철광석',10.1]]
   },
   note:'나이지리아의 선박에는 원문 주석에 따라 해체용 선박이 포함된다. 케냐의 석유 제품 수출은 원유 매장의 증거가 아니다.',
   prompt:'{range}는 나이지리아, 칠레, 케냐, 브라질 중 하나이며, 수출액 상위 세 품목과 비중(%)을 나타낸 것이다.'
  },
  {
   id:'electricity-mix',status:'ready',title:'국가별 전력 생산 구성',lecture:'2권 P07',exams:['2025학년도 수능 9번','2027학년도 6월 8번'],
   kind:'composition',composition:'electricity',entityType:'country',reveals:[],
   pool:['프랑스','노르웨이','브라질','네팔','아이슬란드','덴마크','캐나다','중국','인도','러시아','이란','독일','케냐','미국','남아프리카 공화국','오스트레일리아'],
   pick:[3,4],show:['coal','gas','nuclear','hydro','wind','other'],
   prompt:'{range}는 발전원별 발전량 비중(%)이 표와 같은 국가이다.'
  },
  {
   id:'religion-composition',status:'ready',title:'국가별 종교 인구 구성',lecture:'1권 P04',exams:['2027학년도 9월 7번','2026학년도 6월 8번','2022학년도 6월 5번'],
   kind:'composition',composition:'religion',entityType:'country',
   pool:['말레이시아','네팔','스리랑카','인도','방글라데시','미얀마','필리핀','우즈베키스탄','인도네시아','이스라엘','레바논','나이지리아','파키스탄','타이'],
   pick:[3,4],show:['christianity','islam','hinduism','buddhism','judaism','unaffiliated'],
   amountNoun:'신자 수',reveals:['religion','islam'],
   prompt:'{range}는 종교별 인구 비중(%)과 총인구가 표와 같은 국가이다.'
  }
 ];
 return {themes:themes,byId:Object.fromEntries?Object.fromEntries(themes.map(function(t){return [t.id,t]})):themes.reduce(function(o,t){o[t.id]=t;return o},{})};
});
