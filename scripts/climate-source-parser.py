#!/usr/bin/env python3
"""Build the climate handoff from pinned, public station normals (stdlib only).

No grids, estimated missing months, Tmax/Tmin averages, or mixed normal periods.
Run from any directory: python3 scripts/build-climate-data.py [--check]
"""
import argparse
import csv
import hashlib
import html
import io
import json
import math
import re
import zipfile
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def source_bytes(src):
    # The archive preserves the original CRLF and whitespace for source hashes.
    with zipfile.ZipFile(ROOT/'data/climate-source-snapshots.zip') as archive:
        return archive.read(src['path'])


def number(value):
    s = value.strip().replace(',', '')
    if not s or s in {'---', '-', '-999.9', '-9999', '-999.0', '-9999.0'}:
        return None
    v = float(s)
    if not math.isfinite(v):
        raise ValueError(value)
    return v


def dms(s):
    parts = re.fullmatch(r'(\d+)\|(\d+)\|([\d. ]*)\|?([NSEW])', s).groups()
    # Blank seconds mean coordinates supplied to minute precision.
    value = float(parts[0]) + float(parts[1]) / 60 + float(parts[2].strip() or '0') / 3600
    return round(value * (-1 if parts[3] in {'S', 'W'} else 1), 6)


def distance(point, station):
    a, b = map(math.radians, [point[1], station['latitude']])
    dl = math.radians(point[0] - station['longitude'])
    v = math.sin((a-b)/2)**2 + math.cos(a)*math.cos(b)*math.sin(dl/2)**2
    return round(12742 * math.asin(min(1, math.sqrt(v))), 1)


class Rows(HTMLParser):
    def __init__(self, s):
        super().__init__(convert_charrefs=True)
        self.rows = []
        self.row = None
        self.cell = None
        self.feed(s)

    def handle_starttag(self, tag, attrs):
        if tag == 'tr':
            self.row = []
        if tag in {'td', 'th'} and self.row is not None:
            self.cell = ''

    def handle_data(self, s):
        if self.cell is not None:
            self.cell += s

    def handle_endtag(self, tag):
        if tag in {'td', 'th'} and self.cell is not None:
            self.row.append(' '.join(self.cell.split()))
            self.cell = None
        if tag == 'tr' and self.row is not None:
            self.rows.append(self.row)
            self.row = None


def wmo(s):
    rows = [[x.strip() for x in r] for r in csv.reader(io.StringIO(s))]
    header = next(i for i, r in enumerate(rows) if r[:4] and r[0] == 'WMO_Number' and r[1:3] == ['Latitude', 'Longitude'])
    v = rows[header+1]
    st = {'id': v[0], 'idScheme': 'source-station-id', 'latitude': dms(v[1]), 'longitude': dms(v[2]), 'elevationM': number(v[3])}
    st['name'] = next(r[1] for r in rows if r and r[0] == 'Station_Name')
    st['country'] = next(r[1] for r in rows if r and r[0].replace(' ', '').lower() == 'country_name')
    wig = next((r[0] for r in rows if r and re.fullmatch(r'\d+-\d+-\d+-\d+', r[0])), None)
    st['wigosId'] = wig  # Preserve a supplied ID even when it differs from the legacy ID.
    out = {}
    for code, key, calc in [(5, 'temperatureC', 'mean'), (1, 'precipitationMm', 'sum'), (3, 'maximumTemperatureC', 'mean'), (4, 'minimumTemperatureC', 'mean')]:
        candidates = [(i, r) for i, r in enumerate(rows) if len(r) >= 16 and r[1] == str(code) and r[2].lower() == calc]
        if not candidates:
            out[key] = [None]*12
            continue
        if len(candidates) != 1:
            raise ValueError(f'Ambiguous parameter {code}: {st}')
        i, r = candidates[0]
        out[key] = [number(v) for v in r[4:16]]
        out[key+'SourceLine'] = i+1
        out[key+'AnnualSource'] = number(r[16]) if len(r) > 16 else None
        # NOY is read only inside this parameter section: some submissions have
        # mistyped parameter numbers in later, unrelated NOY rows.
        end = next((j for j in range(i+1, len(rows)) if rows[j] and rows[j][0] == 'Parameter_Code'), len(rows))
        yr = next((r for r in rows[i+1:end] if len(r) >= 16 and r[2].lower() == 'noy'), None)
        out[key+'Years'] = [number(v) for v in yr[4:16]] if yr else None
    return st, out


