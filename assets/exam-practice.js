/* Recall only the relationships selected from exam analysis and the final lectures.
 * Source years stay in the audit/reference tables. Periods appear in a question
 * only when the change over time is itself the learning objective.
 */
(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WGExamPractice=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 var questions=[];
 function add(id,rid,text,options,answer,explain,evidence,extra){
  questions.push(Object.assign({id:id,rid:rid,type:'pick',text:text,options:options.split('|'),answer:[answer],explain:explain,evidence:evidence,kind:'recall'},extra||{}));
 }
 var bloc='2권 P08 101~104쪽 · 2023학년도 6월 10번; 2026학년도 6월 10번',
 pop='1권 P05 148~175쪽 · 2023학년도 6월 12번; 2024학년도 6월 11번; 2025학년도 6월 16번',
 energy='2권 P07 38~55쪽 · 2023학년도 9월 7번; 2024학년도 수능 18번; 2027학년도 6월 8번',
 grain='2권 P06 8~17쪽 · 2024학년도 수능 6번; 2026학년도 수능 12번; 2027학년도 9월 17번',
 farm='2권 P06 22~30쪽 · 2019학년도 6월 6번; 2026학년도 9월 8번; 2027학년도 6월 10번',
 beverage='2권 P06 29~30쪽 · 2020학년도 6월 8번; 2026학년도 6월 19번; 2027학년도 6월 16번';
 add('bloc-pop-max','bloc-pop','EU·USMCA·ASEAN·MERCOSUR 중 총인구가 가장 많은 경제 블록은?','EU|USMCA|ASEAN|MERCOSUR','ASEAN','총인구는 ASEAN이 가장 많다. 회원국 수·GDP와 다른 지표다.',bloc);
 add('bloc-gdp-max','bloc-gdp','EU·USMCA·ASEAN·MERCOSUR 중 GDP 합계가 가장 큰 경제 블록은?','EU|USMCA|ASEAN|MERCOSUR','USMCA','미국이 포함된 USMCA의 GDP 합계가 가장 크다.',bloc);
 add('bloc-trade-max','bloc-trade','EU·USMCA·ASEAN·MERCOSUR 중 상품 무역액(수출+수입)이 가장 큰 경제 블록은?','EU|USMCA|ASEAN|MERCOSUR','EU','총무역액은 EU가 가장 크다. GDP 최대인 USMCA와 구별한다.',bloc);
 add('bloc-members-max','bloc-members','EU·USMCA·ASEAN·MERCOSUR 중 회원국 수가 가장 많은 경제 블록은?','EU|USMCA|ASEAN|MERCOSUR','EU','회원 수 최대는 EU이다. ASEAN의 인구 규모와 구별한다.',bloc);
 add('cont-pop-max','cont-pop','세계의 대륙·문화 지역 중 총인구가 가장 많은 곳은?','아시아|아프리카|유럽|라틴 아메리카','아시아','아시아가 가장 많고 아프리카가 그다음이다.',pop);
 add('cont-pop-second','cont-pop','세계의 대륙·문화 지역 중 아시아 다음으로 총인구가 많은 곳은?','아프리카|유럽|라틴 아메리카|앵글로아메리카','아프리카','전체 인구 규모와 인구 증가 속도를 구별한다.',pop);
 add('cont-density-max','cont-density','러시아를 유럽에 포함한 대륙 구분에서 인구 밀도가 가장 높은 곳은?','아시아|아프리카|유럽|앵글로아메리카','아시아','인구 밀도는 총인구를 면적으로 나눈 값이다. 아시아가 가장 높다.',pop);
 add('cont-nir-max','cont-nir','대륙별 인구 자연 증가율이 가장 높은 곳은?','아프리카|아시아|유럽|앵글로아메리카','아프리카','자연 증가는 출생과 사망의 차이이며 국제 이동을 포함하지 않는다.',pop);
 add('cont-old-max','cont-old','대륙별 노년층 인구 비율이 가장 높은 곳은?','유럽|아시아|아프리카|라틴 아메리카','유럽','유럽은 노년층 비율이 높다. 노년층의 절대 인구수와 구별한다.',pop);
 add('cont-young-max','cont-young','대륙별 유소년층 인구 비율이 가장 높은 곳은?','아프리카|아시아|유럽|앵글로아메리카','아프리카','아프리카는 유소년층 비율과 자연 증가율이 높다.',pop);
 add('cont-urban-pair','cont-urban','앵글로아메리카와 아프리카 중 도시화율이 높은 곳은?','앵글로아메리카|아프리카','앵글로아메리카','도시화율은 도시에 사는 인구의 비율이다. 앵글로·라틴 아메리카 사이의 근소한 1위 비교는 외우지 않는다.', '1권 P05 172쪽 · 2020학년도 6월 14번; 2023학년도 6월 19번');
 add('cont-pop-europe-latin','cont-pop','러시아를 유럽에 포함할 때 유럽과 라틴 아메리카 중 총인구가 많은 곳은?','유럽|라틴 아메리카','유럽','대륙 구분을 유지하면 유럽의 총인구가 더 많다.',pop);
 add('country-pop-max','country-pop','현재 세계에서 총인구가 가장 많은 국가는?','인도|중국|미국|인도네시아','인도','인도가 중국을 넘어섰다. 과거 시점이 지정된 문제는 그 시점의 자료를 읽는다.', '1권 P05 인구 분포 · WDI 검수 자료');
 add('country-pop-second','country-pop','현재 세계에서 인도 다음으로 총인구가 많은 국가는?','중국|미국|인도네시아|나이지리아','중국','총인구는 인도, 중국 순이다. 과거 시점이 지정된 자료와 구별한다.', '1권 P05 인구 분포 · WDI 2023·2025 교차 확인');
 add('country-area-max','country-area','세계에서 국토 면적이 가장 넓은 국가는?','러시아|캐나다|중국|미국','러시아','러시아는 세계 최대 면적 국가이다. 미국·중국 사이의 집계 정의 차이는 별도 순위 암기로 묻지 않는다.', '2권 P10 162쪽 · 2014학년도 9월 18번');
 add('country-gdp-pair','country-gdp','미국과 중국 중 명목 GDP 합계가 더 큰 국가는?','미국|중국','미국','명목 GDP 합계는 미국이 더 크다. 1인당 GDP나 구매력 평가 기준으로 바꾸지 않는다.', '2권 P08 산업·무역 · 명목 GDP 비교');
 function leader(id,rid,subject,answer,options,explain){add(id,rid,'세계에서 '+subject+'이 가장 큰 국가는?',options,answer,explain,energy)}
 leader('coal-world','coal-prod','석탄 생산량','중국','중국|인도|오스트레일리아|인도네시아','생산 최대는 중국이다. 오스트레일리아·인도네시아는 대표 수출국이다.');
 leader('oil-world','oil-prod','석유 생산량','미국','미국|사우디아라비아|러시아|이란','석유 생산량과 수출량·매장량은 서로 다르다.');
 leader('gas-world','gas-prod','천연가스 생산량','미국','미국|러시아|이란|카타르','미국의 생산 총량과 카타르의 천연가스 수출 특성을 구별한다.');
 leader('hydro-world','hydro-elec','수력 발전량','중국','중국|브라질|캐나다|노르웨이','자국 발전에서 수력 비율이 높은 노르웨이가 세계 총발전량 최대인 것은 아니다.');
 leader('wind-world','wind-elec','풍력 발전량','중국','중국|미국|독일|덴마크','덴마크의 높은 풍력 비율과 중국의 큰 발전 총량을 구별한다.');
 leader('solar-world','solar-elec','태양광 발전량','중국','중국|미국|인도|에스파냐','태양광 발전 총량을 묻는다. 설비 용량이나 자국 발전 비중과 구별한다.');
 leader('nuclear-world','nuclear-elec','원자력 발전량','미국','미국|중국|프랑스|러시아','프랑스의 높은 원자력 비율과 미국의 큰 발전 총량을 구별한다.');
 add('gas-top-two','gas-prod','미국과 러시아 중 천연가스 생산량이 더 많은 국가는?','미국|러시아','미국','대표 생산국의 총량 비교이다. 수출량 순위와 같다고 보지 않는다.',energy);
 add('hydro-china-canada','hydro-elec','중국과 캐나다 중 수력 발전량이 더 많은 국가는?','중국|캐나다','중국','수력 발전 총량은 중국이 더 많다.', '2권 P07 54쪽 · 2026학년도 수능 5번');
 add('wind-germany-france','wind-elec','독일과 프랑스 중 풍력 발전량이 더 많은 국가는?','독일|프랑스','독일','독일의 풍력과 프랑스의 원자력 이용을 연결한다.', '2권 P07 54쪽 · 2026학년도 수능 5번');
 add('maize-world','maize-prod','세계 최대 옥수수 생산국은?','미국|중국|브라질|아르헨티나','미국','옥수수는 미국·중국·브라질이 주요 생산국이며 미국이 가장 많다.',grain);
 add('wheat-world','wheat-prod','세계 최대 밀 생산국은?','중국|인도|러시아|미국','중국','밀 생산 최대는 중국이다. 밀 수출 최대와 같은 질문이 아니다.',grain);
 add('wheat-india-france','wheat-prod','인도와 프랑스 중 밀 생산량이 더 많은 국가는?','인도|프랑스','인도','프랑스의 수출 특성과 인도의 큰 생산 총량을 구별한다.', '2권 P06 · 2026학년도 수능 12번');
 add('rice-asia','rice-cont','세계 쌀 생산량에서 가장 큰 비중을 차지하는 대륙은?','아시아|아프리카|유럽|라틴 아메리카','아시아','쌀은 아시아 생산 집중이 매우 크다. 인도·중국의 근소한 1·2위는 암기 문제에서 제외한다.',grain);
 add('coffee-world','coffee-prod','세계 최대 커피 생산국은?','브라질|베트남|에티오피아|인도네시아','브라질','세계 최대는 브라질, 아시아 최대는 베트남, 아프리카 최대는 에티오피아이다.',beverage);
 add('coffee-asia','coffee-prod','아시아 최대 커피 생산국은?','베트남|인도네시아|인도|중국','베트남','범위는 아시아이다. 세계 최대인 브라질과 구별한다.',beverage);
 add('coffee-africa','coffee-prod','아프리카 최대 커피 생산국은?','에티오피아|케냐|코트디부아르|가나','에티오피아','아비시니아 고원·아디스아바바와 연결한다.',beverage);
 add('cocoa-world','cocoa-prod','세계 최대 카카오 생산국은?','코트디부아르|가나|브라질|인도네시아','코트디부아르','기원은 열대 아메리카이지만 대표 생산 중심은 서아프리카이다.',beverage);
 add('tea-world','tea-prod','세계 최대 차 생산국은?','중국|인도|케냐|스리랑카','중국','세계 최대는 중국이다. 아프리카의 케냐와 구별한다.',beverage,{sourceUrls:['https://english.moa.gov.cn/news_522/202605/t20260525_301605.html'],reference:'중국 농업농촌부 2026-05 발표 · 2025년 생산'});
 add('cattle-world','cattle-count','물소를 제외한 소 사육 두수가 세계에서 가장 많은 국가는?','브라질|인도|미국|중국','브라질','소와 물소의 포함 범위를 먼저 구별한다. 사육 두수와 쇠고기 생산량도 다른 지표다.',farm);
 add('pig-world','pig-count','돼지 사육 두수가 세계에서 가장 많은 국가는?','중국|미국|브라질|에스파냐','중국','중국은 돼지 사육 두수가 가장 많다. 돼지고기 수출 순위와 구별한다.',farm);
 add('religion-three','religion-world','크리스트교·이슬람교·불교 중 세계 신자 수가 가장 많은 종교는?','크리스트교|이슬람교|불교','크리스트교','세 보편 종교의 신자 수는 크리스트교 > 이슬람교 > 불교 순이다.', '1권 P04 세계 종교 · 2027학년도 9월 7번');
 add('chicago-change','country-pop','시카고의 인구는 1950년 500만 → 2020년 887만 명으로 늘었지만, 미국 내 대도시권 인구 순위는 2위 → 3위가 되었다. 옳은 해석은?','다른 도시가 더 빠르게 성장했다|시카고의 인구가 줄었다|시카고가 수도가 되었다','다른 도시가 더 빠르게 성장했다','시카고의 인구는 늘었어도 순위는 내려갈 수 있다. 순위 하락과 절대 인구 감소는 다르다.', '2권 P08 98쪽 · 2025학년도 9월 15번',{kind:'change'});
 add('australia-change','bloc-trade','오스트레일리아의 수출·수입 1위 상대국은 1950년 영국에서 2020년 어느 나라로 바뀌었는가?','중국|일본|미국|인도','중국','영국 중심의 역사적 교역에서 동아시아의 공업·소비 시장과 연결되는 교역으로 바뀌었다.', '2권 P08 99쪽 · 2026학년도 9월 11번',{kind:'change'});
 function forRanking(id){return questions.filter(function(q){return q.rid===id})}
 return {questions:questions,forRanking:forRanking};
});
