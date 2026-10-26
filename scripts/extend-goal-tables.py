#!/usr/bin/env python3
"""Select only goal-cited lecture tables; never copy the complete lecture register.

Usage: python3 scripts/extend-goal-tables.py /private/lecture-blocks.json
The resulting curated JSON is the public, offline input to build-goal-tables.cjs.
"""
import copy
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
goals = json.loads((ROOT / 'data/lecture-gap-goals.json').read_text())
blocks = {x['id']: x for x in json.loads(Path(sys.argv[1]).read_text())}
original = json.loads((ROOT / 'data/lecture-goal-table-overrides.json').read_text())
# Preserve the deliberately reconstructed tables and their stable question IDs.
tables = [copy.deepcopy(t) for t in original['tables'] if t['id'] in {
    'goal-oldmaps-east', 'goal-crust-change', 'goal-caldera-karst',
    'goal-cave-deposition', 'goal-delta-fan', 'goal-river-criteria'}]
by_id = {t['id']: t for t in tables}
transpose = {'L1-B0343', 'L1-B0372', 'L1-B0379', 'L1-B0390', 'L1-B0400',
             'L1-B0645', 'L1-B0680', 'L1-B1092', 'L2-B0047', 'L2-B0229',
             'L2-B0422', 'L2-B0476', 'L2-B0660', 'L2-B0830', 'L2-B1029', 'L2-B1133'}
special = {'L1-B0169', 'L1-B0174', 'L1-B0324', 'L1-B0353', 'L1-B0621',
           'L1-B0680', 'L1-B0702', 'L1-B0888'}

def section(gid):
    n = int(gid[1:4])
    return next(i for i, end in enumerate([4, 10, 24, 38, 52, 70, 80, 93, 108, 122, 132, 139]) if n <= end)

def add(tid, gids, refs, headers, rows, **kw):
    item = dict(id=tid, domain=f'goal-p{section(gids[0]):02}',
                lecture=f'P{section(gids[0]):02} · 강의 보완', goalIds=gids,
                source=refs, headers=headers, rows=rows, **kw)
    if tid in by_id:
        return by_id[tid]
    tables.append(item)
    by_id[tid] = item
    return item

for goal in goals:
    if goal['venue'] != '강의 표':
        continue
    refs = []
    for m in re.finditer(r'L([12])-B(\d{4})((?:[·ㆍ/、]\d{4})*)', ' '.join(goal[k] for k in ['goal', 'done', 'data'])):
        refs += [f'L{m[1]}-B{n}' for n in re.findall(r'\d{4}', m[2]+m[3])]
    for ref in dict.fromkeys(refs):
        if ref in special or ref not in blocks or blocks[ref]['kind'] != 'table':
            continue
        tid = 'goal-table-' + ref.lower()
        if tid in by_id:
            if goal['id'] not in by_id[tid]['goalIds']:
                by_id[tid]['goalIds'].append(goal['id'])
            continue
        rows = copy.deepcopy(blocks[ref]['rows'])
        if ref in transpose:
            rows = [list(row) for row in zip(*rows)]
        if len(rows) < 2 or len(rows[0]) < 2:
            raise ValueError(ref + ' needs manual reconstruction')
        add(tid, [goal['id']], [ref], rows[0], rows[1:])

def table(ref):
    return by_id['goal-table-'+ref.lower()]

# Extend narrowly cited tables only with the named, lecture-supported details.
table('L1-B0220')['rows'] += [
    ['도형표현도', '원·막대 등 도형의 크기를 수량에 대응', '면적·반지름 중 무엇이 값에 비례하는지 범례 확인'],
    ['등치선도', '같은 값을 갖는 지점을 선으로 연결', '선의 수치·간격과 분포 확인']]
