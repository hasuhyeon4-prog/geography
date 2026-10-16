"""Publish the reviewed, dated statistics snapshot; never silently mix years.

Usage: python3 scripts/build-rankings.py [LEGACY_DATA_DIR] [OUTPUT]
The legacy data directory argument is accepted for compatibility, but is not read.
To update statistics, review audit/statistics-20261017.json against its cited
sources first. This build only formats that versioned snapshot.
"""
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / 'audit/statistics-20261017.json'
OUT = Path(sys.argv[-1]) if len(sys.argv) > 1 else ROOT / 'assets/rankings.js'
data = json.loads(SNAPSHOT.read_text(encoding='utf-8'))
rankings = []
for rid, record in data['rankings'].items():
    base = dict(record['base'])
    assert base['id'] == rid
    assert base['year'] and base['source'] and record['sourceUrls']
    base['audit'] = {k: v for k, v in record.items() if k != 'base'}
    rankings.append(base)
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
