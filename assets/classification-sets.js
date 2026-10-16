/* Country classification sets for the 분류 퀴즈 page.
 * Anchors follow the revised lectures (1권 P04 종교·문화·갈등, 2권 P08 경제 블록).
 * Religion is "신자 수 1위 종교", the basis 평가원 tables use; 무종교 is not a religion.
 * Countries whose ranking differs by source or is near-even are `mixed`: shown with a
 * note but never graded, so a disputed statistic cannot be marked right or wrong.
 * Bloc and currency membership is as checked in the lecture on 2026-09-25.
 */
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.WGClassification=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function list(text){return text.split(/\s*,\s*/).filter(Boolean)}
  function assign(target,value,names){list(names).forEach(function(name){target[name]=value});return target}

  var regions=[
    {id:'europe',name:'유럽',countries:list('영국,아일랜드,아이슬란드,포르투갈,에스파냐,안도라,프랑스,벨기에,네덜란드,룩셈부르크,독일,스위스,리히텐슈타인,오스트리아,이탈리아,바티칸,산마리노,몰타,덴마크,노르웨이,스웨덴,핀란드,에스토니아,라트비아,리투아니아,폴란드,체코,슬로바키아,헝가리,슬로베니아,크로아티아,보스니아 헤르체고비나,세르비아,루마니아,불가리아,그리스,키프로스,우크라이나,러시아')},
    {id:'africa',name:'아프리카',countries:list('모로코,알제리,튀니지,리비아,이집트,모리타니,말리,니제르,차드,수단,남수단,세네갈,기니,시에라리온,라이베리아,코트디부아르,가나,베냉,나이지리아,카메룬,에티오피아,소말리아,케냐,우간다,탄자니아,콩고 민주 공화국,앙골라,잠비아,짐바브웨,모잠비크,나미비아,보츠와나,남아프리카 공화국,마다가스카르')},
    {id:'westasia',name:'서남·중앙아시아',countries:list('튀르키예,시리아,레바논,이스라엘,요르단,이라크,이란,쿠웨이트,사우디아라비아,바레인,카타르,아랍 에미리트,오만,아제르바이잔,카자흐스탄,우즈베키스탄,투르크메니스탄,키르기스스탄,타지키스탄,아프가니스탄')},
    {id:'asia',name:'남부·동·동남아시아',countries:list('파키스탄,인도,네팔,방글라데시,스리랑카,중국,몽골,대한민국,일본,타이완,미얀마,타이,라오스,캄보디아,베트남,말레이시아,싱가포르,브루나이,인도네시아,필리핀,동티모르')},
    {id:'americas',name:'아메리카',countries:list('캐나다,미국,멕시코,쿠바,자메이카,아이티,도미니카 공화국,엘살바도르,코스타리카,파나마,콜롬비아,베네수엘라,가이아나,수리남,에콰도르,페루,볼리비아,브라질,파라과이,우루과이,칠레,아르헨티나')},
    {id:'oceania',name:'오세아니아',countries:list('오스트레일리아,뉴질랜드,파푸아뉴기니')}
  ];
  var regionOf={};
  regions.forEach(function(region){region.countries.forEach(function(name){regionOf[name]=region.id})});

  var noReligionNote='무종교 인구 비중이 높지만, 종교 중에서는 크리스트교가 1위.';
  var sets=[
    {
      id:'religion',title:'신자 수 1위 종교',lecture:'1권 P04',
      paintPhrase:'{x}가 1위 종교인 나라를',otherLabel:'종교 분류 자료가 없는 나라',
      assignQuestion:'색칠된 나라의 신자 수 1위 종교는?',
      basis:'국가별 신자 수 1위 종교(무종교 제외). 1·2위가 비슷하거나 통계마다 다른 나라는 채점하지 않습니다.',
      options:[
        {id:'christianity',label:'크리스트교',color:'#2f62b0'},
        {id:'islam',label:'이슬람교',color:'#25864f'},
        {id:'buddhism',label:'불교',color:'#c98612'},
        {id:'hinduism',label:'힌두교',color:'#c4441c'},
        {id:'judaism',label:'유대교',color:'#7b4bb3'}
      ],
      values:assign(assign(assign(assign(assign({},
        'christianity','영국,아일랜드,아이슬란드,포르투갈,에스파냐,안도라,프랑스,벨기에,네덜란드,룩셈부르크,독일,스위스,리히텐슈타인,오스트리아,이탈리아,바티칸,산마리노,몰타,덴마크,노르웨이,스웨덴,핀란드,에스토니아,라트비아,리투아니아,폴란드,체코,슬로바키아,헝가리,슬로베니아,크로아티아,세르비아,루마니아,불가리아,그리스,키프로스,우크라이나,러시아,남수단,라이베리아,가나,베냉,카메룬,에티오피아,케냐,우간다,탄자니아,콩고 민주 공화국,앙골라,잠비아,짐바브웨,모잠비크,나미비아,보츠와나,남아프리카 공화국,마다가스카르,필리핀,동티모르,캐나다,미국,멕시코,쿠바,자메이카,아이티,도미니카 공화국,엘살바도르,코스타리카,파나마,콜롬비아,베네수엘라,가이아나,수리남,에콰도르,페루,볼리비아,브라질,파라과이,우루과이,칠레,아르헨티나,오스트레일리아,뉴질랜드,파푸아뉴기니'),
        'islam','모로코,알제리,튀니지,리비아,이집트,모리타니,말리,니제르,차드,수단,세네갈,기니,시에라리온,소말리아,튀르키예,시리아,요르단,이라크,이란,쿠웨이트,사우디아라비아,바레인,카타르,아랍 에미리트,오만,아제르바이잔,카자흐스탄,우즈베키스탄,투르크메니스탄,키르기스스탄,타지키스탄,아프가니스탄,파키스탄,방글라데시,말레이시아,브루나이,인도네시아'),
        'buddhism','스리랑카,몽골,미얀마,타이,라오스,캄보디아,싱가포르'),
        'hinduism','인도,네팔'),
        'judaism','이스라엘'),
      mixed:{
        '나이지리아':'북부는 이슬람교, 남부는 크리스트교가 강함. 두 종교 비중이 비슷해 자료마다 1위가 다름.',
        '코트디부아르':'북부는 이슬람교, 남부는 크리스트교가 강함. 두 종교 비중이 비슷해 자료마다 1위가 다름.',
        '레바논':'이슬람교(수니파·시아파)가 크리스트교보다 많은 것으로 추정되지만 크리스트교(마론파 등) 비중도 커서 혼재 국가로 봄.',
        '보스니아 헤르체고비나':'보슈냐크계 이슬람교, 세르비아계 정교회, 크로아티아계 가톨릭이 함께 분포. 민족·종교·국가 형성이 겹친 사례.',
        '중국':'무종교·민간 신앙 비중이 높아 자료마다 1위 종교가 다름. 대승 불교 전파권.',
        '일본':'신토와 불교를 함께 따르는 경우가 많아 통계마다 다름. 대승 불교 전파권.',
        '대한민국':'무종교가 과반. 종교 인구 중에서는 크리스트교가 불교보다 많음(2015 인구 총조사).',
        '타이완':'불교·도교·민간 신앙이 섞여 있어 1위 종교를 단정하지 않음.',
        '베트남':'무종교·민간 신앙 비중이 높음. 불교는 대승 불교 전통.'
      },
      notes:{
        '인도':'힌두교 1위, 이슬람교 2위(2027학년도 9월 7번). 비율은 낮아도 무슬림 총수가 매우 큼.',
        '네팔':'힌두교 1위, 불교 2위. 석가모니 탄생지 룸비니가 있음.',
        '스리랑카':'불교 1위, 힌두교 2위. 신할리즈족·싱할라어·불교와 타밀족·타밀어·힌두교.',
        '방글라데시':'이슬람교 1위, 힌두교 2위.',
        '말레이시아':'이슬람교 1위, 불교 2위.',
        '미얀마':'불교 1위, 크리스트교 2위(2027학년도 9월 7번). 라카인의 로힝야족은 이슬람교.',
        '필리핀':'크리스트교(가톨릭) 1위, 이슬람교 2위. 민다나오섬 모로족은 이슬람교.',
        '우즈베키스탄':'이슬람교 1위, 크리스트교 2위(2027학년도 9월 7번).',
        '인도네시아':'무슬림 수가 세계에서 가장 많은 나라. 발리는 힌두교가 강한 지역 예외, 보로부두르는 불교 유적.',
        '이스라엘':'유대교. 예루살렘에는 유대교·크리스트교·이슬람교의 성지가 겹침.',
        '사우디아라비아':'이슬람교 기원지(메카·메디나).',
        '이란':'이슬람교. 시아파 비중이 높은 대표 국가.',
        '튀르키예':'이슬람교. 이스탄불 술탄 아흐메트 사원, 아나톨리아의 크리스트교 유적도 있음.',
        '에티오피아':'크리스트교 1위(정교회 전통). 북부 아프리카와 달리 이슬람교가 1위가 아님.',
        '이집트':'이슬람교. 콥트 정교회 신자는 소수.',
        '차드':'이슬람교 1위. 남부는 크리스트교 비중이 높음.',
        '수단':'이슬람교. 2011년 독립한 남수단은 크리스트교가 1위.',
        '남수단':'크리스트교. 2011년 수단에서 독립.',
        '탄자니아':'크리스트교 1위로 추정되지만 해안·잔지바르를 중심으로 이슬람교 비중도 큼.',
        '캄보디아':'불교. 앙코르와트는 힌두교 사원으로 건립된 뒤 불교 사원으로 쓰임.',
        '싱가포르':'불교가 1위지만 과반은 아님. 다민족·다종교 도시 국가.',
        '몽골':'불교(티베트 불교 전통).',
        '바티칸':'가톨릭의 중심지.',
        '가이아나':'크리스트교 1위, 인도계 이주민의 힌두교가 2위.',
        '수리남':'크리스트교 1위. 인도계·자와계 이주민의 힌두교·이슬람교도 많음.',
        '체코':noReligionNote,'에스토니아':noReligionNote,'네덜란드':noReligionNote,'뉴질랜드':noReligionNote,'우루과이':noReligionNote
      }
    },
    {
      id:'christianity',title:'크리스트교 교파',lecture:'1권 P04',
      paintPhrase:'{x} 전통이 강한 나라를',otherLabel:'크리스트교가 1위 종교가 아닌 나라',
      assignQuestion:'색칠된 나라에서 강한 크리스트교 교파는?',
      basis:'크리스트교가 1위 종교인 나라의 대표 교파 전통. 가톨릭은 남부 유럽·라틴 아메리카·필리핀, 개신교는 북부 유럽·앵글로아메리카·오세아니아, 정교회는 동부·남동부 유럽·러시아가 기준점입니다. 교파가 섞인 나라는 채점하지 않습니다.',
      options:[
        {id:'catholic',label:'가톨릭',color:'#2f62b0'},
        {id:'protestant',label:'개신교',color:'#8a3fa8'},
        {id:'orthodox',label:'정교회',color:'#c26a17'}
      ],
      values:assign(assign(assign({},
        'catholic','아일랜드,포르투갈,에스파냐,안도라,프랑스,벨기에,룩셈부르크,오스트리아,리히텐슈타인,이탈리아,바티칸,산마리노,몰타,리투아니아,폴란드,체코,슬로바키아,헝가리,슬로베니아,크로아티아,필리핀,동티모르,멕시코,쿠바,아이티,도미니카 공화국,엘살바도르,코스타리카,파나마,콜롬비아,베네수엘라,에콰도르,페루,볼리비아,브라질,파라과이,우루과이,칠레,아르헨티나'),
        'protestant','영국,아이슬란드,덴마크,노르웨이,스웨덴,핀란드,미국,자메이카,가이아나,케냐,잠비아,짐바브웨,나미비아,보츠와나,남아프리카 공화국,가나,라이베리아,오스트레일리아,뉴질랜드,파푸아뉴기니'),
        'orthodox','그리스,키프로스,세르비아,루마니아,불가리아,우크라이나,러시아,에티오피아'),
      mixed:assign({
        '독일':'북부는 개신교, 남부는 가톨릭이 강하고 비중이 비슷함. 종교 개혁의 발상지.',
        '네덜란드':'가톨릭과 개신교가 섞여 있고 무종교 비중이 높음.',
        '스위스':'가톨릭과 개신교(칼뱅파)가 섞여 있음.',
        '라트비아':'루터교(개신교)·가톨릭·정교회가 섞여 있음.',
        '에스토니아':'루터교(개신교)와 정교회(러시아계)가 섞여 있고 무종교 비중이 높음.',
        '캐나다':'단일 교파로는 가톨릭(퀘벡 등)이 가장 크지만 개신교 전통도 강함.',
        '보스니아 헤르체고비나':'세르비아계 정교회, 크로아티아계 가톨릭, 보슈냐크계 이슬람교가 함께 분포.',
        '대한민국':'크리스트교가 1위 종교인 나라로 묻지 않음(무종교 과반). 크리스트교 안에서는 개신교가 가톨릭보다 많음.',
        '수리남':'가톨릭과 개신교가 섞여 있고 힌두교·이슬람교 신자도 많음.'
      },'사하라 이남에서 가톨릭과 개신교가 함께 큰 비중을 차지함.','우간다,탄자니아,콩고 민주 공화국,앙골라,모잠비크,마다가스카르,카메룬,남수단,베냉'),
      notes:{
        '영국':'성공회 등 개신교 전통. 북아일랜드는 개신교·가톨릭 전통과 국가 정체성이 겹친 갈등 지역.',
        '아일랜드':'가톨릭 전통. 북아일랜드의 아일랜드계 민족주의와 연결.',
        '미국':'앵글로아메리카의 개신교 기준점. 가톨릭 신자도 많음.',
        '오스트레일리아':'오세아니아의 개신교 기준점. 단일 교파로는 가톨릭 신자도 많음.',
        '브라질':'가톨릭 신자 수가 세계에서 가장 많은 나라. 개신교 비중이 빠르게 늘고 있음.',
        '필리핀':'동남아시아의 가톨릭 기준점.',
        '동티모르':'가톨릭 신자 비율이 매우 높은 동남아시아 국가.',
        '바티칸':'가톨릭의 중심지(로마 교황청).',
        '에티오피아':'에티오피아 정교회 전통 — 사하라 이남 아프리카의 정교회 사례.',
        '러시아':'정교회 전통의 대표 국가. 이콘·돔형 성당 경관.',
        '그리스':'정교회 전통의 대표 국가.',
        '세르비아':'정교회 전통. 이웃 크로아티아는 가톨릭.',
        '크로아티아':'가톨릭 전통. 이웃 세르비아는 정교회.',
        '폴란드':'동유럽이지만 가톨릭 전통이 강함.',
        '체코':'무종교 비중이 높으며, 크리스트교 중에서는 가톨릭이 많음.'
      }
    },
    {
      id:'islam',title:'이슬람교 종파',lecture:'1권 P04',
      paintPhrase:'{x}가 다수인 나라를',otherLabel:'이슬람교가 1위 종교가 아닌 나라',
      assignQuestion:'색칠된 나라에서 신자가 더 많은 이슬람교 종파는?',
      basis:'이슬람교가 1위 종교인 나라의 다수 종파. 세계 무슬림은 수니파가 다수이고, 이란·이라크·아제르바이잔·바레인은 시아파 비중이 높습니다.',
      options:[
        {id:'sunni',label:'수니파',color:'#25864f'},
        {id:'shia',label:'시아파',color:'#7b4bb3'}
      ],
      values:assign(assign({},
        'sunni','모로코,알제리,튀니지,리비아,이집트,모리타니,말리,니제르,차드,수단,세네갈,기니,시에라리온,소말리아,튀르키예,시리아,요르단,쿠웨이트,사우디아라비아,카타르,아랍 에미리트,카자흐스탄,우즈베키스탄,투르크메니스탄,키르기스스탄,타지키스탄,아프가니스탄,파키스탄,방글라데시,말레이시아,브루나이,인도네시아'),
        'shia','이란,이라크,아제르바이잔,바레인'),
      mixed:{
        '오만':'수니파·시아파가 아닌 이바디파가 다수인 나라.',
        '레바논':'수니파·시아파와 크리스트교가 함께 분포.',
        '나이지리아':'이슬람교와 크리스트교의 비중이 비슷함(북부 이슬람교).',
        '보스니아 헤르체고비나':'이슬람교(보슈냐크계)가 가장 크지만 과반이 아니고 정교회·가톨릭과 섞여 있음.'
      },
      notes:{
        '이란':'시아파 비중이 높은 대표 기준점.',
        '이라크':'시아파가 다수. 지역별 종파·민족(쿠르드족) 구성 차이가 큼.',
        '사우디아라비아':'수니파. 메카·메디나가 있는 이슬람교 기원지.',
        '튀르키예':'수니파 기준점.',
        '인도네시아':'수니파 기준점. 무슬림 수가 세계에서 가장 많음.'
      }
    },
    {
      id:'buddhism',title:'불교 전파권',lecture:'1권 P04',
      paintPhrase:'{x} 전통의 나라를',otherLabel:'불교 전파권의 기준 국가가 아님',
      assignQuestion:'색칠된 나라의 불교 전통은?',
      basis:'불교는 남부 아시아에서 기원했지만 핵심 분포권은 동아시아·동남아시아입니다. 대승 불교는 동아시아, 남방(상좌부) 불교는 스리랑카·동남아시아 대륙부, 티베트 불교는 티베트·몽골·히말라야 일부가 기준점입니다.',
      options:[
        {id:'mahayana',label:'대승 불교',color:'#c26a17'},
        {id:'theravada',label:'남방 불교',color:'#b23b3b'},
        {id:'tibetan',label:'티베트 불교',color:'#7b4bb3'}
      ],
      values:assign(assign(assign({},
        'mahayana','중국,대한민국,일본,타이완,베트남'),
        'theravada','스리랑카,미얀마,타이,라오스,캄보디아'),
        'tibetan','몽골'),
      mixed:{
        '인도':'불교의 기원지(부다가야)이지만 오늘날 인도의 다수 종교는 힌두교.',
        '네팔':'석가모니 탄생지 룸비니가 있지만 다수 종교는 힌두교. 북부 히말라야에는 티베트 불교 전통.',
        '싱가포르':'불교가 1위이지만 다종교 도시 국가로 여러 전통이 섞여 있음.'
      },
      notes:{
        '베트남':'동남아시아에 있지만 중국 영향을 받은 대승 불교 전통.',
        '스리랑카':'해상 교류로 불교가 전파된 남방 불교 기준점.',
        '몽골':'티베트 불교 전통. 나담 축제의 초원 유목 문화.',
        '캄보디아':'남방 불교. 앙코르와트는 힌두교 사원으로 건립됨.'
      }
    },
    {
      id:'bloc',title:'경제 블록',lecture:'2권 P08',
      paintPhrase:'{x} 회원국을',
      assignQuestion:'색칠된 나라가 속한 경제 블록은?',
      basis:'2026년 9월 확인 기준 정회원. 과거 기출 지도·통계는 그 시점의 회원 범위로 읽습니다(예: 2024년 ASEAN은 10개국).',
      options:[
        {id:'eu',label:'EU',color:'#2f62b0'},
        {id:'usmca',label:'USMCA',color:'#b23b3b'},
        {id:'asean',label:'ASEAN',color:'#c98612'},
        {id:'mercosur',label:'MERCOSUR',color:'#25864f'}
      ],
      noneOption:{id:'none',label:'해당 없음'},
      values:assign(assign(assign(assign(assign({},
        'eu','프랑스,독일,이탈리아,벨기에,네덜란드,룩셈부르크,아일랜드,덴마크,스웨덴,핀란드,오스트리아,그리스,에스파냐,포르투갈,몰타,키프로스,폴란드,체코,슬로바키아,헝가리,슬로베니아,크로아티아,루마니아,불가리아,에스토니아,라트비아,리투아니아'),
        'usmca','미국,캐나다,멕시코'),
        'asean','타이,베트남,라오스,캄보디아,미얀마,말레이시아,싱가포르,인도네시아,필리핀,브루나이,동티모르'),
        'mercosur','브라질,아르헨티나,파라과이,우루과이,볼리비아'),
        'none','영국,스위스,노르웨이,아이슬란드,세르비아,튀르키예,우크라이나,칠레,페루,콜롬비아,에콰도르,인도,방글라데시,스리랑카,파푸아뉴기니,오스트레일리아'),
      mixed:{
        '베네수엘라':'MERCOSUR 회원 자격이 정지된 상태 — 활동 중인 정회원과 구분.'
      },
      notes:{
        '프랑스':'유럽 통합 초기 6개국.','독일':'유럽 통합 초기 6개국.','이탈리아':'유럽 통합 초기 6개국.','벨기에':'유럽 통합 초기 6개국.','네덜란드':'유럽 통합 초기 6개국.','룩셈부르크':'유럽 통합 초기 6개국.',
        '크로아티아':'2013년 가입(28번째) — 영국 탈퇴 후 다시 27개국.',
        '영국':'2020년 EU 탈퇴.',
        '스위스':'EU 비회원(탈퇴한 나라가 아님). 솅겐에는 참여.',
        '노르웨이':'EU 비회원. 솅겐에는 참여.',
        '아이슬란드':'EU 비회원. 솅겐에는 참여.',
        '멕시코':'USMCA — 2020년 7월 NAFTA를 대체.',
        '동티모르':'2025년 10월 ASEAN 11번째 회원국 — 2024년 이전 자료에서는 제외.',
        '볼리비아':'2024년 MERCOSUR 정회원으로 합류.',
        '칠레':'MERCOSUR 준회원국 — 정회원과 구분.',
        '페루':'MERCOSUR 준회원국 — 정회원과 구분.',
        '인도':'남부 아시아 — ASEAN 회원 아님.',
        '방글라데시':'남부 아시아 — ASEAN 회원 아님.',
        '스리랑카':'남부 아시아 — ASEAN 회원 아님.'
      }
    },
    {
      id:'apec',title:'APEC 회원',lecture:'2권 P08',
      paintPhrase:'{x}국을',
      assignQuestion:'색칠된 나라는 APEC 회원인가?',
      basis:'APEC 21개 회원 경제체(2026년 9월 확인). 지도에 없는 홍콩도 회원입니다. ASEAN 회원이라고 모두 APEC 회원은 아닙니다.',
      options:[{id:'member',label:'APEC 회원',color:'#c26a17'}],
      noneOption:{id:'none',label:'회원 아님'},
      values:assign(assign({},
        'member','대한민국,일본,중국,타이완,인도네시아,말레이시아,필리핀,싱가포르,타이,브루나이,베트남,오스트레일리아,뉴질랜드,파푸아뉴기니,미국,캐나다,멕시코,페루,칠레,러시아'),
        'none','인도,카타르,미얀마,라오스,캄보디아,동티모르,몽골,방글라데시,콜롬비아,에콰도르,브라질,아르헨티나'),
      mixed:{},
      notes:{
        '카타르':'천연가스 수출이 많은 아시아 국가지만 APEC 회원 아님.',
        '미얀마':'ASEAN 회원이지만 APEC 회원 아님.','라오스':'ASEAN 회원이지만 APEC 회원 아님.','캄보디아':'ASEAN 회원이지만 APEC 회원 아님.',
        '인도네시아':'ASEAN과 APEC에 모두 참여.',
        '타이완':'Chinese Taipei라는 이름의 회원 경제체로 참여.',
        '러시아':'유라시아의 APEC 회원.',
        '페루':'태평양 연안의 APEC 회원. MERCOSUR에는 준회원.',
        '칠레':'태평양 연안의 APEC 회원. MERCOSUR에는 준회원.'
      }
    },
    {
      id:'euro',title:'EU의 유로 사용',lecture:'2권 P08',
      paintPhrase:'EU 회원국 중 {x} 국가를',
      assignQuestion:'색칠된 EU 회원국은 유로를 쓰는가?',
      basis:'EU 27개국 중 유로 지역 21개국(2026년 불가리아 도입). EU 회원·유로 지역·솅겐은 서로 다른 범위입니다.',
      universe:'listed',
      options:[{id:'euro',label:'유로 사용',color:'#2f62b0'}],
      noneOption:{id:'none',label:'유로 미사용'},
      values:assign(assign({},
        'euro','오스트리아,벨기에,크로아티아,키프로스,에스토니아,핀란드,프랑스,독일,그리스,아일랜드,이탈리아,라트비아,리투아니아,룩셈부르크,몰타,네덜란드,포르투갈,슬로바키아,슬로베니아,에스파냐,불가리아'),
        'none','체코,덴마크,헝가리,폴란드,루마니아,스웨덴'),
      mixed:assign({},'EU 비회원이지만 협정에 따라 유로를 사용.','바티칸,산마리노,안도라'),
      notes:{
        '불가리아':'2026년 유로 도입 — 21번째 유로 지역 국가.',
        '크로아티아':'2023년 유로 도입.',
        '덴마크':'EU 회원이지만 유로 미사용. 솅겐에는 참여.',
        '스웨덴':'EU 회원이지만 유로 미사용. 솅겐에는 참여.',
        '아일랜드':'유로 사용, 솅겐에는 미참여.'
      }
    },
    {
      id:'latinLanguage',title:'라틴 아메리카 언어',lecture:'1권 P04',
      paintPhrase:'{x}가 대표 공용어인 나라를',
      assignQuestion:'색칠된 나라의 대표 공용어는?',
      basis:'식민 지배의 언어 유산. 에스파냐어가 다수이고 브라질은 포르투갈어, 기아나 지역은 영어·네덜란드어·프랑스어로 나뉩니다. 원주민 언어도 함께 쓰입니다.',
      universe:'listed',
      view:[-118,-56,-34,32],
      options:[
        {id:'spanish',label:'에스파냐어',color:'#b23b3b'},
        {id:'portuguese',label:'포르투갈어',color:'#25864f'},
        {id:'english',label:'영어',color:'#2f62b0'},
        {id:'french',label:'프랑스어',color:'#7b4bb3'},
        {id:'dutch',label:'네덜란드어',color:'#c26a17'}
      ],
      values:assign(assign(assign(assign(assign({},
        'spanish','멕시코,쿠바,도미니카 공화국,엘살바도르,코스타리카,파나마,콜롬비아,베네수엘라,에콰도르,페루,볼리비아,파라과이,우루과이,칠레,아르헨티나'),
        'portuguese','브라질'),
        'english','가이아나,자메이카'),
        'french','아이티,프랑스'),
        'dutch','수리남'),
      mixed:{},
      displayNames:{'프랑스':'프랑스령 기아나'},
      notes:{
        '브라질':'포르투갈어 — 남아메리카에서 면적이 가장 넓은 나라.',
        '가이아나':'영어(옛 영국령).',
        '수리남':'네덜란드어(옛 네덜란드령).',
        '프랑스':'프랑스의 해외 영토(프랑스령 기아나, 카리브해의 마르티니크 등) — 프랑스어.',
        '아이티':'프랑스어와 아이티 크리올어(옛 프랑스령).',
        '자메이카':'영어(옛 영국령).',
        '페루':'에스파냐어와 함께 케추아어 등 원주민 언어도 공용어.',
        '볼리비아':'에스파냐어와 함께 여러 원주민 언어도 공용어.',
        '파라과이':'에스파냐어와 원주민 언어인 과라니어가 공용어.',
        '멕시코':'에스파냐어. 원주민 언어 사용 인구도 많음.'
      }
    }
  ];
  var byId={};sets.forEach(function(set){byId[set.id]=set});

  function optionsFor(set){return set.options.concat(set.noneOption?[set.noneOption]:[])}
  function option(set,id){return optionsFor(set).find(function(o){return o.id===id})||null}
  function displayName(set,name){return (set.displayNames&&set.displayNames[name])||name}
  // Countries a paint answer is checked against; other drawn countries are "not this category".
  function universe(set,allNames){
    if(set.universe==='listed')return Object.keys(set.values).concat(Object.keys(set.mixed));
    return allNames.slice();
  }
  function entry(set,name){
    if(Object.prototype.hasOwnProperty.call(set.mixed,name))return {status:'mixed',value:null,note:set.mixed[name]};
    if(Object.prototype.hasOwnProperty.call(set.values,name))return {status:'graded',value:set.values[name],note:set.notes[name]||''};
    return {status:'other',value:set.noneOption?set.noneOption.id:null,note:set.notes[name]||''};
  }
  function inRegion(name,regionId){return regionId==='all'||regionOf[name]===regionId}
  // Countries that one-at-a-time questions are drawn from.
  function assignPool(set,regionId){
    return Object.keys(set.values).filter(function(name){return inRegion(name,regionId)});
  }
  function gradePaint(set,target,selected,names,regionId){
    var picked=new Set(selected),result={correct:[],missed:[],wrong:[],excluded:[]};
    universe(set,names).forEach(function(name){
      if(!inRegion(name,regionId))return;
      var e=entry(set,name),isTarget=e.status==='graded'&&e.value===target,chosen=picked.has(name);
      if(e.status==='mixed'){if(chosen)result.excluded.push(name);return}
      if(isTarget&&chosen)result.correct.push(name);
      else if(isTarget)result.missed.push(name);
      else if(chosen)result.wrong.push(name);
    });
    return result;
  }
  return {sets:sets,byId:byId,regions:regions,regionOf:regionOf,optionsFor:optionsFor,option:option,displayName:displayName,universe:universe,entry:entry,inRegion:inRegion,assignPool:assignPool,gradePaint:gradePaint};
});