table('L1-B0220')['source'] += ['L1-B0222', 'L1-B0223']
add('goal-planetary-winds', ['G011-1'], ['L1-B0295', 'L1-B0296'],
    ['바람·반구', '불어오는 방향', '이동 방향'], [
    ['북반구 무역풍', '북동풍', '북동→남서, 아열대 고압대에서 적도 쪽'],
    ['남반구 무역풍', '남동풍', '남동→북서, 아열대 고압대에서 적도 쪽'],
    ['북반구 편서풍', '대체로 남서풍', '서→동, 아열대 고압대에서 고위도 쪽'],
    ['남반구 편서풍', '대체로 북서풍', '서→동, 아열대 고압대에서 고위도 쪽'],
    ['북반구 극동풍', '북동풍', '고위도에서 저위도 쪽'],
    ['남반구 극동풍', '남동풍', '고위도에서 저위도 쪽']])
add('goal-koppen-symbols', ['G014-4'], ['L1-B0324'], ['기호', '강수·기온 의미', '읽을 때의 조건'], [
    ['f', '연중 습윤·건기 불명확', '제시된 수치 판정 기준 우선'],
    ['w', '겨울 건조', '해당 반구의 겨울 확인'],
    ['s', '여름 건조', '해당 반구의 여름 확인'],
    ['a/b', '더운 여름/선선한 여름의 차이', 'Cfa와 Cfb 등의 여름 기온 비교']])
add('goal-desert-water', ['G016-2'], ['L1-B0353'], ['대상', '구별할 정의'], [
    ['외래 하천', '습윤 지역·고산에서 발원해 건조 지역으로 유입되는 하천'],
    ['와디', '건조 지역에서 비가 내릴 때 일시적으로 물이 흐르는 하곡'],
    ['오아시스', '건조 지역에서 지하수 등이 지표에 나타나 물을 얻는 곳'],
    ['카나트', '지하 수로를 통해 증발을 줄이며 물을 이동시키는 시설']])
# The crust-change reconstruction must also retain the lecture's signals and places.
crust = by_id['goal-crust-change']
crust['headers'] = blocks['L1-B0621']['rows'][0]
crust['rows'] = blocks['L1-B0621']['rows'][1:]
new = '알프스·히말라야·안데스·로키·아틀라스·캅카스'
old = '애팔래치아·스칸디나비아·우랄·그레이트디바이딩·케이프'
table('L1-B0645')['rows'][0][3] = new
table('L1-B0645')['rows'][1][3] = old
add('goal-mountain-groups', ['G027-1'], ['L1-B0645', 'L1-B0646', 'L1-B0647'],
    ['산지', '조산대 구분'], [[x, label] for label, names in [('신기 습곡 산지', new), ('고기 습곡 산지', old)] for x in names.split('·')])
add('goal-permafrost-layers', ['G032-1'], ['L1-B0781', 'L1-B0783'], ['층', '정의'], [
    ['활동층', '영구 동토 위에서 여름에 녹고 겨울에 다시 어는 표층'],
    ['영구 동토층', '오랜 기간 얼어 있는 지층']])
add('goal-field-trip-processes', ['G029-1'], ['L1-B0709', 'L1-B0710', 'L1-B0713', 'L1-B0717', 'L1-B0718', 'L1-B0721', 'L1-B0723'],
    ['답사 지역', '재료·공간', '과정 결합'], [
    ['포스토이나', '슬로베니아 석회 동굴', '용식으로 형성된 동굴 공간 + 탄산칼슘 침전 생성물'],
    ['항순동', '베트남 석회 동굴', '용식으로 형성된 동굴 공간 + 탄산칼슘 침전 생성물'],
    ['보홀', '필리핀 석회 동굴 지대', '석회암 용식 + 동굴 내부 탄산칼슘 침전'],
    ['짱안', '베트남 석회암 잔류 봉우리', '석회암 용식 뒤 남은 탑 카르스트'],
    ['탐루앙', '타이 북부 석회 동굴', '동굴 공간은 용식, 종유석·석순은 침전'],
    ['플리트비체', '크로아티아 석회암 지대·호수', '동굴 공간은 용식, 석회화 지형은 침전'],
    ['블루라군', '아이슬란드 온천 관광지', '화산 지역의 지열 이용'],
    ['타우포·로토루아', '뉴질랜드 북섬 화산 지대', '화산체 함몰의 칼데라호·지열에 의한 간헐천']])
