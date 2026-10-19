"""Turn raw statistics downloads into the committed inputs of the 기출형 framework.

Usage: python3 -I scripts/build-exam-data.py RAW_DIR

RAW_DIR must contain
  wb_<indicator>.json  World Bank API, country/all, date=2010:2025, per_page=30000, for
                       SP.POP.TOTL NY.GDP.MKTP.CD SP.URB.TOTL SP.DYN.CBRT.IN SP.DYN.CDRT.IN
                       SP.POP.65UP.TO SP.POP.0014.TO SM.POP.NETM TX.VAL.MRCH.CD.WT TM.VAL.MRCH.CD.WT
  owid_energy.csv      https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv
  m49.html             https://unstats.un.org/unsd/methodology/m49/overview/ (continent of each ISO3)
  pew_religion_percentages.csv  'Religious Composition 2010-2020 (percentages).csv' from
                       https://www.pewresearch.org/wp-content/uploads/sites/20/2025/06/Religious-Composition-2010-2020-dataset.zip
Writes
  data/country-indicators.json  BASE_YEAR values for display, plus yearly series for the
                                multi-year check of every recalled comparison
  data/group-series.json        the same series aggregated for the 4 blocs (2023 members fixed)
                                and the 6 continents (UN M49; 앵글로아메리카 = Northern America)
  data/electricity-mix.json     electricity shares, BASE_YEAR plus yearly series
  data/religion-composition.json  Pew shares for 2010 and 2020 with Pew's own population of the
                                same year, so share × total never mixes years or sources

Only the 139 countries drawn on the app's map are kept as countries; group totals use every
economy in the bloc or continent. A group-year is dropped when countries with data hold less
than COVERAGE of the group's population, so missing reporters never pass for a real total.
Area and density are absent here: WDI surface area differs from the UN Demographic Yearbook
for some countries (e.g. Canada), see audit/REVIEW-20261017.md.
"""
import csv, html as H, json, re, sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = Path(sys.argv[1])
BASE_YEAR, FIRST, LAST = '2023', 2010, 2025
YEARS = [str(y) for y in range(FIRST, LAST + 1)]
COVERAGE = 0.95
RETRIEVED = '2026-10-19'

boundaries = (ROOT / 'assets/country-boundaries.js').read_text(encoding='utf-8')
codes = dict(re.findall(r'"([^"]+)":\{"code":"([A-Z]{3})"', boundaries))
if len(codes) < 100:
    raise SystemExit('could not read country codes from assets/country-boundaries.js')

def wb(code):
    out = defaultdict(dict)
    for r in json.load(open(RAW / f'wb_{code}.json'))[1]:
        if r['value'] is not None and r['date'] in YEARS:
            out[r['countryiso3code']][r['date']] = r['value']
    return out
W = {k: wb(k) for k in ['SP.POP.TOTL', 'NY.GDP.MKTP.CD', 'SP.URB.TOTL', 'SP.DYN.CBRT.IN', 'SP.DYN.CDRT.IN',
                         'SP.POP.65UP.TO', 'SP.POP.0014.TO', 'SM.POP.NETM', 'TX.VAL.MRCH.CD.WT', 'TM.VAL.MRCH.CD.WT']}
POP = W['SP.POP.TOTL']

def country_year(iso, y):
    """Indicators of one economy in one year, in the units the app displays."""
    p = POP[iso].get(y)
    row = {}
    if p:
        row['pop'] = p / 1e4                                                   # 만 명
        for key, code in [('urban', 'SP.URB.TOTL'), ('old', 'SP.POP.65UP.TO'), ('young', 'SP.POP.0014.TO')]:
            if y in W[code][iso]: row[key] = W[code][iso][y] / p * 100           # %
        if y in W['NY.GDP.MKTP.CD'][iso]: row['gdppc'] = W['NY.GDP.MKTP.CD'][iso][y] / p / 1e3  # 천 달러
    if y in W['SP.DYN.CBRT.IN'][iso] and y in W['SP.DYN.CDRT.IN'][iso]:
        row['nir'] = W['SP.DYN.CBRT.IN'][iso][y] - W['SP.DYN.CDRT.IN'][iso][y]  # ‰
    if y in W['NY.GDP.MKTP.CD'][iso]: row['gdp'] = W['NY.GDP.MKTP.CD'][iso][y] / 1e9  # 십억 달러
    if y in W['TX.VAL.MRCH.CD.WT'][iso]: row['exports'] = W['TX.VAL.MRCH.CD.WT'][iso][y] / 1e9
    return row

