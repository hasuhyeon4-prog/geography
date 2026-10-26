# 세계지리 후속 변경 검토 · 2026-10-26

현재 로컬 작업 브랜치: `implement/lecture-goals-20261025`

기준 원격 커밋: `acecd887bea8f2f8d694417188fbe821bc1a4de7`

## 진행 상태

- 139묶음·573개 하위 목표: **검증 116 · 구현 457 · 미구현 0**.
- 완료 기준을 모두 검증한 묶음: 13개. 단순 연습 경로 연결을 완료로 세지 않는다.
- 이전 작업 파일의 23개 미구현 목표에 연습 경로를 추가하고, 기존 55개에서 61개를 추가 검증했다.
- 새 OX 645문장, 재구성 비교표 147개, 자료형·계산 주제 104개. 기존 OX ID·학습 기록 보존 검사를 포함한다.

## 주요 변경

인구 피라미드의 세 가지 분모와 두 시점 코호트, 통계 지도 유형, 원그림·사진 판별, 곡물·가축·에너지의 분모, 누적 인구 막대, 산업 비중 복원, 같은 해 GDP×산업 비중을 연결했다.

해역·수도 고도·하천·작물 기원·다년도 생산 및 수출 비교·종교 금기와 사육·국가 내부 다양성의 후속 판단이 실제로 출제되도록 수정했다. 경제 문제의 실패하는 표 구성은 일반 구성으로 전환하며, 지정 비교 복습에서는 요청한 비교를 우선 출제한다.

산업 비중 복원은 세 산업 부가가치 합=100을 명시한 별도 제시 자료이다. 미국·중국 산업 생산액은 2021년 두 지표를 함께 사용한다. 중국의 쌀·양 최다 비교는 2015~2022년으로 한정한다. 인구 집단 누적 막대의 계산값은 원도표 눈금에서 재구성한 근삿값임을 표시했다.

## 아직 남은 조건

| 목표 | 남은 조건 |
|---|---|
| G006-2 | 지도 위쪽의 방향 설명은 있으나 지중해·인도양 등의 그림 영역을 직접 선택하는 문항은 남음. |
| G015-4 | 브라질리아·양곤의 반구별 우기 정오 출제를 확인했다. 지정 사례 바마코의 월 관측소 자료는 아직 없어 목표 전체 검증은 유보. |
| G020-2 | 누적선과 지점 식별은 구현했으나 명세의 뭄바이 관측소 표본은 아직 없음. 양곤·다윈·퍼스 자료로 연습. |
| G044-1 | 싱가포르의 네 종교 건축 사진을 연결했다. 종교별 사진 2장 이상과 정교회 돔·불탑의 추가 예시가 남음. |
| G044-2 | 싱가포르 네 사원은 연결했다. 히랄다·쿠투비아·술탄 아흐메트·아야소피아·앙코르와트·보로부두르·프람바난의 사진·도시 대응은 남음. |
| G061-3 | 제시 자료용 그래프와 stock/flow·분모 해석은 구현. 권역 묶기·언어·네트워크의 세부 목표 검토가 남음. |
| G062-5 | 2025년 WUP F20/F14로 같은 해 수도÷(도시+촌락) 연습을 구현. 수도 범위는 DEGURBA 도시이며, 2018년 강의 원자료의 재현은 아님. 2018년 판본 대응 검토가 남음. |
| G067-2 | 리우·멕시코시티·쿠스코 사진을 연결했다. 런던 타워브리지·시드니 오페라하우스 사진 대응은 남음. |
| G086-1 | 1990·2020년 소비량 문항 연결. 1985~1995년×2015~2024년의 가용 110쌍에서 석탄 변화 방향은 일치. 2025년이 비어 있어 ±5년 전체 검증은 유보. |
| G097-4 | 미국의 산업 비중은 2021년까지만 있어 세 나라의 같은 해 GDP×비중을 별도 자료형으로 연결했다. 기존 국가 경제 주제의 미국·중국 amount 출제와는 다른 경로이다. |
| G127-2 | 세 산업 부가가치 합=100을 명시한 자료형 화면에서 복원·광업 포함을 연습한다. GDP 기준 원비율에 100−2차−3차를 적용하지 않는다. 기존 국가 경제 주제와는 별도 자료형이다. |
| G133-1 | 최한월+연교차 복원과 치타·딕슨·싱가포르 기후 식별 구현. 명세의 지도 대응과 몽골·기니만 표본은 아직 없음. |

이 외에도 `구현` 상태의 복합 목표는 모든 절·사례가 완료 기준을 충족하는지 개별 검토가 남았다. 전체 완료를 뜻하지 않는다.

## 검증

전체 검사 267개 중 261개 통과·3개 실패·3개 원문 필요 생략을 확인했다. 실패 3건을 보완한 뒤 원자료 기반 검사 2개와 자료형·목표 검사 41개, 합계 43개를 재실행해 모두 통과했다. 마지막 보완 후 전체 267개를 다시 실행한 것은 아니다. 상세 결과는 `audit/lecture-goals/validation-20261026.json`에 기록했다. 실제 브라우저 화면 검수는 미리보기 접근이 브라우저 보안 정책으로 차단되어 미완료다. 문항 생성, 정오 도달, 수치 재계산, 원자료 해시, 오프라인 재생성, DOM 제어와 SVG 검사를 수행한다.