add('goal-film-festivals', ['G046-4'], ['L1-B1115', 'L1-B1116'], ['영화제 도시', '국가', '위치·경관 단서'], [
    ['베네치아', '이탈리아', '아드리아해 북부·수로와 곤돌라'],
    ['베를린', '독일', '독일의 수도·분단과 통일'],
    ['칸', '프랑스', '프랑스 지중해 연안']])
table('L1-B1169')['rows'] += [
    ['로힝야족·라카인', '미얀마 서부·이슬람 소수 집단·시민권 배제와 난민'],
    ['모로족·민다나오', '필리핀 남부·이슬람 집단·토지와 자치 요구'],
    ['남수단', '수단 남부의 종교·민족·정치·자원 문제와 2011년 독립'],
    ['시에라리온', '서아프리카·다이아몬드 불법 유통과 내전 자금의 연결']]
table('L1-B1169')['source'] += ['L1-B1162', 'L1-B1163', 'L1-B1172', 'L1-B1181']
foods = [
    ['토르티야', '옥수수', '멕시코; 밀 토르티야도 있음'], ['퍼', '쌀', '베트남의 쌀국수'],
    ['나시고렝', '쌀', '인도네시아의 볶음밥'], ['나시르막', '쌀', '말레이시아의 쌀 요리'],
    ['피자', '밀', '이탈리아'], ['난', '밀', '남아시아'],
    ['압구시트', '양고기', '이란'], ['허르헉', '양고기', '몽골'],
    ['파에야', '쌀', '에스파냐'], ['참파', '보리·쌀보리', '티베트 고산의 볶은 곡물']]
add('goal-food-ingredients', ['G052-4', 'G077-1'], ['L1-B1283', 'L1-B1284', 'L1-B1293', 'L1-B1304', 'L2-B0174', 'L2-B0177'],
    ['음식', '주재료', '지역·조건'], foods)
add('goal-lithium-forms', ['G090-5'], ['L2-B0474', 'L2-B0475', 'L2-B0476'],
    ['산지 단서', '자원 형태·통계 판정'], [
    ['칠레·아르헨티나·볼리비아', '남아메리카 염수 자원; 자원 부존과 실제 생산량은 구별'],
    ['오스트레일리아', '경암형 리튬 자원; 남아메리카 염수형과 추출 조건이 다름'],
    ['볼리비아 우유니', '염원 자원의 존재가 현재 최대 생산국임을 뜻하지 않음']])
add('goal-eu-currency-border', ['G106-1'], ['L2-B0821', 'L2-B0822'],
    blocks['L2-B0821']['rows'][0], blocks['L2-B0821']['rows'][1:])
add('goal-environment-days', ['G122-1'], ['L2-B1062'], ['기념일', '날짜', '주제·활동'], [
    ['세계 습지의 날', '2월 2일', '습지 보전·현명한 이용; 람사르 협약과 연결'],
    ['세계 사막화 방지의 날', '6월 17일', '사막화 방지·토지 복원'],
    ['세계 오존층 보호의 날', '9월 16일', '오존층 파괴 물질 감축·몬트리올 의정서'],
    ['세계 차 없는 날', '9월 22일', '자동차 이용·배출 저감']])

