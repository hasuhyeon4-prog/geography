# 기출형 연습 틀 (1차 식별 + 후속 판단)

작성: 2026-10-19. 이 문서는 `exam.html`의 구조, 데이터 계약, 견고성 규칙, 그리고 **다른 세션이 채울 보강 과제**를 정리한다.

## 1. 왜 이 구조인가

평가원 자료 문항은 대부분 두 단계로 변별한다.

1. **1차 식별**: 이름을 가린 (가)~(라)를 자료로 알아낸다. 단서의 종류는 다음과 같다.
   - 한 지표의 극단값
   - 품목·구성의 **조합**(원유+천연가스 → 나이지리아)
   - **공통점으로 묶고 차이점으로 가르기**(연료 수출 비중이 큰 두 나라를 총수출액으로 구분, 2027학년도 9월 13번)
   - 계산 복원(최한월 + 연교차, 2027학년도 6월 9번)
   - 지도 위치
2. **후속 판단**: 식별한 대상끼리의 관계를 <보기> ㄱ~ㄹ로 묻는다. 묻는 내용은 다음과 같다.
   - 자료에 없는 위치·인구·경제·종교·블록 등의 배경지식
   - 자료 해석의 함정(비율과 총량)

순위 회상(`rankings.html`)이나 OX(`facts.html`)만으로는 이 연결이 훈련되지 않는다. 그래서 위치·분류·통계 지식을 대상별 **지식 카드**로 합치고, 실제 자료에서 문항을 생성한다.

## 2. 파일과 데이터 흐름

```
원자료(외부 다운로드) ──scripts/build-exam-data.py──▶ data/country-indicators.json
                                                     data/electricity-mix.json
data/entity-facts.json (손으로 관리, 출처 필수)
audit/religion-2020.json (Pew 2020, 기존 검수)
assets/classification-sets.js, assets/rankings.js, assets/country-boundaries.js
        └──────────── node scripts/build-entity-kb.cjs ──▶ assets/entity-kb.js (생성물, 직접 수정 금지)

assets/exam-themes.js (주제 정의, 손으로 관리)
assets/exam-engine.js (문항 엔진, 순수 함수 — Node 테스트와 브라우저 공용)
exam.html (화면)
tests/exam-engine.test.cjs (계약 검증)
```

- 생성물이 입력과 어긋나면 테스트가 실패한다. `KB_OUT`로 다시 생성한 파일과 커밋된 파일을 비교한다.
- 원자료를 갱신하면 다음 순서로 실행한다.
  1. `python3 -I scripts/build-exam-data.py RAW_DIR`
  2. `node scripts/build-entity-kb.cjs`
  3. `node --test tests/*.cjs`
- `RAW_DIR`의 파일 형식은 `scripts/build-exam-data.py` 첫 주석에 있다(`build-rankings.py`가 읽는 것과 같은 세계은행·OWID 파일).

## 3. 지식 카드 (`assets/entity-kb.js`)

| 필드 | 내용 |
|---|---|
| `entities[이름]` | `type`(country·bloc·continent), `region`·`regionName`(분류 지도 6권역), `ns`·`ew`(최대 면적 폴리곤 기준. 적도·본초 자오선을 걸치면 `null`이며 진술하지 않음), `facts`, `values` |
| `facts[세트]` | 분류 세트의 **채점 항목만** 복사한다. `mixed`·참고 항목은 넣지 않는다. 회원 목록이 완전한 세트(`bloc`·`apec`·`religion`)만 '해당 없음'도 사실로 둔다. `data/entity-facts.json`의 바다·내륙국·OPEC도 여기에 합쳐진다 |
| `factSets[세트].exclusive` | 선택지가 서로 배타적이고 대상 국가를 모두 판정하는 세트. 이 세트에서만 '다른 선택지' 거짓 진술을 만든다. 대표 산지·상위국 같은 세트는 참 진술만 만든다 |
| `indicators[id]` | `label`·`unit`·`year`·`source`, 비교 문구 `more`, 비교 기준 `compare`(`ratio` 배수 또는 `diff` 차이), 감사 결과의 `disabled`·`unstablePairs`, 방향 진술 `sign` |
| `compositions` | 식별 자료용 구성비. 현재 `electricity`(2023, Ember·EI via OWID)와 `religion`(2020, Pew)이 있다 |

국가 지표는 다음 8개이며, 모두 세계은행 WDI 2023년 값이다.
- 총인구, 도시화율, 노년층·유소년층 비율, 자연 증가율, GDP, 1인당 GDP, 상품 수출액
- **면적·인구 밀도는 넣지 않았다.** WDI 표면적이 유엔 인구 연감과 다른 국가가 있다(캐나다 등, `audit/REVIEW-20261017.md`). 아래 보강 과제 3번에서 채운다.
- 국가별 연간 순이동도 변동이 커서 넣지 않았다.

