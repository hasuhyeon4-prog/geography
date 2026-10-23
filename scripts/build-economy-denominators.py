#!/usr/bin/env python3
"""Reproduce the same-year conditional share from committed WDI input; stdlib only."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def build():
    source = ROOT / 'data/economy-indicators.json'
    economy = json.loads(source.read_text())
    countries = {}
    for name, c in economy['countries'].items():
        a = c['series'].get('manufacturing', {})
        b = c['series'].get('industry', {})
        series = {y: v / b[y] * 100 for y, v in a.items()
                  if v is not None and b.get(y, 0) is not None and b.get(y, 0) > 0 and 0 <= v <= b[y]}
        countries[name] = {'series': series, 'value': series.get(economy['meta']['baseYear'])}
    return {'about': '2차 산업 GDP 중 제조업 부가가치의 비중. 같은 해의 WDI 제조업/GDP ÷ 산업/GDP × 100. 광업·건설업 등을 포함하는 기존 WDI 산업 분모를 유지한다.',
            'year': economy['meta']['baseYear'], 'unit': '%',
            'sourceFile': 'data/economy-indicators.json',
            'sourceSHA256': hashlib.sha256(source.read_bytes()).hexdigest(),
            'sourceIndicators': ['NV.IND.MANF.ZS', 'NV.IND.TOTL.ZS'],
            'lecture': ['L2-B0608', 'L2-B0609', 'L2-B0610'], 'countries': countries}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    path = ROOT / 'data/economy-denominator-series.json'
    content = json.dumps(build(), ensure_ascii=False, indent=2) + '\n'
    if args.check:
        if path.read_text() != content:
            raise SystemExit('economy denominator data differ; rebuild required')
        print('economy denominators: exact reproduction passed')
    else:
        path.write_text(content)
        print('wrote', path)

if __name__ == '__main__':
    main()
