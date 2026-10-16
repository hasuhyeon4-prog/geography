"""Build assets/rankings.js from official statistics.

Inputs (downloaded into DATA_DIR):
  m49.html                UN M49 overview page (continent of each ISO3 code)
  wb_<indicator>.json     World Bank API, all countries, 2018–2024
  owid_energy.csv         Our World in Data energy dataset (Energy Institute, Ember)
  <crop>.csv              Our World in Data grapher CSVs of FAOSTAT series
Usage: python3 -I scripts/build-rankings.py DATA_DIR assets/rankings.js

Continents follow 평가원 materials: 앵글로아메리카 = UN "Northern America",
라틴 아메리카 = the rest of the Americas, and Russia counts in Europe (UN M49).
Rankings that rest only on the lecture are added at the end with their 기출.
"""
import csv, json, re, sys, html as H
from collections import defaultdict

D, OUT = sys.argv[1], sys.argv[2]
YEAR = '2023'
KO = {'IND': '인도', 'CHN': '중국', 'USA': '미국', 'IDN': '인도네시아', 'PAK': '파키스탄', 'NGA': '나이지리아', 'BRA': '브라질',
      'BGD': '방글라데시', 'RUS': '러시아', 'MEX': '멕시코', 'CAN': '캐나다', 'AUS': '오스트레일리아', 'ARG': '아르헨티나',
      'KAZ': '카자흐스탄', 'DZA': '알제리', 'DEU': '독일', 'JPN': '일본', 'GBR': '영국', 'FRA': '프랑스', 'ITA': '이탈리아',
      'SAU': '사우디아라비아', 'IRQ': '이라크', 'IRN': '이란', 'QAT': '카타르', 'KOR': '대한민국', 'VNM': '베트남', 'THA': '타이',
      'COL': '콜롬비아', 'ETH': '에티오피아', 'UGA': '우간다', 'CIV': '코트디부아르', 'GHA': '가나', 'ECU': '에콰도르',
      'CMR': '카메룬', 'UKR': '우크라이나', 'ESP': '에스파냐', 'NOR': '노르웨이', 'TUR': '튀르키예', 'EGY': '이집트',
      'PHL': '필리핀', 'COD': '콩고 민주 공화국', 'MMR': '미얀마', 'ZAF': '남아프리카 공화국', 'ARE': '아랍 에미리트'}
CONT_KO = {'Asia': '아시아', 'Africa': '아프리카', 'Europe': '유럽', 'Latin America': '라틴 아메리카',
           'Northern America': '앵글로아메리카', 'Oceania': '오세아니아'}
BLOCS = {
    'EU': 'AUT BEL BGR HRV CYP CZE DNK EST FIN FRA DEU GRC HUN IRL ITA LVA LTU LUX MLT NLD POL PRT ROU SVK SVN ESP SWE',
    'USMCA': 'USA CAN MEX',
    'ASEAN': 'BRN KHM IDN LAO MYS MMR PHL SGP THA VNM',
    'MERCOSUR': 'BRA ARG PRY URY',
}

# --- continents from UN M49 ---
page = open(f'{D}/m49.html', encoding='utf-8').read()
table = page[page.find('id = "downloadTableEN"'):]
table = table[:table.find('</table>')]
continent = {}
for row in re.findall(r'<tr>(.*?)</tr>', table, re.S)[1:]:
    cells = [H.unescape(re.sub('<.*?>', '', x)).strip() for x in re.findall(r'<td>(.*?)</td>', row, re.S)]
    if len(cells) < 12 or not cells[11] or not cells[3]:
        continue
    region = cells[3]
    if region == 'Americas':
        region = 'Northern America' if cells[5] == 'Northern America' else 'Latin America'
    continent[cells[11]] = region

def load_wb(code):
    out = defaultdict(dict)
    for r in json.load(open(f'{D}/wb_{code}.json'))[1]:
        if r['value'] is not None:
            out[r['countryiso3code']][r['date']] = r['value']
    return out