## 원격 반영 범위와 차단

반영 대상은 공개 저장소 `hasuhyeon4-prog/geography`의 기존 `implement/lecture-goals-20261025` 브랜치이다. main 병합과 배포는 대상에 포함되지 않는다. 강의 원본 DOCX·강의 전체 본문은 업로드 대상에 포함되지 않는다.

자동 승인 검토는 이번 대화에 목적지·공개 업로드 범위를 명시한 사용자 승인이 없다는 이유로 원격 반영을 차단했다. 아래 변경 파일을 로컬 커밋으로 준비하며, 원격 브랜치 갱신은 별도 승인 대기다.

## 변경 파일

총 93개 파일. 강의 원문 DOCX·강의 전체 본문은 제외한다.

- `assets/classification-sets.js`
- `assets/entity-kb.js`
- `assets/exam-engine.js`
- `assets/exam-themes.js`
- `assets/goal-figures/asian-exports.webp`
- `assets/goal-figures/babylon.webp`
- `assets/goal-figures/bloc-trade.webp`
- `assets/goal-figures/buddhist-temple.webp`
- `assets/goal-figures/cheonhado.webp`
- `assets/goal-figures/china-grains.webp`
- `assets/goal-figures/church.webp`
- `assets/goal-figures/cohort.webp`
- `assets/goal-figures/coral.webp`
- `assets/goal-figures/cusco.webp`
- `assets/goal-figures/daeming.webp`
- `assets/goal-figures/ethnic-stacks.webp`
- `assets/goal-figures/eu-trade-arrows.webp`
- `assets/goal-figures/gassho.webp`
- `assets/goal-figures/ger.webp`
- `assets/goal-figures/hemispheres.webp`
- `assets/goal-figures/hereford.webp`
- `assets/goal-figures/hindu-temple.webp`
- `assets/goal-figures/ice-and-ozone-maps.webp`
- `assets/goal-figures/idrisi.webp`
- `assets/goal-figures/kangnido.webp`
- `assets/goal-figures/kunyu.webp`
- `assets/goal-figures/lagoon.webp`
- `assets/goal-figures/mangrove.webp`
- `assets/goal-figures/manhattan.webp`
- `assets/goal-figures/mercator.webp`
- `assets/goal-figures/mexico-city.webp`
- `assets/goal-figures/mosque.webp`
- `assets/goal-figures/night-lights.webp`
- `assets/goal-figures/north-america-trade.webp`
- `assets/goal-figures/ozone-area.webp`
- `assets/goal-figures/paris-roads.webp`
- `assets/goal-figures/pivot-irrigation.webp`
- `assets/goal-figures/portolan.webp`
- `assets/goal-figures/ptolemy.webp`
- `assets/goal-figures/qanat.webp`
- `assets/goal-figures/rio.webp`
- `assets/goal-figures/sea-ice-anomaly.webp`
- `assets/goal-figures/sea-stack.webp`
- `assets/goal-figures/stilt.webp`
- `assets/goal-figures/to-map.webp`
- `assets/goal-figures/trade-bubble.webp`
- `assets/goal-figures/trade-triangle.webp`
- `assets/lecture-goal-facts.js`
- `assets/materials-charts.js`
- `assets/materials-data.js`
- `assets/materials-engine.js`
- `assets/materials-remaining-data.js`
- `assets/materials-remaining.js`
- `assets/rankings.js`
- `audit/lecture-goals/progress.json`
- `audit/lecture-goals/runtime-evidence.json`
- `audit/lecture-goals/validation-20261026.json`
- `data/ethnic-stacks-given.json`
- `data/goal-country-facts.json`
- `data/goal-figure-panels.json`
- `data/goal-verification.json`
- `data/lecture-gap-goals.json`
- `data/lecture-goal-ox.tsv`
- `data/population-pyramids.json`
- `data/regional-radar-source-url.txt`
- `data/regional-radar-source.json`
- `data/remaining-demographic-balances.json`
- `data/remaining-demographic-manifest.json`
- `data/remaining-demographic-sources.zip`
- `data/remaining-population-source-manifest.json`
- `data/remaining-population-sources.zip`
- `data/renewable-capacity-comparison.json`
- `docs/LECTURE-GAP-IMPLEMENTATION.md`
- `docs/LECTURE-GAP-REVIEW-20261026.md`
- `materials.html`
- `scripts/audit-goal-runtime.cjs`
- `scripts/audit-lecture-goals.cjs`
- `scripts/build-capacity-comparison.py`
- `scripts/build-entity-kb.cjs`
- `scripts/build-ethnic-stacks.py`
- `scripts/build-lecture-goal-facts.cjs`
- `scripts/build-materials-data.cjs`
- `scripts/build-population-pyramids.py`
- `scripts/build-rankings.py`
- `scripts/build-remaining-data.cjs`
- `scripts/build-remaining-demography.py`
- `scripts/extract-goal-figures.py`
- `tests/exam-engine.test.cjs`
- `tests/exam-stability.test.cjs`
- `tests/lecture-goal-completion.test.cjs`
- `tests/lecture-goal-integration.test.cjs`
- `tests/lecture-goal-progress.test.cjs`
- `tests/materials-remaining.test.cjs`