# Standalone questions cover relations that a single cell lookup cannot test.
questions = [
    dict(id='desert-cold-current-pair', goalIds=['G003-2'], table='goal-table-l1-b0053',
         prompt='서안 한류의 영향을 공통으로 받으면서 대륙은 서로 다른 사막의 쌍은?',
         options=['나미브·아타카마', '고비·타클라마칸', '사하라·아라비아', '파타고니아·고비'], answer=0,
         explain='나미브는 아프리카, 아타카마는 남아메리카의 서안 한류와 연결된다.'),
    dict(id='coast-process-sequence', goalIds=['G035-2'], table='goal-table-l1-b0855',
         prompt='곶의 해식 동굴이 관통한 뒤 천장이 붕괴할 때 나타나는 연결은?',
         options=['해식 동굴 → 해식 아치 → 시스택', '시스택 → 해식 아치 → 해식 동굴', '해식 동굴 → 사주 → 석호', '해식 아치 → 선상지 → 시스택'], answer=0,
         explain='동굴의 관통은 아치, 아치 천장의 붕괴는 고립된 암주인 시스택과 연결된다.'),
    dict(id='delta-process-category', goalIds=['G038-1'], table='goal-delta-fan',
         prompt='지형·작용·형성 위치를 바르게 연결한 것은?',
         options=['삼각주=하구 지형, 하구 퇴적=작용, 선상지=산록의 퇴적 지형', '삼각주=하천 유형, 하구 퇴적=지형 이름', '조차가 클수록 모든 하구에 삼각주가 생긴다', '선상지는 반드시 바다와 접한 하구에만 생긴다'], answer=0,
         explain='삼각주는 하구의 지형이고 하구 퇴적은 작용이다. 공급과 제거의 관계를 봐야 하며, 선상지는 산록의 경사 감소와 연결된다.')]
periods = [
    ['천하도', '조선 중기 이후', ['고대 메소포타미아', '조선 전기 1402년', '조선 후기 최한기']],
    ['혼일강리역대국도지도', '조선 전기 1402년', ['조선 중기 이후 민간', '조선 후기 최한기', '현대 위성 지도 시대']],
    ['곤여만국전도', '명대·혼일강리보다 늦음', ['혼일강리보다 먼저', '조선 후기 최한기 제작', '현대 위성 지도 시대']],
    ['지구전후도', '조선 후기·최한기', ['조선 전기 1402년', '고대 메소포타미아', '명대 중국에서 리치 제작']],
    ['대명 혼일도와 지구전후도', '대명 혼일도가 먼저', ['지구전후도가 먼저', '둘 다 현대 위성 지도', '두 지도가 같은 시기에 같은 제작자에 의해 제작']]]
for i, (name, answer, wrong) in enumerate(periods):
    questions.append(dict(id=f'old-map-period-{i+1}', goalIds=['G005-1'], table='goal-oldmaps-east',
        prompt=f'{name}의 제작 시기·선후를 바르게 설명한 것은?', options=[answer]+wrong, answer=0,
        explain=name+' — '+answer+'. 서로 겹치는 시대 구간을 경쟁 선택지로 쓰지 않는다.'))

# Retain individually reviewed completion rows when reimporting private lecture tables.
reviewed = {t['id']: t for t in original['tables'] if t.get('completionReviewed')}
tables = [copy.deepcopy(reviewed.get(t['id'], t)) for t in tables]
for t in tables:
    if not t['rows'] or any(len(r) != len(t['headers']) for r in t['rows']):
        raise ValueError(t['id']+' invalid table')
    if len({r[0] for r in t['rows']}) != len(t['rows']):
        raise ValueError(t['id']+' duplicate targets')
missing = {g['id'] for g in goals if g['venue']=='강의 표'} - {i for t in tables for i in t['goalIds']}
if missing:
    raise ValueError('Unbound table goals: '+str(sorted(missing)))
names = ['위치·방위', '지도·지리 정보', '기후', '지형', '문화·종교', '인구·도시', '농목업', '에너지·자원', '공업·무역', '환경', '지역지리', '자료 해석']
out = dict(policy=original['policy'], domains=[
    dict(id='goal-oldmaps', name='고지도 세부 비교', section='P01'),
    dict(id='goal-landforms', name='지형 과정 비교', section='P03')
] + [dict(id=f'goal-p{i:02}', name=name+' · 강의 보완', section=f'P{i:02}') for i, name in enumerate(names)],
    tables=tables, questions=questions)
(ROOT/'data/lecture-goal-table-overrides.json').write_text(json.dumps(out,ensure_ascii=False,indent=1)+'\n')
print(f'{len(tables)} tables · {len(set(i for t in tables for i in t["goalIds"]))} goals · {len(questions)} relation questions')
