(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.WGStudyContent=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // Conceptual extents are explicitly approximate, not administrative borders
  // or an automatic-grading ground truth. See sources below.
  var sources={
    prairie:'https://www.nps.gov/tapr/learn/nature/a-complex-prairie-ecosystem.htm',
    southAsia:'https://open.lib.umn.edu/worldgeography/part/chapter-9-south-asia/',
    hongKong:'https://www.hko.gov.hk/en/cis/climahk.htm',
    uluru:'https://uluru.gov.au/discover/nature/',
    kakadu:'https://kakadu.gov.au/discover/nature/'
  };
  var updates={
    '프레리':{
      memo:'로키산맥 동쪽, 캐나다 남부에서 미국 중앙부까지 이어지는 온대 초원 지대. 서쪽은 상대적으로 건조한 짧은 풀, 동쪽은 더 습윤한 긴 풀의 초원이 나타난다. 넓고 평탄한 땅에서 밀·옥수수 등의 기업적 곡물 농업이 발달했다. 대평원은 지형을, 프레리는 초원 식생을 가리키므로 둘의 범위가 완전히 같지는 않다.',
      extentNote:'음영은 북아메리카 중부 초원의 개략적인 분포. 현재 남아 있는 자연 초원이나 곡물 재배지의 정확한 경계는 아니다.',
      geometry:{type:'poly',pts:[[-114,51],[-112,53],[-108,54],[-103,53],[-99,50],[-96,49],[-95,46],[-92,44],[-89,43],[-85,41],[-86,39],[-90,37],[-94,36],[-95,33],[-97,29],[-100,29],[-103,32],[-104,37],[-105,41],[-107,45],[-111,49]],anchor:[-100,44],kind:'ecoregion',approximate:true,source:'NPS historical prairie distribution; schematic study outline'},
      compareNames:['대평원','팜파스'],sourceKeys:['prairie']
    },
    '인도 아대륙':{
      memo:'히말라야 이남에서 인도양으로 크게 돌출한 육지. 서쪽은 아라비아해, 동쪽은 벵골만이다. 인도·파키스탄·방글라데시를 중심으로 네팔·부탄까지 함께 파악한다. 인도 한 나라나 남쪽의 인도반도만 뜻하는 것이 아니다. 힌두교와 불교가 발생한 지역과 연결된다.',
      extentNote:'음영은 히말라야 이남 대륙부의 학습용 개략 범위이며 국경이 아니다. 넓은 용례에서는 스리랑카·몰디브도 포함한다.',
      geometry:{type:'poly',pts:[[66,25],[67,29],[69,32],[72,35],[75,35],[79,32],[83,30],[87,28],[91,28],[95,29],[96,27],[94,24],[92,22],[90,22],[88,21],[86,20],[83,17],[81,14],[80,10],[77.5,8],[76,9],[74,15],[72,19],[69,21],[68,24]],anchor:[79,23],kind:'ecoregion',approximate:true,source:'University of Minnesota South Asia physical boundaries; schematic mainland study outline'},
      compareNames:['히말라야산맥','데칸고원'],sourceKeys:['southAsia'],aliases:['인도아대륙']
    },
    '필바라':{memo:'오스트레일리아 북서부의 철광석 산지. 퍼스는 이보다 훨씬 남쪽인 남서부의 해안 도시다. 필바라의 철광석 산지와 퍼스의 도시 위치를 같은 곳으로 기억하지 않는다.',compareNames:['퍼스']},
    '카카두 국립공원':{memo:'오스트레일리아 북부, 다윈 동쪽의 국립공원. 사바나 숲·습지·범람원이 발달한다. 남쪽 내륙의 울루루-카타추타 국립공원은 건조한 사막 환경이므로 위치와 경관이 다르다.',compareNames:['울루루-카타추타 국립공원','다윈'],sourceKeys:['kakadu','uluru']},
    '울루루-카타추타 국립공원':{memo:'오스트레일리아 중앙부의 건조한 내륙에 있는 국립공원. 울루루의 거대한 바위와 카타추타의 암석 경관이 대표적이다. 북부 카카두의 습지·사바나 경관과 다르다. 지도 점은 공원 전체 경계가 아니라 울루루 바위의 위치다.',aliases:['울루루','카타추타','에어즈록'],compareNames:['카카두 국립공원'],sourceKeys:['uluru','kakadu']},
    '퍼스':{memo:'오스트레일리아 남서부 인도양 연안의 도시. 지중해성 기후로 남반구 여름인 12~2월은 건조하고 겨울인 6~8월에 비가 많다. 같은 기후의 북반구 마르세유와는 우기·건기가 나타나는 달이 반대다.',compareNames:['필바라','마르세유']},
    '홍콩':{memo:'중국 남부 해안, 북회귀선 부근의 특별행정구. 북반구 여름에 덥고 비가 집중된다. 카슈가르는 대륙 깊숙한 건조 지역이므로 강수량이 훨씬 적다. 오클랜드는 남반구여서 가장 따뜻한 시기가 홍콩과 반대이며, 해양의 영향으로 연중 기온 변화가 완만하다.',compareNames:['카슈가르','오클랜드'],sourceKeys:['hongKong']},
    '카슈가르':{memo:'중국 신장 서부, 타림 분지 서쪽의 내륙 도시. 카스라고도 한다. 바다에서 멀고 산지로 둘러싸여 건조하다. 여름 강수가 많은 중국 남부 해안의 홍콩과 위치·강수량을 구분한다.',compareNames:['홍콩','타림 분지']},
    '오클랜드':{memo:'뉴질랜드 북섬 북부의 도시. 웰링턴보다 북쪽, 즉 남반구에서 더 저위도에 있다. 바다의 영향으로 연중 온화하고 강수가 있으며, 홍콩과는 여름·겨울에 해당하는 달이 반대다.',compareNames:['웰링턴','홍콩']},
    '브리즈번':{memo:'오스트레일리아 동부 연안, 시드니보다 북쪽의 도시. 온난 습윤 기후로 연중 강수가 있고 여름에 비가 더 많다. 남서부 퍼스는 여름에 건조하고 겨울에 비가 많아 강수의 계절 분포가 다르다.',compareNames:['퍼스','시드니']},
    '크라이스트처치':{memo:'뉴질랜드 남섬 동부 연안의 도시. 남반구이므로 1월 무렵이 여름, 7월 무렵이 겨울이다. 서안 해양성 기후에서 말하는 대륙 서안의 일반적 분포와 별개로, 이 도시는 섬의 동쪽 해안에 있다.',compareNames:['오클랜드']},
    '위니펙':{memo:'캐나다 중남부 내륙의 도시. 태평양 연안 밴쿠버보다 바다의 영향을 적게 받아 겨울이 훨씬 춥고 기온 연교차가 크다. 내륙성과 해양성이 기온 차이를 만드는 사례다.',compareNames:['밴쿠버']},
    '덴버':{memo:'미국 서부 내륙, 로키산맥 동쪽의 고지대 도시. 산맥의 비그늘과 내륙 위치로 강수량이 적은 스텝 기후를 나타낸다. 로키산맥의 동쪽인지 서쪽인지부터 구분한다.',compareNames:['로키산맥']},
    '에드먼턴':{memo:'캐나다 서부 앨버타주의 내륙 도시. 노먼웰스보다 남쪽에 있다. 두 지점의 동토 자료에서는 더 북쪽인 노먼웰스의 낮은 기온과 영구 동토 발달을 함께 판단한다. 동결·융해 깊이 수치는 제시된 자료를 확인한다.',compareNames:['노먼웰스']},
    '과달라하라':{memo:'멕시코 중서부 내륙, 멕시코시티보다 북서쪽에 있는 도시. 여기서 도시 규모는 인구 규모를 뜻한다. 강의의 2015년 자료에서 멕시코시티의 인구는 과달라하라의 2배 이상이다. 수도에 인구·기능이 집중된 종주 도시화 사례로 연결한다. 도시 순위와 인구 비율은 자료 연도·도시 경계에 따라 달라지므로 이 수치를 현재의 고정 순위로 외우지 않는다.',compareNames:['멕시코시티']},
    '코르도바':{memo:'아르헨티나 중부 내륙의 도시. 여기서 도시 규모는 인구 규모를 뜻한다. 강의의 2015년 자료에서 제2도시로 제시된 코르도바보다 부에노스아이레스의 인구가 훨씬 많다. 1위·2위 도시의 큰 인구 격차와 수도의 기능 집중을 함께 보아 종주 도시화를 판단한다. 제2도시 순위는 자료 연도·도시 경계에 따라 달라질 수 있다.',compareNames:['부에노스아이레스']},
    '로차':{memo:'우루과이 남동부의 내륙 도시. 온난 습윤 기후로 연중 강수가 있으며, 남반구이므로 1월 무렵이 여름이다. 북반구 도시와 기후 그래프를 비교할 때 가장 더운 달부터 구분한다.'},
    '우수아이아':{memo:'남아메리카 남단 티에라델푸에고섬 남부의 도시. 남위 약 55°로 남극권 밖에 있어 백야·극야는 나타나지 않는다. 12월 무렵에는 낮이 길고 6월 무렵에는 짧다. 북반구 도시와 낮 길이의 계절 변화가 반대다.'},
    '이키토스':{memo:'페루 북동부 아마존 저지대의 도시. 적도 부근의 고산 도시 키토와 위도는 비슷하지만 해발 고도가 훨씬 낮아 연중 기온이 높다. 두 도시의 기온 차이는 고도 차이로 판단한다.',compareNames:['키토']},
    '바마코':{memo:'말리 남서부, 나이저강 유역의 수도. 북반구 사바나 기후로 적도 수렴대가 북상하는 여름에 우기, 겨울에 건기가 나타난다.'},
    '푸저우':{memo:'중국 남동부 푸젠성의 도시로 타이완 해협 서쪽에 있다. 온난 습윤 기후를 나타내며 연중 강수가 있고 여름철에 덥다. 더 북쪽 중국 동북부 도시들보다 겨울이 온화하다.',compareNames:['선양','창춘']},
    '쿤밍':{memo:'중국 남서부 윈난성의 고지대 도시. 저위도에 있지만 고도가 높아 같은 위도의 저지대보다 서늘하다. 여름 우기·겨울 건기를 보이며 위도만으로 고온을 단정하지 않는다.'},
    '창춘':{memo:'중국 동북부, 선양보다 북쪽의 내륙 도시. 냉대 겨울 건조 기후로 겨울은 춥고 건조하며 여름에 비가 집중된다. 선양보다 높은 위도와 내륙 위치를 함께 확인한다.',compareNames:['선양']},
    '딕슨':{memo:'시베리아 북극해 연안, 북위 약 73°의 도시. 툰드라 기후로 여름이 짧고 서늘하며 나무가 자라기 어렵다. 북극권 안에 있어 여름에는 백야, 겨울에는 극야가 나타난다.'},
    '마르세유':{memo:'프랑스 남부 지중해 연안의 항구 도시. 지중해성 기후로 북반구 여름인 6~8월에 건조하고 겨울에 강수가 많다. 같은 기후의 남반구 퍼스와는 건조한 달이 반대다.',compareNames:['퍼스']},
    '로바니에미':{memo:'핀란드 북부, 북극권 경계 부근의 도시. 북반구 여름에는 낮이 매우 길고 겨울에는 매우 짧다. 백야·극야 여부는 북극권 안팎의 정확한 위도와 제시된 날짜를 확인한다.'},
    '더블린':{memo:'아일랜드섬 동부 연안의 수도. 북대서양과 편서풍의 영향을 받는 서안 해양성 기후로, 겨울이 비교적 온화하고 기온 연교차가 작으며 연중 강수가 있다.'},
    '아비장':{memo:'코트디부아르 남부 기니만 연안, 북위 약 5°의 도시. 저위도여서 연중 덥고 기온 연교차가 작다. 북쪽 내륙의 바마코보다 적도와 바다에 가까워 비가 많고 건기가 덜 뚜렷하다.',compareNames:['바마코']},
    '다르에스살람':{memo:'탄자니아 동부 인도양 연안, 남위 약 7°의 도시. 연중 덥고 적도 수렴대의 이동에 따라 우기와 건기가 나타난다. 적도에 가까워 우기가 두 차례 나타날 수 있으므로 월별 강수 자료를 확인한다.'},
    '제네바':{memo:'스위스 서남부, 프랑스 국경 가까운 레만호 연안 도시. 스톡홀름은 북유럽 스웨덴의 수도다. 스위스·스웨덴의 이름을 혼동하지 말고 중부 유럽·북유럽의 위치를 구분한다.',compareNames:['스톡홀름']},
    '베른':{memo:'스위스 서부 내륙의 연방 수도. 제네바는 남서부 레만호 연안, 바젤은 북부 라인강 유역의 국경 도시다. 세 도시의 위치와 기능을 구분한다.',compareNames:['제네바','바젤']},
    '바그다드':{memo:'이라크 중부 티그리스강 유역의 수도. 테헤란은 동쪽 이란 북부, 엘부르즈산맥 남쪽의 수도다. 이라크·이란과 두 수도의 위치를 구분한다.',compareNames:['테헤란']},
    '마우이섬':{memo:'하와이 제도의 화산섬. 북동 무역풍을 맞는 동쪽 하나는 지형성 강수로 비가 많고, 산지 서쪽 라하이나는 비그늘에 있어 상대적으로 건조하다. 같은 섬에서도 산지를 사이에 둔 풍상·풍하에 따라 강수량이 다르다.'},
    '플리트비체 국립공원':{memo:'크로아티아 내륙의 호수·폭포 지대. 물속 탄산칼슘이 침전해 석회화 장벽을 만들고 호수·폭포가 이어진다. 슈플랴라 동굴의 빈 공간은 석회암이 녹는 용식과 연결하므로, 침전으로 쌓인 부분과 용식으로 파인 부분을 구분한다.'},
    '보로부두르':{memo:'인도네시아 자와섬 중부, 욕야카르타 북서쪽의 불교 유적. 동쪽의 프람바난은 힌두교 유적이다. 현재 인도네시아의 다수 종교는 이슬람교이므로 국가의 현재 종교와 과거 유적의 종교를 구분한다.',compareNames:['프람바난']},
    '프람바난':{memo:'인도네시아 자와섬 중부, 욕야카르타 동쪽의 힌두교 유적. 보로부두르는 욕야카르타 북서쪽에 있는 불교 유적이므로 위치와 종교가 다르다.',compareNames:['보로부두르']},
    '추키카마타':{memo:'칠레 북부 아타카마 지역의 구리 광산. 칠레의 대표 광물 자원인 구리와 연결한다. 남아프리카 공화국의 석탄 산지 사례와는 국가·광물 종류를 각각 구분한다.'},
    '시안':{memo:'중국 내륙 산시성의 도시. 베이징보다 남서쪽, 상하이보다 서쪽에 있다. 겨울은 춥고 건조하며 강수는 여름에 집중된다. 동부 해안의 항구 도시로 잘못 기억하지 않는다.',compareNames:['베이징','상하이']},
    '그린란드':{memo:'북아메리카 북동쪽의 큰 섬. 내륙 대부분은 빙상으로 덮여 있지만 남서부 연안의 누크 주변에는 얼음에 덮이지 않은 거주 지역이 있다. 내륙 빙설 경관과 연안 툰드라 경관을 구분한다.',compareNames:['누크']},
    '캅카스산맥':{memo:'흑해와 카스피해 사이를 대체로 동서 방향으로 잇는 높은 산지. 우랄산맥은 이보다 북동쪽에서 남북 방향으로 길게 뻗는다. 두 바다 사이의 산맥인지, 유럽·아시아 경계의 남북 산맥인지 구분한다.',compareNames:['우랄산맥']},
    '시베리아':{memo:'우랄산맥 동쪽의 북부 아시아에 펼쳐진 넓은 지역. 북극해 연안에는 툰드라, 그 남쪽의 넓은 지역에는 냉대림이 나타난다. 내륙은 겨울 추위와 큰 기온 연교차가 두드러진다. 지역 전체를 한 가지 기후로 묶지 말고 위도와 해안·내륙 위치를 확인한다.',compareNames:['딕슨','이르쿠츠크','블라디보스토크']},
    '발트 순상지':{memo:'북유럽 핀란드·스웨덴 일대의 오래된 결정질 암석 지대. 순상지는 선캄브리아 시대의 기반암이 드러난 안정 지괴이며, 고생대의 습곡 운동으로 형성된 스칸디나비아산맥·우랄산맥 같은 고기 습곡 산지와 구분한다.',compareNames:['스칸디나비아산맥','우랄산맥']}
  };
  function apply(items){
    var names=new Map(items.map(function(it){return [it.name,it]}));
    Object.keys(updates).forEach(function(name){
      var it=names.get(name),edit=updates[name];if(!it)throw new Error('Missing study item: '+name);
      ['memo','geometry','extentNote'].forEach(function(key){if(edit[key])it[key]=edit[key]});
      it.aliases=Array.from(new Set((it.aliases||[]).concat(edit.aliases||[])));
      it.compareIds=(edit.compareNames||[]).map(function(other){var target=names.get(other);if(!target)throw new Error('Missing comparison: '+name+' → '+other);return target.id});
      it.references=(it.references||[]).concat((edit.sourceKeys||[]).map(function(key){return {title:'설명·범위 근거',url:sources[key]}}));
      if(name==='마우이섬')it.notes=(it.notes||[]).filter(function(note){return !note.includes('강수 차이를 비교')});
    });
    // Other existing comparisons already state their difference. Expose the
    // named targets too, using whole Korean name tokens rather than substrings
    // such as 인도 within 인도네시아 or 인도양.
    var aliases={'울루루':'울루루-카타추타 국립공원','리우':'리우데자네이루','티베트고원':'시짱(티베트)고원'};
    items.forEach(function(it){
      if(it.compareIds||!/(비교|구별)/.test(it.memo))return;
      var sentences=it.memo.split(/[.!?]/).filter(function(s){return /(비교|구별)/.test(s)}).join(' '),ids=[];
      names.forEach(function(target,name){
        if(target.id===it.id||name.length<2)return;
        var at=sentences.indexOf(name);if(at<0)return;
        var before=sentences.slice(0,at).slice(-1),after=sentences.slice(at+name.length);
        if(before&&/[가-힣A-Za-z]/.test(before))return;
        if(after&&!/^(?:[\s·,;:]|[와과은는이가을를의]|보다|$)/.test(after))return;
        ids.push(target.id);
      });
      Object.keys(aliases).forEach(function(name){if(sentences.includes(name)&&names.has(aliases[name]))ids.push(names.get(aliases[name]).id)});
      it.compareIds=Array.from(new Set(ids)).filter(function(id){return id!==it.id});
    });
  }
  return {version:'2026-10-03',sources:sources,updates:updates,apply:apply};
});