WB = {c: load_wb(c) for c in ['SP.POP.TOTL', 'NY.GDP.MKTP.CD', 'AG.SRF.TOTL.K2', 'SP.URB.TOTL', 'SP.DYN.CBRT.IN',
                               'SP.DYN.CDRT.IN', 'SP.POP.65UP.TO', 'SP.POP.0014.TO', 'SM.POP.NETM',
                               'TX.VAL.MRCH.CD.WT', 'TM.VAL.MRCH.CD.WT']}
def v(code, iso):
    s = WB[code].get(iso, {})
    for y in (YEAR, '2022', '2021'):  # surface area and a few late reporters lag a year
        if y in s:
            return s[y]
    return None

def aggregate(members):
    pop = sum(v('SP.POP.TOTL', i) or 0 for i in members)
    def weighted(code):
        pairs = [(v(code, i), v('SP.POP.TOTL', i) or 0) for i in members if v(code, i) is not None]
        return sum(a * b for a, b in pairs) / sum(b for _, b in pairs)
    area = sum(v('AG.SRF.TOTL.K2', i) or 0 for i in members)
    gdp = sum(v('NY.GDP.MKTP.CD', i) or 0 for i in members)
    return {
        'members': len(members), 'pop': pop, 'gdp': gdp, 'area': area, 'density': pop / area, 'gdppc': gdp / pop,
        'urban': sum(v('SP.URB.TOTL', i) or 0 for i in members) / pop * 100,
        'nir': weighted('SP.DYN.CBRT.IN') - weighted('SP.DYN.CDRT.IN'),
        'old': sum(v('SP.POP.65UP.TO', i) or 0 for i in members) / pop * 100,
        'young': sum(v('SP.POP.0014.TO', i) or 0 for i in members) / pop * 100,
        'netmig': sum(v('SM.POP.NETM', i) or 0 for i in members),
        'trade': sum((v('TX.VAL.MRCH.CD.WT', i) or 0) + (v('TM.VAL.MRCH.CD.WT', i) or 0) for i in members),
    }

countries = [i for i in continent if i in WB['SP.POP.TOTL']]
by_cont = defaultdict(list)
for i in countries:
    by_cont[continent[i]].append(i)
CONT = {CONT_KO[k]: aggregate(m) for k, m in by_cont.items()}
BLOC = {k: aggregate(m.split()) for k, m in BLOCS.items()}

rankings = []
def add(group, rid, title, unit, year, source, items, phrase, digits=1, note='', low=None):
    """items: {name: value}. phrase completes 'X이(가) 더 ___ 쪽'. low: wording for the smaller side."""
    rows = sorted(items.items(), key=lambda kv: -kv[1])
    rankings.append({'group': group, 'id': rid, 'title': title, 'unit': unit, 'year': year, 'source': source,
                     'phrase': phrase, 'low': low, 'digits': digits, 'note': note,
                     'items': [{'name': n, 'value': round(x, digits)} for n, x in rows]})

WBS = '세계은행 WDI'
bloc_note = '2023년 회원 기준: EU 27, USMCA 3, ASEAN 10(동티모르는 2025년 가입), MERCOSUR 4(볼리비아는 2024년 정회원, 베네수엘라 자격 정지).'
add('bloc', 'bloc-members', '회원국 수', '개국', '2023', '강의 2권 P08', {k: x['members'] for k, x in BLOC.items()}, '회원국이 많은', 0, bloc_note, '회원국이 적은')
add('bloc', 'bloc-pop', '총인구', '억 명', '2023', WBS, {k: x['pop'] / 1e8 for k, x in BLOC.items()}, '총인구가 많은', 2, bloc_note, '총인구가 적은')
add('bloc', 'bloc-gdp', '역내 총생산(GDP 합계)', '조 달러', '2023', WBS, {k: x['gdp'] / 1e12 for k, x in BLOC.items()}, '총생산이 많은', 1, bloc_note, '총생산이 적은')
add('bloc', 'bloc-trade', '상품 무역액(수출+수입)', '조 달러', '2023', WBS, {k: x['trade'] / 1e12 for k, x in BLOC.items()}, '무역액이 많은', 2, '역내 교역을 포함한 회원국 합계. ' + bloc_note, '무역액이 적은')
add('bloc', 'bloc-gdppc', '1인당 GDP', '천 달러', '2023', WBS, {k: x['gdppc'] / 1e3 for k, x in BLOC.items()}, '1인당 GDP가 많은', 1, bloc_note, '1인당 GDP가 적은')
add('bloc', 'bloc-area', '면적', '백만 km²', '2023', WBS, {k: x['area'] / 1e6 for k, x in BLOC.items()}, '면적이 넓은', 2, bloc_note, '면적이 좁은')
add('bloc', 'bloc-density', '인구 밀도', '명/km²', '2023', WBS, {k: x['density'] for k, x in BLOC.items()}, '인구 밀도가 높은', 0, bloc_note, '인구 밀도가 낮은')