def jma(s, id):
    title = html.unescape(re.sub('<[^>]+>', '', re.search(r'<h3[^>]*>(.*?)</h3>', s, re.S).group(1)))
    pos = re.search(r'Latitude:\s*([\d.]+)°([NS]).*?Longitude:\s*([\d.]+)°([EW]).*?Height:\s*([\d.-]+)', title)
    lat, ns, lon, ew, z = pos.groups()
    st = {'id': id, 'idScheme': 'WMO', 'name': title.split('Latitude:')[0].strip(), 'latitude': float(lat)*(-1 if ns == 'S' else 1), 'longitude': float(lon)*(-1 if ew == 'W' else 1), 'elevationM': number(z)}
    rows = [r for r in Rows(s).rows if len(r) == 3 and r[0].isdigit() and 1 <= int(r[0]) <= 12]
    assert [int(r[0]) for r in rows] == list(range(1, 13)), id
    return st, {'temperatureC': [number(r[1]) for r in rows], 'precipitationMm': [number(r[2]) for r in rows]}


def derived(t, p):
    result = {}
    if all(v is not None for v in t):
        result.update(coldestC=min(t), warmestC=max(t), temperatureRangeC=round(max(t)-min(t), 2),
                      meanOfMonthlyTemperatureC=round(sum(t)/12, 2),
                      coldestMonths=[i+1 for i, v in enumerate(t) if v == min(t)],
                      warmestMonths=[i+1 for i, v in enumerate(t) if v == max(t)])
    if all(v is not None for v in p):
        total = sum(p)
        result.update(annualPrecipitationFromMonthsMm=round(total, 2), driestMonthMm=min(p), wettestMonthMm=max(p),
                      jjaPrecipitationMm=round(sum(p[5:8]), 2), djfPrecipitationMm=round(p[11]+sum(p[:2]), 2))
        result['jjaPrecipitationSharePct'] = round(100*sum(p[5:8])/total, 2) if total else None
        result['djfPrecipitationSharePct'] = round(100*(p[11]+sum(p[:2]))/total, 2) if total else None
    return result


