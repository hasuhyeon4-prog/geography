"""Build same-year industry and merchandise-export inputs from WDI downloads.

Usage: python3 scripts/build-economy-data.py RAW_DIR
The base country file supplies ISO codes and the displayed 2023 merchandise total.
No missing year/category is filled from a different year or treated as zero.
WDI's SITC manufactured-goods category is not a synonym for secondary-industry
GDP or employment; precious stones can be classified here. Keep the source labels.
"""
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = Path(sys.argv[1])
BASE = '2023'
INDICATORS = {
    'manufacturing': 'NV.IND.MANF.ZS',
    'agriculture': 'NV.AGR.TOTL.ZS',
    'industry': 'NV.IND.TOTL.ZS',
    'services': 'NV.SRV.TOTL.ZS',
    'industryEmployment': 'SL.IND.EMPL.ZS',
}
EXPORTS = {
    'fuel': 'TX.VAL.FUEL.ZS.UN',
    'ores': 'TX.VAL.MMTL.ZS.UN',
    'food': 'TX.VAL.FOOD.ZS.UN',
    'agriculturalRaw': 'TX.VAL.AGRI.ZS.UN',
    'manufactures': 'TX.VAL.MANF.ZS.UN',
}
sources = {}
data = {}
for code in list(INDICATORS.values()) + list(EXPORTS.values()):
    p = RAW / f'wb_{code}.json'
    b = p.read_bytes()
    meta, rows = json.loads(b)
    sources[code] = {
        'url': f'https://api.worldbank.org/v2/country/all/indicator/{code}?date=2010:2025&format=json&per_page=30000',
        'lastUpdated': meta['lastupdated'], 'sha256': hashlib.sha256(b).hexdigest(),
    }
    by = {}
    for r in rows:
        if r['value'] is not None and '2010' <= r['date'] <= '2025':
            by.setdefault(r['countryiso3code'], {})[r['date']] = r['value']
    data[code] = by

base = json.loads((ROOT / 'data/country-indicators.json').read_text())
if base['meta']['baseYear'] != BASE:
    raise ValueError('industry shares and merchandise totals need the same displayed year')
countries = {}
exports = {}
for name, c in base['countries'].items():
    iso = c['iso3']
    series = {key: {y: round(v, 2) for y, v in data[code].get(iso, {}).items()}
              for key, code in INDICATORS.items()}
    countries[name] = {'values': {k: v[BASE] for k, v in series.items() if BASE in v}, 'series': series}
    years = set.intersection(*(set(data[code].get(iso, {})) for code in EXPORTS.values()))
    mixes = {}
    for y in sorted(years):
        v = {key: round(data[code][iso][y], 2) for key, code in EXPORTS.items()}
        # Overlap or inconsistent reporters must never turn into a plausible composition.
        if min(v.values()) < 0 or sum(v.values()) > 100.5:
            continue
        v['other'] = round(max(0, 100 - sum(v.values())), 2)
        mixes[y] = v
    if BASE in mixes and 'exports' in c['values']:
        exports[name] = {'values': mixes[BASE], 'series': mixes, 'total': c['values']['exports']}

out = {
    'meta': {'baseYear': BASE, 'source': '세계은행 WDI · UN Comtrade(SITC)', 'retrieved': '2026-10-19',
             'indicators': INDICATORS, 'exportIndicators': EXPORTS, 'rawSources': sources,
             'note': '제조업 부가가치·2차 산업 부가가치·2차 산업 고용은 서로 다른 지표. 수출 구성은 SITC 분류이며 GDP 구성이 아니다.'},
    'countries': countries, 'exports': exports,
}
(ROOT / 'data/economy-indicators.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
print('economy countries', len(countries), 'complete export compositions', len(exports))
