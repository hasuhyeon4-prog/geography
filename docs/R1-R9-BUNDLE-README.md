# 세계지리 R1~R9 통합 자료 · 보완판

2026년 10월 22일 기준으로 기존 강의·검수 기록과 공개 통계에서 만든 확장 자료다. R1 농목업 자료와 R2~R9 자료를 같은 묶음에 포함했다. R1 인계는 docs/AGRICULTURE-DATA-HANDOFF.md를 따른다.

## 먼저 읽을 것

- `docs/R2-R9-HANDOFF.md`: 영역별 파일과 사용 조건, 실제로 남은 항목.
- `docs/DATA-REQUESTS.md`: 원래 요청서와 이번 작업의 진행 상태.
- `audit/VALIDATION-20261022.md`: 검증 결과.

R2~R9 모두에 자료를 만들었지만 **원래 요청서의 모든 세부 항목이 완료된 것은 아니다.** 추가 보완으로 석유·가스 매장량, 최신 원유 교역, 미국 주별 제조업 원표, 호주 교역 원표와 국가·도시 관계를 확보했다. 현재 남은 관측 자료는 키토의 같은 기간 강수, 아부자·이키토스 월평균 기온이다. 일부 국가 속성과 역사 연도에는 출처에 따른 사용 제한이 있다. 보류 항목은 인계문서와 `audit/request-coverage-20261022.json`에 기록했다. 빈 값을 0이나 추측으로 채우지 않았다.

## 범위

강의의 표·원문을 17개 개념 영역으로 구조화했다. 카드의 대상 기록은 325개이며, 서로 다른 파일에 같은 대상이 재등장할 수 있다. 보완 카드 2종은 별도 파일이다. 국가 설명은 원문·문장의 국가별 연결 1,659건으로, 문제 수나 고유한 지식 수가 아니다. 기존 검수 기록의 820문항과 현재 강의 블록을 정확히 대응시킨 근거 연결도 보존했다. 이번 작업이 820문항 원문을 새로 전수 재판독했다는 뜻은 아니다.

통계는 OWID 에너지, IRENA 지열, BGS 광물, EIA 수출·석탄 매장량, EI 석유·가스 매장량·원유 교역, Census 주별 제조업, DFAT 역사·현대 상품 교역, UN WUP 도시·촌락 인구, WDI 합계 출산율, UN WPP 공식 지역 출산율, UN DESA 미국 거주 이주민, Pew 종교 구성이다. 공식 원자료의 공개 사본을 사용한 경우에는 전달 경로를 따로 기록했다.

화면과 문제 엔진 연결은 포함하지 않았다. 기존 `assets/exam-engine.js`, `assets/exam-themes.js`, `exam.html`은 수정하지 않았다. `assets/fact-statements.js`는 기존 항목을 그대로 보존하고 근거가 명시된 R9 OX 16개를 추가한 호환 모듈이다.

## 다시 만들기

인터넷 연결 없이 Python 표준 라이브러리와 Node.js로 확인할 수 있다.

```sh
python3 scripts/verify-sources.py
python3 scripts/build-extensions.py --check
python3 scripts/build-statistics.py --check
python3 scripts/build-completions.py --check
node --test tests/extensions.test.cjs
```

`--check`를 빼면 해당 생성 파일을 다시 쓴다. 원문 추출 JSON, 원자료 ZIP, URL·수집일·SHA-256, 기출 연결, 행·열 위치를 함께 제공한다. 강의 쪽수는 새로 측정하지 않았으며, 대신 권·P단원·블록·표 행·열로 정확히 찾을 수 있다.

## 앱에 연결할 때

`complete:false`인 속성은 누락이나 다른 값을 근거로 거짓 보기를 만들면 안 된다. `sourceReading`은 근거 읽기, `suppliedData`는 표·연도·단위를 제공하는 연습이다. 회상에는 명시적으로 허용된 항목만 사용한다. `data/exam-relations-energy.json`의 새 `validatedIndicatorOrders`는 기존 엔진 `orders`와 다르므로 어댑터에서 처리해야 한다. 엔진이 자동으로 이해한다고 가정하지 않는다.


## 30MB 미만 다운로드 묶음

세 파일을 같은 위치에 압축 해제하면 같은 `세계지리_R1-R9` 폴더로 합쳐진다. 원자료 34개를 두 스냅숏 ZIP으로 나눴으며 스크립트가 자동으로 둘 다 읽는다. 자료의 값을 바꾸거나 삭제하지 않았다. 자세한 절차는 `다운로드_안내.md`를 따른다.
