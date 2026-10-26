"""Extract pinned official tables. Run with CODEX_PRIMARY_RUNTIME_PYTHON; no network."""
from pathlib import Path
import hashlib, html, io, json, re, sys, zipfile
import openpyxl

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT/'data/goal-continuation-source-manifest.json').read_text())
with zipfile.ZipFile(ROOT/manifest['archive']) as z:
    raw = {n:z.read(n) for n in manifest['sources']}
for n,b in raw.items():
    assert hashlib.sha256(b).hexdigest() == manifest['sources'][n]['sha256'], n

# OICA's chart embeds passenger cars and commercial vehicles separately. Missing
# components (-1) are never silently added as zero. Keep three historical columns.
page = raw['oica-production.html'].decode()
cars = {}
for m in re.finditer(r'World Motor Vehicle - Production - (\d{4})</h2>', page):
    year = m[1]
    if year not in ['2010','2012','2014']:
        continue
    body = page[m.end():].split('data-data="',1)[1].split('"',1)[0]
    for name,passenger,commercial in json.loads(html.unescape(body))[1:]:
        ko = {'Germany':'독일','Mexico':'멕시코','China':'중국','Brazil':'브라질'}.get(name)
        if not ko:
            continue
        assert passenger >= 0 and commercial >= 0, (name,year)
        cars.setdefault(ko,{})[year] = {'passenger':passenger,'commercial':commercial,'total':passenger+commercial}
assert all(set(v)=={'2010','2012','2014'} for v in cars.values())

# F20 is DEGURBA city population, NOT the administrative municipality or the
# old WUP 2018 urban agglomeration. The denominator comes from the same 2025
# revision: F14 urban + rural, with the original thousand-person unit restored.
book = openpyxl.load_workbook(io.BytesIO(raw['wup2025-capitals.xlsx']), read_only=True, data_only=True)
rows = book['Data'].values
headers = next(rows)
urban = json.loads((ROOT/'data/urbanization-change.json').read_text())
want = {'Brazil':('브라질','브라질리아'),'Argentina':('아르헨티나','부에노스아이레스'),'Peru':('페루','리마')}
capitals = {}
for r in rows:
    d = dict(zip(headers,r))
    if d['Location'] not in want or d['Capital_Type'] != 'National capital':
        continue
    ko,capital = want[d['Location']]
    s = urban['areas'][ko]['series']
    u,rural = s['urbanPopulation']['2025']/1000,s['ruralPopulation']['2025']/1000
    assert 0 < d['Pop2025'] < u+rural
    capitals[ko] = {'capital':capital,'sourceName':d['City_Name'],'capitalPopulation':d['Pop2025'], 'urban':u,'rural':rural,'year':2025}
assert set(capitals)=={x[0] for x in want.values()}

ko = {'JPN':'일본','IND':'인도','NER':'니제르','TCD':'차드','TUR':'튀르키예','USA':'미국','BRA':'브라질','DEU':'독일'}
rates = {}
for field in ['birth','death']:
    for r in json.loads(raw['wb-'+field+'.json'])[1]:
        assert r['date']=='2023' and isinstance(r['value'],(float,int))
        rates.setdefault(ko[r['countryiso3code']],{})[field] = r['value']
assert all(set(x)=={'birth','death'} for x in rates.values())
result = {'sources':manifest,'cars':{'years':[2010,2012,2014],'unit':'대','scope':'승용차+상용차, 국내 생산','countries':cars},
          'capitals':{'year':2025,'unit':'천 명','definition':'수도 = WUP2025 F20 DEGURBA City; 도시·촌락 = WUP2025 F14 국가별 정의. 도시+촌락으로 국가 총인구를 계산하며 수도를 다시 더하지 않는다. 2018년 기출 원자료의 재현이 아니다.','countries':capitals},
          'rates':{'year':2023,'unit':'‰','countries':rates}}
# Curated original exam quantities, explicitly scoped to their original year.
result['capitals2018']={'year': 2018, 'unit': '천 명', 'definition': '강의 1권 P05의 2018년 남아메리카 수도 인구 제시 자료. 수도 범위는 해당 자료를 따르며 현재 행정 경계·2025 DEGURBA 자료와 섞지 않는다.', 'countries': {'브라질': {'capital': '브라질리아', 'capitalPopulation': 4470, 'urban': 182550, 'rural': 28320, 'year': 2018}, '콜롬비아': {'capital': '보고타', 'capitalPopulation': 10570, 'urban': 39960, 'rural': 9510, 'year': 2018}, '칠레': {'capital': '산티아고', 'capitalPopulation': 6680, 'urban': 15930, 'rural': 2260, 'year': 2018}, '우루과이': {'capital': '몬테비데오', 'capitalPopulation': 1740, 'urban': 3310, 'rural': 160, 'year': 2018}}}
result['dependency1955']={'차드': [39.5, 4.1, 47.6, 2.5], '튀르키예': [40.7, 3.2, 25.6, 7.8]}
target = ROOT/'data/goal-continuation-source.json'
text = json.dumps(result,ensure_ascii=False,indent=1)+'\n'
if '--check' in sys.argv:
    assert target.read_text()==text, 'goal-continuation-source.json is stale'
else:
    target.write_text(text)
print('공식 원자료: 자동차 4국×3시점, 수도 3국, 출생·사망률 8국')
