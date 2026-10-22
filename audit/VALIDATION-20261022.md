# 보완판 검증 기록 (2026-10-22)

`node --test tests/extensions.test.cjs` 26개 통과. 실제 실행 출력은 `audit/extensions-test-output-20261022.txt`에 있다.

원표 셀·문장 보존, 19개국 식별 후보와 앙골라의 given 조건, OPEC 기준판·기출 인구 집단의 기간, 기존 좌표·도형·OX 보존, UN 합계·Pew 비율·이주민 성별 합계·광물 단위, EI 매장량 분모·기간, 원유/제품 구분, Census 3개 주의 원출처 총액 일치, DFAT 피벗 중복 행·회계연도·비공개, 기후 결측·공식 키토 기온, 에너지의 10개 해 순위·반례를 검사했다.

세 생성 스크립트 `build-extensions.py`, `build-statistics.py`, `build-completions.py`의 오프라인 `--check`도 검사에 포함된다. `verify-sources.py`로 원자료 34개 해시·크기를 확인한다. 빈 셀을 0으로 만들지 않았고 전체 구성 순위는 빠진 구성요소가 없는 해만 판정했다.

기존 앱 전체 121개 검사는 이전 R1 기록이다. 이번 자료의 화면·문항 생성 검증으로 제시하지 않는다. 엔진 세 파일은 수정하지 않았다.