def build():
    sites = json.loads((ROOT/'data/climate-sites.json').read_text())
    sources = json.loads((ROOT/'data/climate-sources/manifest.json').read_text())
    for id, src in sources.items():
        if hashlib.sha256(source_bytes(src)).hexdigest() != src['sha256']:
            raise ValueError('Source changed: '+id)
    result = []
    for site in sites:
        id = site['sourceId']
        issues = []
        out = dict(name=site['name'], mapPoint=site['point'][:2], region=site['point'][2], lectureClimate=site['climate'],
                   normalPeriod=[1991, 2020], sourceId=id, station=None, temperatureC=[None]*12, precipitationMm=[None]*12)
        if not id:
            out.update(status='missing', usage={'temperatureReading': False, 'precipitationReading': False, 'climateGraph': False, 'climateTypeRecall': False})
            issues.append({'code': 'NO_MATCHING_NORMAL', 'detail': '키토의 동일 지점 1991–2020 월평균 기온·강수 평년값을 확인하지 못함. WMO Ecuador 제출은 Rumipamba-Salcedo 한 지점이며 키토가 아님. 1981–2010이나 격자로 대체하지 않음.'})
        else:
            src = sources[id]
            s = source_bytes(src).decode('utf-8-sig')
            if src['kind'] == 'wmo-station-csv':
                st, values = wmo(s)
                out['coverage'] = {'method': 'WMO-submission', 'temperatureYears': values.get('temperatureCYears'), 'precipitationYears': values.get('precipitationMmYears'),
                                   'unreportedYearsPolicy': 'NCEI min24 composite assumes 30 years when NOY is not reported; this is not an independently verified count.'}
            elif src['kind'] == 'jma-station-html':
                st, values = jma(s, id.split('-')[1])
                out['coverage'] = {'method': 'JMA-GHCN-and-CLIMAT', 'temperatureYears': None, 'precipitationYears': None, 'minimumYearsRequiredByProvider': 8,
                                   'detail': '1991–2020 내 월별 최소 8년이 JMA 채택 기준. 이 관측소의 실제 월별 연수는 이 표에 없음. 30년 완전 관측으로 표현하지 않음.'}
            elif id == 'jma-89606':
                rows = list(csv.reader(io.StringIO(s)))
                vals = [r for r in rows if r and r[0].isdigit()]
                assert [int(r[0]) for r in vals] == list(range(1, 13))
                st = {'id': '89606', 'idScheme': 'WMO', 'name': 'VOSTOK', 'latitude': -78.46, 'longitude': 106.87, 'elevationM': 3488, 'metadataSourceId': 'jma-vostok-meta'}
                values = {'temperatureC': [number(r[1]) for r in vals], 'precipitationMm': [number(r[2]) for r in vals]}
                out['coverage'] = {'method': 'JMA-GHCN-and-CLIMAT', 'temperatureYears': None, 'precipitationYears': None, 'minimumYearsRequiredByProvider': 8}
            else:
                assert id == 'eccc-7025250'
                rows = Rows(s).rows
                t = next(r for r in rows if len(r) >= 15 and r[0] == 'Daily Average (°C)')
                p = next(r for r in rows if len(r) >= 15 and r[0] == 'Precipitation (mm)')
                values = {'temperatureC': [number(x) for x in t[1:13]], 'precipitationMm': [number(x) for x in p[1:13]], 'temperatureCAnnualSource': number(t[13]), 'precipitationMmAnnualSource': number(p[13])}
                st = {'id': '7025250', 'idScheme': 'ECCC-composite-climate-id', 'name': 'MONTREAL TRUDEAU (AIRPORT)', 'latitude': 45.466667, 'longitude': -73.75, 'elevationM': 36,
                      'componentStationIds': ['702S006', '7025251', '7025250'], 'componentWmoIds': ['71183', '71627']}
                out['coverage'] = {'method': 'ECCC-composite', 'temperatureCode': t[14], 'precipitationCode': p[14],
                                   'temperatureAnalytics': {'beginYear': 1991, 'endYear': 2020, 'totalYears': 30, 'missingYears': 2, 'observationsPct': 93.8},
                                   'precipitationAnalytics': {'beginYear': 1991, 'endYear': 2020, 'totalYears': 25, 'missingYears': 6, 'observationsPct': 81.7},
                                   'detail': '기온 A(WMO 3-and-5 rule), 강수 C(20년 이상). 서로 다른 관측소를 연결한 공식 composite. 비가 아닌 눈을 포함한 총강수량을 사용.'}
            if id == 'wmo-93110':
                st['submittedCoordinates'] = [st['longitude'], st['latitude']]
                st.update(latitude=-37.0, longitude=174.8, coordinateSourceId='noaa-auckland-meta')
                issues.append({'code': 'COORDINATE_CORRECTED_FROM_SECOND_PRIMARY_SOURCE', 'detail': 'WMO 제출 경도 171.804°E는 NOAA ISD의 동일 관측소 931100 경도 174.800°E와 불일치. 지도 연결 좌표만 ISD로 교체, 월별 기후값은 변경하지 않음.'})
            st['distanceFromMapPointKm'] = distance(site['point'], st)
            out.update(station=st, **{k: v for k, v in values.items() if not k.endswith('Years')})
            complete_t = all(v is not None for v in out['temperatureC'])
            complete_p = all(v is not None for v in out['precipitationMm'])
            good_t = complete_t
            if id == 'wmo-65125':
                good_t = False
                issues.append({'code': 'SUSPECT_SOURCE_TEMPERATURE', 'detail': '아부자 1월 Daily_Mean=35.2℃가 Daily_Maximum=35.2℃와 동일, Daily_Minimum=18.5℃. 월평균 12개 평균 28.85℃와 원자료 연평균 28.0℃도 크게 어긋남. 오기로 의심되나 임의 교정하지 않고 기온/기후 그래프 출제 보류.'})
            if id.startswith('jma-'):
                issues.append({'code': 'MONTHLY_YEAR_COUNTS_UNAVAILABLE', 'detail': '공식 관측소 기반 1991–2020 평년값이나 실제 관측 연수 미표시. 제시 자료 읽기에만 사용하며 정밀한 지점 간 순위를 회상으로 묻지 않음.'})
            if id == 'jma-63450':
                issues.append({'code': 'STATION_HEIGHT_MISSING', 'detail': 'JMA 표의 관측소 고도가 공란. 지도 위치는 아디스아바바에 가깝지만 이 표로 해발 수치 문항을 만들 수 없음.'})
            if id == 'wmo-04419':
                issues.append({'code': 'REGIONAL_PROXY_TEMPERATURE_ONLY', 'detail': '그린란드 내륙이라는 범위의 대표 관측소 Summit Tower, 지도 점에서 약 52km. 강수 미제공; 강수량/계절성/기온-강수 그래프 출제 불가. 제출 WIGOS ID 04418과 legacy station ID 04419를 원문대로 보존.'})
            out['status'] = 'hold' if not good_t and complete_t else ('complete' if complete_t and complete_p else 'partial')
            out['usage'] = {'temperatureReading': good_t, 'precipitationReading': complete_p,
                            'climateGraph': good_t and complete_p, 'climateTypeRecall': False}
            if good_t:
                out['derived'] = derived(out['temperatureC'], out['precipitationMm'])
            else:
                out['derived'] = derived([None]*12, out['precipitationMm'])
            if site['name'] == '마나우스':
                issues.append({'code': 'LECTURE_TYPE_BOUNDARY', 'detail': '강의 분류 Af와 달리 이 관측소의 최건월 56.1mm는 Af의 60mm 경계 아래. 월별 제시 자료는 사용 가능하나 이 자료로 강의 Af를 정답으로 강제하지 않음(Af/Am 경계 민감).'} )
            if site['name'] in {'시안', '디트로이트'}:
                issues.append({'code': 'TEMPERATURE_CLASS_BOUNDARY', 'detail': '온대/냉대의 0℃ 또는 -3℃ 경계와 평년·관측소 선택에 민감. C/D 세부 기후형 단독 판별을 자동 허용하지 않음.'})
            if site['name'] == '로마':
                out['alternativeSourceIds'] = ['wmo-16239']
                issues.append({'code': 'REPRESENTATIVE_STATION_SELECTION', 'detail': '도심과 약 23km 떨어진 Fiumicino 공항. 더 가까운 Ciampino는 6~8월 강수 평년값이 공란이라 제외. 두 관측소의 월별 값을 섞지 않음.'})
            if site['name'] == '시안':
                out['alternativeSourceIds'] = ['wmo-57131']
                issues.append({'code': 'SHORT_RECORD_ALTERNATIVE_REJECTED', 'detail': '가까운 WMO Jinghe 57131은 1991–2020 내 16년만 사용한 값이므로 완전 30년 평년으로 채택하지 않음. JMA의 시안 57036을 별도 출처로 보존했으나 이쪽도 실제 연수는 미표시.'})
        out['issues'] = issues
        result.append(out)
    return {'schemaVersion': 1, 'generatedAt': '2026-10-21', 'normalPeriod': [1991, 2020], 'months': list(range(1, 13)),
            'units': {'temperatureC': 'degC', 'precipitationMm': 'mm/month'},
            'policy': {'sourceType': 'station', 'griddedFallback': False, 'missingValue': None,
                       'climateLabels': 'lecture labels kept separately; no automatic reclassification',
                       'questionScope': 'Use supplied monthly values for graphs/calculations. No memorized fine rankings or borrowed historical exam values.',
                       'annualTemperature': 'derived.meanOfMonthlyTemperatureC is arithmetic mean of 12 monthly normals, not claimed identical to provider annual normal'},
            'counts': {'sites': len(result), 'completeGraphs': sum(x['usage']['climateGraph'] for x in result),
                       'temperatureReading': sum(x['usage']['temperatureReading'] for x in result)},
            'sourceArchive': 'data/climate-source-snapshots.zip', 'sources': sources, 'sites': result}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='verify source digests and exact reproducibility without writing')
    args = parser.parse_args()
    result = build()
    serialized = json.dumps(result, ensure_ascii=False, indent=2) + '\n'
    path = ROOT/'data/climate-normals.json'
    if args.check:
        assert path.read_text() == serialized, 'Rebuild data/climate-normals.json'
    else:
        path.write_text(serialized)
    print(json.dumps(result['counts'], ensure_ascii=False))


if __name__ == '__main__':
    main()