## 4. 주제 정의 (`assets/exam-themes.js`)

| 필드 | 설명 |
|---|---|
| `id`, `title`, `lecture`, `exams` | 식별자, 화면 제목, 강의 위치, 같은 유형의 기출 |
| `status` | `'ready'`만 출제된다. 자료를 채우는 중이면 다른 값을 둔다 |
| `kind` | `indicators`(지표 표), `items`(상위 품목 조합), `composition`(구성비 표) |
| `entityType`, `pool`, `pick` | 대상 종류, 후보, 한 문항의 대상 수 `[최소, 최대]`(3~4) |
| `indicators`, `show` | `indicators` 주제: 후보 지표와 한 문항에 보여 줄 개수 |
| `items`, `year`, `source`, `note` | `items` 주제: 국가별 `[[품목, 비중], …]`과 자료의 연도·출처 |
| `composition`, `signature`, `show` | `composition` 주제: 구성 자료 이름, 식별 규칙(`depth` 1=최대 항목, 2=1·2위 조합, `margin` %p, `exclude`), 표에 보일 항목 |
| `totalFrom`, `amountNoun` | 비율 × 총량 함정 보기를 만들 때 쓰는 지표와 명사(예: `pop`, `'인구'` → "이슬람교 인구가 많다") |
| `reveals` | 자료가 이미 보여 주는 사실 세트. 후속 판단 보기에서 제외한다(종교 구성표의 1위 종교 등) |
| `followups.facts` | (선택) 후속 판단에 쓸 사실 세트를 제한 |
| `prompt` | 안내문. 대상 수에 맞게 `{range}`가 "(가)~(다)" 또는 "(가)~(라)"로 바뀐다 |

## 5. 엔진 규칙 (`assets/exam-engine.js`)

**1차 식별이 성립하는 조건.** 아래를 만족하지 않으면 다른 대상 조합을 다시 뽑는다.
- `indicators`: 대상의 모든 쌍이 **보여 준 지표 중 하나에서** 비교 기준(`compare`) 이상 차이 나야 한다. `unstablePairs`·`disabled` 지표는 판별 근거가 될 수 없다.
- `items`: 대상마다 1위 품목이 달라야 한다.
- `composition`:
  - `depth:1`이면 대상마다 최대 항목이 다르고, 그 항목에서 다른 대상보다 `margin` 이상 커야 한다.
  - `depth:2`이면 대상마다 (1위, 2위) 조합이 다르고, 각 대상 안에서 1·2·3위 간격이 `margin` 이상이어야 한다.

**후속 판단 보기 종류.**

| 종류 | 생성 방식 | 참·거짓 근거 |
|---|---|---|
| `fact` | "(가)는 ○○ 회원국이다", 북반구·남반구 | 지식 카드 사실. 거짓은 배타적 세트의 다른 선택지이며, 가능하면 다른 대상의 값을 써서 혼동을 유도 |
| `both` | "(가)와 (나)는 모두 …" | 배타적 세트의 두 대상 값 |
| `sign` | 순유입·자연 감소처럼 방향만 진술 | `abs(값) ≥ sign.min` |
| `compare` | "(가)는 (나)보다 …" | **표에 보이지 않은 지표**만, `compare` 기준 이상, 불안정 쌍 제외 |
| `data` | 구성비 × 총량 | 비율 순서와 실제 양의 순서가 **반대인 경우만**(함정). 두 비율 모두 1% 이상, 1%p 이상 차이 |

- 보기는 참 2개·거짓 2개를 고른다.
- 같은 사실을 두 보기에 쓰지 않는다(`keys`).
- 정답 조합은 ㄱㄴ·ㄱㄷ·ㄴㄷ·ㄴㄹ·ㄷㄹ 중 하나다.
- 각 보기는 `check` 정보를 지닌다. 테스트가 이것으로 참·거짓을 지식 카드와 다시 대조한다.

**연도 처리.** 자료 표 아래에는 자료의 연도·출처를 표시한다. 문제에 주어진 자료를 읽는 것이므로 연도 암기가 아니다(`audit/EXAM-PRACTICE-20261017.md`의 원칙과 같다). 후속 판단의 비교 보기는 연도에 따라 뒤집히지 않을 만큼 큰 차이에서만 만든다. 보기 해설에는 근거 수치와 연도를 남긴다.

## 6. 주제를 추가하는 방법