cn = '대륙 구분: 유엔 M49(러시아는 유럽, 앵글로아메리카는 미국·캐나다 등 북부 아메리카).'
add('continent', 'cont-pop', '총인구', '억 명', '2023', WBS, {k: x['pop'] / 1e8 for k, x in CONT.items()}, '총인구가 많은', 1, cn, '총인구가 적은')
add('continent', 'cont-area', '면적', '백만 km²', '2023', WBS, {k: x['area'] / 1e6 for k, x in CONT.items()}, '면적이 넓은', 1, cn, '면적이 좁은')
add('continent', 'cont-density', '인구 밀도', '명/km²', '2023', WBS, {k: x['density'] for k, x in CONT.items()}, '인구 밀도가 높은', 0, cn, '인구 밀도가 낮은')
add('continent', 'cont-urban', '도시화율', '%', '2023', WBS, {k: x['urban'] for k, x in CONT.items()}, '도시화율이 높은', 1, cn + ' 라틴 아메리카와 앵글로아메리카는 근소한 차이 — 2015년 자료에서는 앵글로아메리카가 더 높았다.', '도시화율이 낮은')
add('continent', 'cont-nir', '인구 자연 증가율', '‰', '2023', WBS, {k: x['nir'] for k, x in CONT.items()}, '자연 증가율이 높은', 1, cn + ' 출생률 − 사망률. 유럽은 음수(자연 감소).', '자연 증가율이 낮은')
add('continent', 'cont-old', '노년층(65세 이상) 비율', '%', '2023', WBS, {k: x['old'] for k, x in CONT.items()}, '노년층 비율이 높은', 1, cn, '노년층 비율이 낮은')
add('continent', 'cont-young', '유소년층(0~14세) 비율', '%', '2023', WBS, {k: x['young'] for k, x in CONT.items()}, '유소년층 비율이 높은', 1, cn, '유소년층 비율이 낮은')
add('continent', 'cont-netmig', '순이동(순유입 + / 순유출 −)', '만 명', '2023', WBS, {k: x['netmig'] / 1e4 for k, x in CONT.items()}, '순유입이 많은', 0, cn + ' 앵글로아메리카·유럽·오세아니아는 순유입, 라틴 아메리카·아프리카·아시아는 순유출.', '순유출이 많은')
add('continent', 'cont-gdp', 'GDP 합계', '조 달러', '2023', WBS, {k: x['gdp'] / 1e12 for k, x in CONT.items()}, 'GDP가 많은', 1, cn, 'GDP가 적은')
add('continent', 'cont-gdppc', '1인당 GDP', '천 달러', '2023', WBS, {k: x['gdppc'] / 1e3 for k, x in CONT.items()}, '1인당 GDP가 많은', 1, cn, '1인당 GDP가 적은')

def top_wb(code, n=8):
    rows = sorted(((i, v(code, i)) for i in countries if v(code, i) is not None), key=lambda x: -x[1])[:n]
    return rows
def named(rows, scale=1):
    missing = [i for i, _ in rows if i not in KO]
    if missing:
        raise SystemExit('Korean name missing: ' + ', '.join(missing))
    return {KO[i]: x / scale for i, x in rows}
