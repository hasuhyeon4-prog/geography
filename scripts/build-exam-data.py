"""Turn raw statistics downloads into the committed inputs of the 기출형 framework.

Usage: python3 -I scripts/build-exam-data.py RAW_DIR

RAW_DIR must contain (the same files scripts/build-rankings.py reads):
  wb_<indicator>.json  World Bank API, country/all, date=2018:2024, per_page=20000
  owid_energy.csv      https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv
Writes:
  data/country-indicators.json  one year (YEAR) per indicator, no silent fallback to other years
  data/electricity-mix.json     share of electricity generation by source, YEAR

Only the 139 countries drawn on the app's map are kept (assets/country-boundaries.js).
Area and density are deliberately absent: WDI surface area differs from the UN
Demographic Yearbook for some countries (e.g. Canada), see audit/REVIEW-20261017.md.
"""
import csv, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = Path(sys.argv[1])
YEAR = '2023'

boundaries = (ROOT / 'assets/country-boundaries.js').read_text(encoding='utf-8')
codes = dict(re.findall(r'"([^"]+)":\{"code":"([A-Z]{3})"', boundaries))
if len(codes) < 100:
    raise SystemExit('could not read country codes from assets/country-boundaries.js')

def wb(code):
    rows = json.load(open(RAW / f'wb_{code}.json'))[1]
    return {r['countryiso3code']: r['value'] for r in rows if r['date'] == YEAR and r['value'] is not None}

pop, urban, old, young = wb('SP.POP.TOTL'), wb('SP.URB.TOTL'), wb('SP.POP.65UP.TO'), wb('SP.POP.0014.TO')
cbr, cdr, gdp, netmig = wb('SP.DYN.CBRT.IN'), wb('SP.DYN.CDRT.IN'), wb('NY.GDP.MKTP.CD'), wb('SM.POP.NETM')
exports = wb('TX.VAL.MRCH.CD.WT')

countries = {}
for name, iso in sorted(codes.items()):
    p = pop.get(iso)
    row = {}
    if p:
        row['pop'] = round(p / 1e4)                       # 만 명
        if iso in urban: row['urban'] = round(urban[iso] / p * 100, 1)
        if iso in old: row['old'] = round(old[iso] / p * 100, 1)
        if iso in young: row['young'] = round(young[iso] / p * 100, 1)
        if iso in gdp: row['gdppc'] = round(gdp[iso] / p / 1e3, 2)   # 천 달러
    if iso in cbr and iso in cdr: row['nir'] = round(cbr[iso] - cdr[iso], 1)
    if iso in gdp: row['gdp'] = round(gdp[iso] / 1e9, 1)            # 십억 달러
    if iso in netmig: row['netmig'] = round(netmig[iso] / 1e4, 1)   # 만 명
    if iso in exports: row['exports'] = round(exports[iso] / 1e9, 1)  # 십억 달러
    countries[name] = {'iso3': iso, 'values': row}

meta = {
    'year': YEAR, 'source': '세계은행 WDI', 'retrieved': '2026-10-16',
    'sourceUrl': 'https://api.worldbank.org/v2/country/all/indicator/{code}?date=2018:2024&format=json',
    'indicators': {
        'pop': ['SP.POP.TOTL', '만 명'], 'urban': ['SP.URB.TOTL ÷ SP.POP.TOTL', '%'],
        'old': ['SP.POP.65UP.TO ÷ SP.POP.TOTL', '%'], 'young': ['SP.POP.0014.TO ÷ SP.POP.TOTL', '%'],
        'nir': ['SP.DYN.CBRT.IN − SP.DYN.CDRT.IN', '‰'], 'gdp': ['NY.GDP.MKTP.CD', '십억 달러'],
        'gdppc': ['NY.GDP.MKTP.CD ÷ SP.POP.TOTL', '천 달러'], 'netmig': ['SM.POP.NETM', '만 명'],
        'exports': ['TX.VAL.MRCH.CD.WT', '십억 달러'],
    },
}
(ROOT / 'data').mkdir(exist_ok=True)
json.dump({'meta': meta, 'countries': countries}, open(ROOT / 'data/country-indicators.json', 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)

energy = [r for r in csv.DictReader(open(RAW / 'owid_energy.csv', encoding='utf-8')) if r['year'] == YEAR]
by_iso = {r['iso_code']: r for r in energy if r['iso_code']}
sources = ['coal', 'gas', 'oil', 'nuclear', 'hydro', 'wind', 'solar']
mix = {}
for name, iso in sorted(codes.items()):
    r = by_iso.get(iso)
    if not r or not all(r.get(s + '_share_elec') for s in sources):
        continue
    shares = {s: round(float(r[s + '_share_elec']), 1) for s in sources}
    shares['other'] = round(max(0.0, 100 - sum(shares.values())), 1)  # bioenergy and other renewables
    mix[name] = shares
json.dump({'meta': {'year': YEAR, 'source': 'Ember·Energy Institute (Our World in Data)', 'retrieved': '2026-10-16',
                    'sourceUrl': 'https://github.com/owid/energy-data', 'unit': '% of electricity generation'},
           'countries': mix}, open(ROOT / 'data/electricity-mix.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('countries', len(countries), 'electricity', len(mix))