DIGITS = {'pop': 0, 'urban': 1, 'old': 1, 'young': 1, 'gdppc': 2, 'nir': 1, 'gdp': 1, 'exports': 1}
countries = {}
for name, iso in sorted(codes.items()):
    base = country_year(iso, BASE_YEAR)
    series = defaultdict(dict)
    for y in YEARS:
        for k, v in country_year(iso, y).items():
            series[k][y] = round(v, DIGITS[k])
    countries[name] = {'iso3': iso, 'values': {k: round(v, DIGITS[k]) for k, v in base.items()}, 'series': dict(series)}

meta = {
    'baseYear': BASE_YEAR, 'years': [YEARS[0], YEARS[-1]], 'source': '세계은행 WDI', 'retrieved': RETRIEVED,
    'sourceUrl': 'https://api.worldbank.org/v2/country/all/indicator/{code}?date=2010:2025&format=json',
    'indicators': {
        'pop': ['SP.POP.TOTL', '만 명'], 'urban': ['SP.URB.TOTL ÷ SP.POP.TOTL', '%'],
        'old': ['SP.POP.65UP.TO ÷ SP.POP.TOTL', '%'], 'young': ['SP.POP.0014.TO ÷ SP.POP.TOTL', '%'],
        'nir': ['SP.DYN.CBRT.IN − SP.DYN.CDRT.IN', '‰'], 'gdp': ['NY.GDP.MKTP.CD', '십억 달러'],
        'gdppc': ['NY.GDP.MKTP.CD ÷ SP.POP.TOTL', '천 달러'], 'exports': ['TX.VAL.MRCH.CD.WT', '십억 달러'],
    },
}
(ROOT / 'data').mkdir(exist_ok=True)
json.dump({'meta': meta, 'countries': countries}, open(ROOT / 'data/country-indicators.json', 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)

# --- groups: blocs with 2023 members, continents by UN M49 ---
page = (RAW / 'm49.html').read_text(encoding='utf-8')
table = page[page.find('id = "downloadTableEN"'):]
table = table[:table.find('</table>')]
continent = {}
for tr in re.findall(r'<tr>(.*?)</tr>', table, re.S)[1:]:
    cells = [H.unescape(re.sub('<.*?>', '', x)).strip() for x in re.findall(r'<td>(.*?)</td>', tr, re.S)]
    if len(cells) < 12 or not cells[11] or not cells[3]:
        continue
    region = cells[3]
    if region == 'Americas':
        region = 'Northern America' if cells[5] == 'Northern America' else 'Latin America'
    continent[cells[11]] = region
CONT_KO = {'Asia': '아시아', 'Africa': '아프리카', 'Europe': '유럽', 'Latin America': '라틴 아메리카',
           'Northern America': '앵글로아메리카', 'Oceania': '오세아니아'}
groups = {
    'EU': 'AUT BEL BGR HRV CYP CZE DNK EST FIN FRA DEU GRC HUN IRL ITA LVA LTU LUX MLT NLD POL PRT ROU SVK SVN ESP SWE'.split(),
    'USMCA': 'USA CAN MEX'.split(), 'ASEAN': 'BRN KHM IDN LAO MYS MMR PHL SGP THA VNM'.split(),
    'MERCOSUR': 'BRA ARG PRY URY'.split(),
}
for iso, region in continent.items():
    if iso in POP:
        groups.setdefault(CONT_KO[region], []).append(iso)

def group_year(members, y):
    pop = {i: POP[i][y] for i in members if y in POP[i]}
    total = sum(pop.values())
    if not total:
        return {}
    def covered(code_or_codes):
        cs = code_or_codes if isinstance(code_or_codes, list) else [code_or_codes]
        have = [i for i in pop if all(y in W[c][i] for c in cs)]
        return have if sum(pop[i] for i in have) >= COVERAGE * total else None
    out = {'pop': total}
    for key, code in [('urban', 'SP.URB.TOTL'), ('old', 'SP.POP.65UP.TO'), ('young', 'SP.POP.0014.TO')]:
        have = covered(code)
        if have: out[key] = sum(W[code][i][y] for i in have) / sum(pop[i] for i in have) * 100
    have = covered(['SP.DYN.CBRT.IN', 'SP.DYN.CDRT.IN'])
    if have: out['nir'] = sum((W['SP.DYN.CBRT.IN'][i][y] - W['SP.DYN.CDRT.IN'][i][y]) * pop[i] for i in have) / sum(pop[i] for i in have)
    have = covered('NY.GDP.MKTP.CD')
    if have:
        out['gdp'] = sum(W['NY.GDP.MKTP.CD'][i][y] for i in have)
        out['gdppc'] = out['gdp'] / sum(pop[i] for i in have)
    have = covered(['TX.VAL.MRCH.CD.WT', 'TM.VAL.MRCH.CD.WT'])
    if have: out['trade'] = sum(W['TX.VAL.MRCH.CD.WT'][i][y] + W['TM.VAL.MRCH.CD.WT'][i][y] for i in have)
    have = covered('SM.POP.NETM')
    if have: out['netmig'] = sum(W['SM.POP.NETM'][i][y] for i in have)
    return out

group_series = {}
for g, members in groups.items():
    series = defaultdict(dict)
    for y in YEARS:
        for k, v in group_year(members, y).items():
            series[k][y] = v
    group_series[g] = {'members': len(members), 'series': dict(series)}
json.dump({'meta': {'source': '세계은행 WDI', 'retrieved': RETRIEVED, 'coverage': COVERAGE, 'years': [YEARS[0], YEARS[-1]],
                    'units': {'pop': '명', 'gdp': '달러', 'gdppc': '달러', 'trade': '달러', 'netmig': '명', 'urban': '%', 'old': '%', 'young': '%', 'nir': '‰'},
                    'blocMembers': '2023년 회원 고정: EU 27, USMCA 3, ASEAN 10, MERCOSUR 4',
                    'continents': 'UN M49, 러시아는 유럽, 앵글로아메리카 = Northern America'},
           'groups': group_series}, open(ROOT / 'data/group-series.json', 'w', encoding='utf-8'), ensure_ascii=False)

# --- electricity shares ---
energy = [r for r in csv.DictReader(open(RAW / 'owid_energy.csv', encoding='utf-8')) if r['iso_code']]
SOURCES = ['coal', 'gas', 'oil', 'nuclear', 'hydro', 'wind', 'solar']
by = defaultdict(dict)
for r in energy:
    if r['year'] in YEARS and all(r.get(s + '_share_elec') for s in SOURCES):
        shares = {s: round(float(r[s + '_share_elec']), 1) for s in SOURCES}
        shares['other'] = round(max(0.0, 100 - sum(shares.values())), 1)  # bioenergy, geothermal and other
        by[r['iso_code']][r['year']] = shares
mix = {name: {'values': by[iso][BASE_YEAR], 'series': by[iso]} for name, iso in sorted(codes.items()) if BASE_YEAR in by.get(iso, {})}
json.dump({'meta': {'baseYear': BASE_YEAR, 'source': 'Ember·Energy Institute (Our World in Data)', 'retrieved': '2026-10-16',
                    'sourceUrl': 'https://github.com/owid/energy-data', 'unit': '% of electricity generation'},
           'countries': mix}, open(ROOT / 'data/electricity-mix.json', 'w', encoding='utf-8'), ensure_ascii=False)

# --- religion: Pew 2010 and 2020, names as in audit/religion-2020.json ---
PEW = {'christianity': 'Christians', 'islam': 'Muslims', 'hinduism': 'Hindus', 'buddhism': 'Buddhists',
       'judaism': 'Jews', 'unaffiliated': 'Religiously_unaffiliated', 'other': 'Other_religions'}
pew = {(r['Country'], r['Year']): r for r in csv.DictReader(open(RAW / 'pew_religion_percentages.csv', encoding='utf-8-sig'))}
names = json.load(open(ROOT / 'audit/religion-2020.json', encoding='utf-8'))['countries']
religion = {}
for name, entry in sorted(names.items()):
    series, population = {}, {}
    for y in ['2010', '2020']:
        r = pew[(entry['country'], y)]
        series[y] = {k: round(float(r[c]), 1) for k, c in PEW.items()}
        population[y] = round(float(r['Population']) / 1e4)  # 만 명
    religion[name] = {'values': series['2020'], 'population': population['2020'], 'series': series, 'populationSeries': population}
json.dump({'meta': {'baseYear': '2020', 'years': ['2010', '2020'], 'source': 'Pew Research Center (2025)', 'retrieved': RETRIEVED,
                    'sourceUrl': 'https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/',
                    'unit': '% of population', 'populationUnit': '만 명',
                    'about': '비율과 총인구는 모두 Pew의 같은 연도 추정치이다.'},
           'countries': religion}, open(ROOT / 'data/religion-composition.json', 'w', encoding='utf-8'), ensure_ascii=False)
print('countries', len(countries), 'groups', len(group_series), 'electricity', len(mix), 'religion', len(religion))