add('country', 'country-pop', '국가 인구 상위', '억 명', '2023', WBS, named(top_wb('SP.POP.TOTL'), 1e8), '인구가 많은', 2, '인도가 2023년 중국을 넘어 1위.', '인구가 적은')
add('country', 'country-area', '국가 면적 상위', '백만 km²', '2023', WBS, named(top_wb('AG.SRF.TOTL.K2'), 1e6), '면적이 넓은', 2, '미국과 중국은 집계 기준에 따라 순서가 바뀔 수 있는 근소한 차이.', '면적이 좁은')
add('country', 'country-gdp', '국가 GDP 상위', '조 달러', '2023', WBS, named(top_wb('NY.GDP.MKTP.CD'), 1e12), 'GDP가 많은', 2, '명목 GDP.', 'GDP가 적은')

# --- energy (Energy Institute Statistical Review / Ember via OWID) ---
energy = list(csv.DictReader(open(f'{D}/owid_energy.csv', encoding='utf-8')))
def energy_top(col, n=6):
    rows = [(r['iso_code'], float(r[col])) for r in energy if r['year'] == YEAR and len(r['iso_code']) == 3 and r[col]]
    return sorted(rows, key=lambda x: -x[1])[:n]
EI = 'Energy Institute 통계 (OWID)'
add('energy', 'oil-prod', '석유 생산 상위국', 'TWh', '2023', EI, named(energy_top('oil_production')), '석유 생산이 많은', 0, '러시아와 사우디아라비아는 근소한 차이 — 단위(배럴·톤·에너지)에 따라 순서가 바뀐다.', '석유 생산이 적은')
add('energy', 'gas-prod', '천연가스 생산 상위국', 'TWh', '2023', EI, named(energy_top('gas_production')), '천연가스 생산이 많은', 0, '', '천연가스 생산이 적은')
add('energy', 'coal-prod', '석탄 생산 상위국', 'TWh', '2023', EI, named(energy_top('coal_production')), '석탄 생산이 많은', 0, '중국이 압도적 1위. 미국과 오스트레일리아는 근소한 차이.', '석탄 생산이 적은')
world = {r['year']: r for r in energy if r['country'] == 'World'}[YEAR]
src_ko = {'oil': '석유', 'coal': '석탄', 'gas': '천연가스', 'hydro': '수력', 'nuclear': '원자력', 'wind': '풍력', 'solar': '태양광'}
add('energy', 'primary-mix', '세계 1차 에너지 소비 구성', '%', '2023', EI, {src_ko[k]: float(world[k + '_share_energy']) for k in src_ko}, '비중이 큰', 1, '1차 에너지 전체 기준. 전력 생산 구성과 다르다.', '비중이 작은')
add('energy', 'elec-mix', '세계 전력 생산 구성', 'TWh', '2023', EI, {src_ko[k]: float(world[k + '_electricity']) for k in src_ko}, '발전량이 많은', 0, '전력만의 구성 — 1차 에너지에서는 석유가 1위지만 발전에서는 석탄이 1위.', '발전량이 적은')
add('energy', 'hydro-elec', '수력 발전 상위국', 'TWh', '2023', EI, named(energy_top('hydro_electricity', 5)), '수력 발전량이 많은', 0, '국가 내부 수력 비중(노르웨이·네팔 등)과 세계 발전량 순위는 다르다.', '수력 발전량이 적은')
add('energy', 'nuclear-elec', '원자력 발전 상위국', 'TWh', '2023', EI, named(energy_top('nuclear_electricity', 5)), '원자력 발전량이 많은', 0, '프랑스는 발전량 3위이지만 자국 발전에서 원자력 비중이 매우 높다.', '원자력 발전량이 적은')
add('energy', 'wind-elec', '풍력 발전 상위국', 'TWh', '2023', EI, named(energy_top('wind_electricity', 5)), '풍력 발전량이 많은', 0, '영국과 인도는 근소한 차이.', '풍력 발전량이 적은')
add('energy', 'solar-elec', '태양광 발전 상위국', 'TWh', '2023', EI, named(energy_top('solar_electricity', 5)), '태양광 발전량이 많은', 0, '', '태양광 발전량이 적은')

# --- crops and livestock (FAOSTAT via OWID) ---
def crop_rows(name):
    rows = list(csv.DictReader(open(f'{D}/{name}.csv', encoding='utf-8')))
    col = [c for c in rows[0] if c not in ('entity', 'code', 'year')][0]
    return [r for r in rows if r['year'] == YEAR], col
