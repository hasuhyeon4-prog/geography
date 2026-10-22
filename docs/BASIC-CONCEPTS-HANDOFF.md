# R9 고지도·GIS·지역화·환경 인계

`data/concepts/oldmaps.json`에는 요청된 고지도와 헤리퍼드·포르톨라노·메르카토르까지 포함한다. 제작국·세계관·방위·제작 선후를 구별하며, 원문 최소 암기 범위에 없는 세부 연도를 늘리지 않았다. T-O와 헤리퍼드를 배타적인 서로 다른 유형으로 만들지 않는다.

`geographic-information.json`은 공간·속성·관계 정보, GPS·GIS·원격 탐사, 지도 표현, 중첩 조건과 경계값이다. `localization.json`은 지역 브랜드·장소 마케팅·지리적 표시 등 강의 사례다.

`environment.json`에는 환경 문제와 8개 협약·의정서의 원표가 있다. `environment-supplement.json`은 요청된 생물 다양성 협약을 사무국 자료로 보완했다. 나이로비 채택과 리우데자네이루 서명 개방은 서로 다른 사건이다. `geographic-information-supplement.json`은 Esri 공식 문서로 버퍼 분석을 보완했다. 두 보완 파일은 기출의 새 회상 허용 목록으로 자동 편입하지 않는다.

`assets/fact-statements.js`는 기존 OX의 ID·정답·원문·연도 등 모든 필드를 그대로 유지하고 고지도·GIS·환경의 명시적 OX 16개를 추가한다. 원문 설명인 `sourceReading`을 전부 참인 OX로 자동 변환하지 않는다.

고지도의 원문 그림은 `data/given-source-figures.json`에 일부 포함되어 있다. 지도별 퍼블릭 도메인 이미지 전체를 새로 수집한 상태는 아니다.