1. 자료가 새로 필요하면 원자료를 `data/`에 정리한다. 출처 URL·연도·검색일을 `meta`에 기록하고, 다른 연도로 빈칸을 몰래 채우지 않는다.
2. 구성비 자료라면 `scripts/build-entity-kb.cjs`의 `compositions`에 추가한다. 국가 지표라면 `COUNTRY_INDICATORS`에 비교 기준과 함께 추가한다.
3. `assets/exam-themes.js`에 주제를 추가한다. 처음에는 `status:'draft'`로 두고, 확인이 끝나면 `'ready'`로 바꾼다.
4. 다음을 실행해 모든 시드에서 문항이 만들어지는지 확인한다.
   - `node scripts/build-entity-kb.cjs`
   - `node --test tests/*.cjs`
   - 실패하면 `pool`을 좁히거나 `margin`을 조정한다.
5. 실제 기출 원문과 대조해 단서와 보기가 평가원 방식과 맞는지 확인하고, 주제의 `exams`에 적는다.

## 7. 보강 과제 (다른 세션)

우선순위 순서다. 1번이 2027학년도 9월 13번 유형을 직접 재현한다.

1. **국가별 수출 구성 + 총수출액**
   - 출처: 세계은행 `TX.VAL.FUEL.ZS.UN`(연료), `TX.VAL.MMTL.ZS.UN`(광석·금속), `TX.VAL.FOOD.ZS.UN`(식료품), `TX.VAL.AGRI.ZS.UN`(농업 원료), `TX.VAL.MANF.ZS.UN`(공산품). 평가원 삼각 그래프의 원재료·연료/식료품/공업 제품과 대응한다.
   - 구성: `compositions.exports`와 `totalFrom:'exports'`, `amountNoun:'수출액'`의 주제를 만들면 "연료 수출액 vs 비중" 함정 보기가 자동으로 생긴다.
   - 대상: 사우디아라비아·나이지리아·튀르키예·칠레·오스트레일리아·인도네시아·일본·멕시코·아르헨티나 등 강의(2권 P08)에 나온 국가
2. **국가별 1차 에너지 구성**: EI 통계. 집계 방식 변경(대체법 → 물리적 에너지 함량)을 주제 `note`에 명시한다. 러시아·이란(천연가스), 프랑스(원자력), 브라질(석유·수력) 등 강의 기준점이 있다.
3. **국가 면적(유엔 인구 연감 2024)**: 국가 지표에 `area`·`density`를 추가한다. 비교 기준은 배수 1.5 이상을 권장한다.
4. **`data/entity-facts.json` 채우기**
   - `landlocked`(내륙국), `opec`(회원국과 기준 시점), `seas`(접한 바다)
   - 목록이 완전하면 `complete:true`로 둔다. 현재 엔진은 이 세 항목으로 참 진술만 만든다. 거짓 진술도 만들려면 `complete` 목록에 한해 `factSets`처럼 `exclusive`를 지원하도록 엔진에 한 줄을 추가한다.
5. **기후 자료 주제**: 강의 41개 기후 지점의 월별 기온·강수, 연교차·최한월·최난월 등 기출이 쓴 지표
   - 새 `kind:'climate'`가 필요하다. 식별 단서로 '최한월 + 연교차 = 최난월' 같은 계산 복원을 쓰고, 후속 판단은 반구·기후형·위치로 만든다.
   - 지점은 분류 세트 `climateCities`의 좌표를 재사용한다.
6. **지도 위치형(A~E)**: `exam.html`에 지도 미니맵을 넣는다. `classify.html`의 지도 코드를 재사용하고, "지도의 A~E 중 (가)~(다)의 위치" 단계를 추가한다.
7. **국가별 가축 구성**(FAO 소·돼지·양), **산업 구조**(세계은행 `NV.AGR.TOTL.ZS`·`NV.IND.TOTL.ZS`·`NV.SRV.TOTL.ZS`), **대륙별 종교·곡물 구성**: 모두 `composition` 주제로 추가할 수 있다.
8. **다년도 견고성 검증**: 국가 지표의 비교 기준을 2015·2020·2023·최신 값으로 대조한다. 지표에 `checkedYears`를 기록하고, 방향이 바뀌는 쌍은 `unstablePairs`에 넣는다.

## 8. 하지 않은 것

- 외부 자료를 새로 검색하지 않았다. 지식 카드는 기존에 받아 두었거나 저장소에 이미 있는 자료로만 만들었다(세계은행 2023, OWID 2023 전력, Pew 2020, 분류 세트·순위표).
- 기존 기출 핵심 40문항, 순위표, OX, 분류 지도, 위치 학습은 바꾸지 않았다. 상단 탭에 '기출형'만 추가했다.