def crop_top(name, n=5):
    rows, col = crop_rows(name)
    return sorted(((r['code'], float(r[col])) for r in rows if len(r['code']) == 3 and r[col]), key=lambda x: -x[1])[:n]
def crop_continents(name):
    rows, col = crop_rows(name)
    agg = {r['entity']: float(r[col]) for r in rows if r['entity'].endswith('(FAO)') and r[col]}
    return {'아시아': agg['Asia (FAO)'], '아프리카': agg['Africa (FAO)'], '유럽': agg['Europe (FAO)'],
            '앵글로아메리카': agg['Northern America (FAO)'], '라틴 아메리카': agg['Americas (FAO)'] - agg['Northern America (FAO)'],
            '오세아니아': agg['Oceania (FAO)']}
FAO = 'FAOSTAT (OWID)'
add('farm', 'maize-prod', '옥수수 생산 상위국', '백만 톤', '2023', FAO, named(crop_top('maize-production'), 1e6), '옥수수 생산이 많은', 1, '', '옥수수 생산이 적은')
add('farm', 'wheat-prod', '밀 생산 상위국', '백만 톤', '2023', FAO, named(crop_top('wheat-production'), 1e6), '밀 생산이 많은', 1, '', '밀 생산이 적은')
add('farm', 'rice-prod', '쌀 생산 상위국', '백만 톤', '2023', FAO, named(crop_top('rice-production'), 1e6), '쌀 생산이 많은', 1, '인도와 중국은 0.6% 차이로 자료 판본에 따라 순서가 바뀐다(강의의 2023년 자료는 중국 1위).', '쌀 생산이 적은')
for crop, ko in [('maize-production', '옥수수'), ('wheat-production', '밀'), ('rice-production', '쌀')]:
    c = crop_continents(crop)
    total = sum(c.values())
    add('farm', crop.split('-')[0] + '-cont', ko + ' 생산의 대륙별 비중', '%', '2023', FAO, {k: x / total * 100 for k, x in c.items()}, ko + ' 생산 비중이 큰', 1, '세계 생산량 중 각 대륙의 몫. 대륙 내부 작물 구성과 다르다.', ko + ' 생산 비중이 작은')
world_crop = {}
for crop, ko in [('maize-production', '옥수수'), ('wheat-production', '밀'), ('rice-production', '쌀(벼)')]:
    rows, col = crop_rows(crop)
    world_crop[ko] = [float(r[col]) for r in rows if r['entity'] == 'World'][0] / 1e6
add('farm', 'grain-world', '세계 곡물 생산량', '백만 톤', '2023', FAO, world_crop, '생산량이 많은', 0, '쌀은 벼(도정 전) 기준. 밀과 쌀은 근소한 차이.', '생산량이 적은')
add('farm', 'coffee-prod', '커피 생산 상위국', '백만 톤', '2023', FAO, named(crop_top('coffee-bean-production'), 1e6), '커피 생산이 많은', 2, '에티오피아는 아프리카 최대, 베트남은 아시아 최대.', '커피 생산이 적은')
add('farm', 'cocoa-prod', '카카오 생산 상위국', '백만 톤', '2023', FAO, named(crop_top('cocoa-bean-production'), 1e6), '카카오 생산이 많은', 2, '', '카카오 생산이 적은')
add('farm', 'cattle-count', '소 사육 두수 상위국', '백만 마리', '2023', FAO, named(crop_top('cattle-livestock-count-heads'), 1e6), '소 사육 두수가 많은', 1, '2020년 강의 자료에서는 에티오피아가 중국보다 많았다.', '소 사육 두수가 적은')
add('farm', 'pig-count', '돼지 사육 두수 상위국', '백만 마리', '2023', FAO, named(crop_top('pig-livestock-count-heads'), 1e6), '돼지 사육 두수가 많은', 1, '중국이 세계 사육 두수의 큰 비중.', '돼지 사육 두수가 적은')
meat = [r for r in csv.DictReader(open(f'{D}/global-meat-production-by-livestock-type.csv', encoding='utf-8')) if r['entity'] == 'World' and r['year'] == YEAR][0]
pick = lambda key: float([meat[k] for k in meat if k.startswith(key)][0]) / 1e6
add('farm', 'meat-world', '세계 육류 생산 구성', '백만 톤', '2023', FAO, {'가금류': pick('meat__poultry'), '돼지고기': pick('meat__pig'), '소고기(물소 포함)': pick('meat__beef'), '양·염소고기': pick('meat__sheep')}, '생산량이 많은', 1, '사육 두수는 소 > 양 > 돼지이지만, 육류 생산량은 돼지가 소보다 많다.', '생산량이 적은')

