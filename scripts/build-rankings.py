"""Publish the reviewed, dated statistics snapshot; never silently mix years.

Usage: python3 scripts/build-rankings.py [LEGACY_DATA_DIR] [OUTPUT]
The legacy data directory argument is accepted for compatibility, but is not read.
To update statistics, review audit/statistics-20261017.json against its cited
sources first. This build formats that versioned snapshot and adds one check: each
farm table's order is compared year by year with the FAOSTAT series in
data/agriculture.json (2015~2024). A pair whose order changes in any year joins the
table's unstablePairs, so quizzes skip it and the page marks it.
"""
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / 'audit/statistics-20261017.json'
OUT = Path(sys.argv[-1]) if len(sys.argv) > 1 else ROOT / 'assets/rankings.js'
data = json.loads(SNAPSHOT.read_text(encoding='utf-8'))
AGRI = json.loads((ROOT / 'data/agriculture.json').read_text(encoding='utf-8'))
# Farm table → FAOSTAT series of its items. Shares divide every item by the same total in a
# year, so comparing the series compares the shares. '{}' takes the item name (a crop).
FAO = {
    'maize-prod': 'qcl-production:옥수수', 'wheat-prod': 'qcl-production:밀', 'rice-prod': 'qcl-production:쌀',
    'coffee-prod': 'qcl-production:커피', 'cocoa-prod': 'qcl-production:카카오', 'tea-prod': 'qcl-production:차(생엽)',
    'cattle-count': 'qcl-stocks:소', 'pig-count': 'qcl-stocks:돼지', 'sheep-count': 'qcl-stocks:양',
    'wheat-export': 'tcl-exports:밀', 'maize-export': 'tcl-exports:옥수수',
    'maize-cont': 'qcl-production:옥수수', 'wheat-cont': 'qcl-production:밀', 'rice-cont': 'qcl-production:쌀',
    'grain-world': 'qcl-production:{}', 'grain-trade': 'fbs-exports:{}',
}
WINDOW, MIN_YEARS = (2015, 2024), 8


def fao_series(area, key):
    codes = AGRI['entities'][area]['areaCodes']
    cols = [AGRI['seriesByArea'].get(c, {}).get(key, {}) for c in codes]
    years = [y for y in cols[0] if all(y in c for c in cols) and WINDOW[0] <= int(y) <= WINDOW[1]]
    return {y: sum(c[y] for c in cols) for y in years}


def yearly(rid, items):
    key = FAO[rid]
    series = {}
    for it in items:
        name = it['name'].replace('쌀(벼)', '쌀')
        series[it['name']] = fao_series('세계', key.format(name)) if '{}' in key else fao_series(name, key) if name in AGRI['entities'] else {}
    flips = []
    for i, a in enumerate(items):
        for b in items[i + 1:]:
            sa, sb = series[a['name']], series[b['name']]
            years = sorted(y for y in sa if y in sb)
            if len(years) < MIN_YEARS:
                continue
            bad = [y for y in years if sa[y] <= sb[y]]
            if bad:
                flips.append({'pair': [a['name'], b['name']], 'years': bad, 'of': len(years)})
    return flips


rankings = []
for rid, record in data['rankings'].items():
    base = dict(record['base'])
    assert base['id'] == rid
    assert base['year'] and base['source'] and record['sourceUrls']
    base['audit'] = {k: v for k, v in record.items() if k != 'base'}
    if rid in FAO:
        flips = yearly(rid, base['items'])
        pairs = [list(p) for p in base['audit']['unstablePairs']]
        for f in flips:
            if not any(set(p) == set(f['pair']) for p in pairs):
                pairs.append(f['pair'])
        base['audit']['unstablePairs'] = pairs
        domain = {'qcl': 'FAOSTAT 생산·사육 통계', 'tcl': 'FAOSTAT 교역 통계', 'fbs': 'FAOSTAT 식량 수급표'}[FAO[rid][:3]]
        base['audit']['yearly'] = {'source': domain, 'window': '%d~%d' % WINDOW, 'flips': flips}
    rankings.append(base)
comparison = json.loads((ROOT / 'data/renewable-capacity-comparison.json').read_text())
for field, rid, title, unit in [('capacityMW','renewable-capacity-six','재생에너지 설비 용량 — 제시 6개국','MW'),('generationGWh','renewable-generation-six','재생에너지 발전량 — 제시 6개국','GWh')]:
    rows = sorted(comparison['countries'].items(), key=lambda x: -x[1][field])
    rankings.append({'id':rid,'group':'energy','title':title,'unit':unit,'year':'2023','source':'IRENA Renewable Energy Statistics 2025','phrase':title+'이 큰','low':title+'이 작은','digits':0,'items':[{'name':n,'value':v[field]} for n,v in rows],'scope':comparison['scope'],'note':'독일은 캐나다보다 설비 용량이 크지만 연간 발전량은 작다. 제시 국가 내 순위이며 세계 상위 6개국이 아니다.','audit':{'checkedAt':'2026-10-25','status':'checked','sourceUrls':[comparison['source']['url']],'unstablePairs':[]}})
groups = [{'id': k, 'name': v} for k, v in [
    ('bloc', '경제 블록'), ('continent', '대륙별 인구·경제'), ('country', '국가 순위'),
    ('energy', '에너지·발전'), ('farm', '농업·가축'), ('religion', '종교')]]
payload = json.dumps({'checkedAt': data['checkedAt'], 'rankings': rankings, 'groups': groups}, ensure_ascii=False, indent=1)
OUT.write_text(
    '/* Generated from the reviewed snapshot in audit/statistics-20261017.json.\n'
    ' * Dates, editions, coverage and comparison sources are explicit. */\n'
    "(function(root,data){if(typeof module==='object'&&module.exports)module.exports=data;else root.WGRankings=data})"
    "(typeof globalThis!=='undefined'?globalThis:this," + payload + ');\n', encoding='utf-8')
print('rankings', len(rankings))