# --- religion (Pew Research Center, 2025 report on 2020) ---
add('religion', 'religion-world', '세계 종교 인구', '%', '2020', 'Pew Research Center (2025)', {'크리스트교': 28.8, '이슬람교': 25.6, '무종교': 24.2, '힌두교': 14.9, '불교': 4.1, '유대교': 0.2}, '인구가 많은', 1, '크리스트교 약 23억, 무종교 약 19억, 힌두교 약 12억, 불교 약 3.2억, 유대교 약 1,480만 명.', '인구가 적은')

# --- lecture-only rankings, kept with their 기출 ---
add('farm', 'wheat-export', '밀 수출 비중 상위국', '%', '2018~2022 평균', '강의 2권 P06', {'러시아': 16.5, '미국': 12.5, '캐나다': 11.6, '프랑스': 9.9, '오스트레일리아': 9.0}, '밀 수출 비중이 큰', 1, '생산 1위 중국은 수출 상위국이 아니다.', '밀 수출 비중이 작은')
add('farm', 'maize-export', '옥수수 수출 비중 상위국', '%', '2018~2022 평균', '강의 2권 P06', {'미국': 30.3, '아르헨티나': 17.5, '브라질': 17.1, '우크라이나': 13.6}, '옥수수 수출 비중이 큰', 1, '아르헨티나와 브라질은 근소한 차이.', '옥수수 수출 비중이 작은')
add('farm', 'grain-trade', '세계 곡물 수출량', '억 톤', '2018~2022 평균', '강의 2권 P06', {'밀': 2.0, '옥수수': 1.9, '쌀': 0.5}, '수출량이 많은', 1, '쌀은 생산량에 비해 국제 이동량이 매우 작다. 밀과 옥수수는 근소한 차이.', '수출량이 적은')
add('farm', 'sheep-count', '양 사육 두수 상위국', '순위', '2020', '강의 2권 P06 (2023학년도 9월 12번)', {'중국': 5, '인도': 4, '오스트레일리아': 3, '나이지리아': 2, '이란': 1}, '양 사육 두수가 많은', 0, '수치 없이 순위만 제시된 자료. 양모로 유명한 오스트레일리아는 1위가 아니다.', '양 사육 두수가 적은')
add('farm', 'tea-prod', '차 생산 상위국', '순위', '2022', 'FAO 차 정부간 그룹 보고서', {'중국': 2, '인도': 1}, '차 생산이 많은', 0, '중국이 세계 생산의 절반 가까이, 인도 약 20%. 케냐는 아프리카 안에서 비중이 크다.', '차 생산이 적은')

json_text = json.dumps({'rankings': rankings, 'groups': [
    {'id': 'bloc', 'name': '경제 블록'}, {'id': 'continent', 'name': '대륙별 인구·경제'}, {'id': 'country', 'name': '국가 순위'},
    {'id': 'energy', 'name': '에너지·발전'}, {'id': 'farm', 'name': '농업·가축'}, {'id': 'religion', 'name': '종교'}]},
    ensure_ascii=False, indent=1)
open(OUT, 'w', encoding='utf-8').write(
    '/* Generated by scripts/build-rankings.py from World Bank WDI, UN M49, Energy Institute and FAOSTAT\n'
    ' * (via Our World in Data), Pew Research Center, and the revised lectures. Do not edit by hand. */\n'
    '(function(root,data){if(typeof module===\'object\'&&module.exports)module.exports=data;else root.WGRankings=data})'
    '(typeof globalThis!==\'undefined\'?globalThis:this,' + json_text + ');\n')
print('rankings', len(rankings))
