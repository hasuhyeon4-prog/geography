#!/usr/bin/env python3
"""Rebuild additional R2/R3/R6 evidence from pinned official workbooks (stdlib).
Run after build-extensions.py and build-statistics.py. Does not change their outputs.
"""
import argparse,csv,importlib.util,io,json,re,zipfile
import xml.etree.ElementTree as E
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('statistics_builder',ROOT/'scripts/build-statistics.py')
s=importlib.util.module_from_spec(spec);spec.loader.exec_module(s)
OUT={}
def write(name,d):OUT[name]=json.dumps(d,ensure_ascii=False,indent=1,allow_nan=False)+'\n'
country_iso={r['country']:r['iso_code'] for r in csv.DictReader(io.StringIO(s.raw('owid_energy.csv').decode('utf-8-sig'))) if r['iso_code'] in s.ISO_KO}
country_iso.update({'US':'USA','Russian Federation':'RUS','Czech Republic':'CZE','Turkey':'TUR','Venezuela':'VEN','Iran':'IRN'})
# The current official download includes historical reserves ending in 2020.
# A 2025 publication is NOT a 2025 reserve estimate.
reserves={}
for fuel,sheet,unit in [('oil','Oil - Proved reserves history','billion barrels'),('gas','Gas - Proved reserves history ','trillion cubic metres')]:
    rows=list(s.xlsx_rows('ei2025.xlsx',sheet));h=next(r for _,r in rows if r[0] in ['Thousand million barrels','Trillion cubic metres'])
    cols={};seen=set()
    for ci,v in enumerate(h):
        if isinstance(v,(int,float)) and 1980<=v<=2020 and int(v) not in seen:
            seen.add(int(v))
            if v>=2013:cols[str(int(v))]=ci
    areas={}
    for ri,row in rows:
        if not isinstance(row[0],str) or row[0].strip().startswith(('Oil:','Natural Gas:')):continue
        values={y:s.number(row[c]) for y,c in cols.items() if c<len(row) and s.number(row[c]) is not None}
        if not values:continue
        name=row[0].strip()
        subset=':' in name and not name.startswith('of which: OECD')
        group=name.startswith('of which: OECD') or name.rstrip('#') in {'OECD','Non-OECD','OPEC','Non-OPEC','European Union'}
        aggregate=name.startswith(('Total ','Other ')) or group or subset
        iso=country_iso.get(name) if not aggregate else None
        areas[name]={'sourceName':name,'name':s.ISO_KO.get(iso),'iso3':iso,'series':values,'sourceRow':ri,
            'isAggregate':aggregate,'category':'subset' if subset else 'group' if group else 'region' if aggregate else 'country',
            'appMapped':iso in s.ISO_KO}
    world=areas['Total World']['series']
    for a in areas.values():a['shareOfWorldPct']={y:v/world[y]*100 for y,v in a['series'].items() if y in world and world[y]>0}
    reserves[fuel]={'sheet':sheet,'unit':unit,'years':[2013,2020],'areas':areas}
write('data/fossil-reserves-ei.json',{'schemaVersion':1,'source':'Energy Institute Statistical Review 2025 official XLSX',
    'snapshot':'ei2025.xlsx','practice':'suppliedData','datasets':reserves,
    'policy':'월드·대륙 비율은 같은 해 EI Total World가 분모. Total/Other 집계와 개별 국가를 합산하지 않는다. 지역은 EI 원분류(Europe, CIS, Middle East 등)를 보존한다. 2020 이후 매장량은 없으며 전방 채움 금지.'})
# Separate crude and products, exports and imports, and workbook vintages.
trade=[]
for fn,sheet,years in [('ei2023.xlsx','Oil - Trade 2021 and 2022',[2021,2022]),('ei2025.xlsx','Oil - Trade movements in 23-24',[2023,2024])]:
    active_unit=None
    for ri,row in s.xlsx_rows(fn,sheet):
        if row[0] in ['Million tonnes','Thousand barrels daily']:
            active_unit=row[0];continue
        if active_unit!='Million tonnes':continue
        if ri<5 or len(row)<9 or not isinstance(row[0],str):continue
        values={}
        for j,y in enumerate(years):
            vals={k:s.number(row[1+j*4+c]) for c,k in enumerate(['crudeImports','productImports','crudeExports','productExports'])}
            if any(v is not None for v in vals.values()):values[str(y)]=vals
        if values:
            name=row[0].strip();iso=country_iso.get(name)
            trade.append({'sourceName':name,'name':s.ISO_KO.get(iso),'iso3':iso,'appMapped':iso in s.ISO_KO,
                'unit':'million tonnes','snapshot':fn,'sheet':sheet,'sourceRow':ri,'series':values})
write('data/oil-trade-ei.json',{'schemaVersion':1,'source':'Energy Institute Statistical Review 2023/2025 official XLSX','unit':'million tonnes','years':[2021,2024],
    'practice':'suppliedData','rows':trade,'policy':'各 발행판의 2개 연도 원표를 보존한다. 2021–2022와 2023–2024 판본 경계를 명시한다. crude와 product를 합치거나 EIA TBPD에 이어 붙이지 않는다. 국가·지역 묶음은 원행 그대로다.'})
# US ASM: the exact 2013 release that reproduces all three lecture totals.
fn='census2013-state.xlsx';sheet='ASM_2013_31AS101_with_ann';states={}
for ri,row in s.xlsx_rows(fn,sheet):
    if ri<2 or len(row)<18 or row[0] not in ['California','Ohio','Texas']:continue
    code=str(row[1]);code=str(int(row[1])) if isinstance(row[1],(int,float)) else code
    if code!='31-33' and len(code)!=3:continue
    state=states.setdefault(row[0],{'industries':{}});v=s.number(row[16])
    entry={'naics2012':code,'name':row[2],'shipmentsThousandUSD':v,'rawValue':row[16],
        'relativeStandardErrorPct':s.number(row[17]),'sourceRow':ri}
    if code=='31-33':state['total']=entry
    else:state['industries'][code]=entry
for name,state in states.items():
    total=state['total']['shipmentsThousandUSD']
    for r in state['industries'].values():r['sharePct']=r['shipmentsThousandUSD']/total*100 if r['shipmentsThousandUSD'] is not None else None
write('data/us-state-manufacturing-2013.json',{'schemaVersion':1,'source':'U.S. Census Bureau, Annual Survey of Manufactures 2013, 31AS101','snapshot':fn,'sheet':sheet,
    'year':2013,'measure':'Total value of shipments and receipts for services; not GDP/value added','unit':'thousand current US dollars',
    'lectureSourceBlockIds':['L2-B0694','L2-B0699'],'practice':'suppliedData','states':states,
    'policy':'3자리 NAICS 상호배타적 업종과 31-33 총계를 구별. D/S 등 비공개 값은 null. 강의 도넛을 픽셀로 수치화하지 않고 원출처 비율을 계산한다.'})
# Historical Australian goods trade. Original fiscal-year labels and units stay intact.
historical={}
for sheet in ['Exports','Imports']:
    rows=list(s.xlsx_rows('dfat-historical.xlsx',sheet));h=next(r for ri,r in rows if ri==6);units=next(r for ri,r in rows if ri==7)
    columns={str(int(v)) if isinstance(v,(int,float)) else str(v):ci for ci,v in enumerate(h) if isinstance(v,(int,float)) and 1900<=v<=2020 or isinstance(v,str) and re.fullmatch(r'\d{4}-\d{2}',v)}
    values={}
    for ri,row in rows:
        if ri<8 or not isinstance(row[0],str):continue
        series={y:s.number(row[c]) for y,c in columns.items() if c<len(row) and s.number(row[c]) is not None}
        if series:values[row[0].strip()]={'sourceRow':ri,'series':series}
    historical[sheet]={'sheet':sheet,'unitByPeriod':{y:units[c] for y,c in columns.items()},'economies':values}
# Current DFAT workbook is a pivot report. Read the underlying publisher-supplied
# cache, not the on-screen default Total Trade (which would include services).
z=zipfile.ZipFile(io.BytesIO(s.raw('dfat-calendar.xlsx')));ns=s.NS
fields=E.fromstring(z.read('xl/pivotCache/pivotCacheDefinition1.xml')).find('s:cacheFields',ns)
shared=[[x.get('v') for x in f.find('s:sharedItems',ns)] if f.find('s:sharedItems',ns) is not None else [] for f in fields]
calendar={'Exports':{},'Imports':{}}
def val(c,i):
    if c.tag.endswith('}x'):return shared[i][int(c.get('v'))]
    if c.tag.endswith('}n'):return s.number(c.get('v'))
    return c.get('v')
for index,row in enumerate(E.fromstring(z.read('xl/pivotCache/pivotCacheRecords1.xml')),1):
    r=[val(c,i) for i,c in enumerate(row)]
    if r[3] not in ['Goods: Exports','Goods: Imports']:continue
    typ=r[3].split(': ')[1];v=s.number(r[2]);flag=r[4] if isinstance(r[4],str) else None
    if flag is not None and s.number(flag) is None:v=None
    e=calendar[typ].setdefault(r[0],{'series':{},'sourceCacheRows':{}})
    old=e['series'].get(r[1])
    # The publisher's pivot aggregates multiple source-cache records for a key.
    # Sum actual numeric entries exactly as Excel does; an all-blank key stays null.
    e['series'][r[1]]=(old+v if old is not None else v) if v is not None else old
    e['sourceCacheRows'].setdefault(r[1],[]).append(index)
    if flag is not None and s.number(flag) is None:
        e.setdefault('flags',{}).setdefault(r[1],[]).append(flag)
# Same-year total denominator, with missing suppressed values kept missing.
for typ,ds in calendar.items():
    for e in ds.values():
        for y in e.get('flags',{}):e['series'][y]=None
    total=ds.get('Total (By BOP)',{}).get('series',{})
    if not total:raise ValueError('DFAT total name changed')
    for e in ds.values():e['sharePct']={y:v/total[y]*100 for y,v in e['series'].items() if v is not None and total.get(y) is not None and total[y]>0}
for typ,d in historical.items():
    total_name='Total merchandise '+typ.lower();total=d['economies'][total_name]['series']
    for e in d['economies'].values():e['sharePct']={y:v/total[y]*100 for y,v in e['series'].items() if y in total and total[y]>0}
write('data/australia-trade-change.json',{'schemaVersion':1,'source':'Australian Government DFAT official workbooks, ABS underlying statistics',
    'practice':'suppliedData','historical':{'snapshot':'dfat-historical.xlsx','datasets':historical},
    'calendar':{'snapshot':'dfat-calendar.xlsx','unit':'A$ million','cache':'xl/pivotCache/pivotCacheRecords1.xml','datasets':calendar},
    'policy':'상품 교역만 선택. 1950년 부근의 원자료는 1949-50·1950-51 회계연도이며 1950 역년으로 이름을 바꾸지 않는다. 2020 역년과 비교할 때 기간·원단위·판본을 표시한다. services·total trade를 goods로 오인하지 않는다.'})
# World-city whitelist uses only the lecture's explicit hierarchy comparison.
blocks={b['id']:b for b in json.loads((s.SRC/'lecture-blocks.json').read_text())}
write('data/exam-relations-cities.json',{'schemaVersion':1,
    'relations':[{'indicator':'worldCityHierarchy','pairs':[['뉴욕','토론토']],'basis':'강의 1권 P05 / L1-B1690','scope':'강의의 상대 계층 비교. 모든 평가기관의 연도별 점수 순위는 아님.'}],
    'representativeTopTier':{'entities':['런던','뉴욕','도쿄'],'basis':'강의 1권 P05 / L1-B1693','complete':False},
    'given':[{'year':2025,'ranking':['뉴욕','런던','파리','도쿄','싱가포르','베이징','홍콩','상하이','로스앤젤레스','시카고'],
        'basis':'강의 1권 P05 / L1-B1690','sourceText':blocks['L1-B1690']['text'],'agency':'강의 본문에 기관명 미명시','practice':'suppliedData'}],
    'orders':[],'policy':'별도 worldCityHierarchy 지표 등록 필요. 인구·수도 여부를 계층의 대용 지표로 쓰지 않는다. 2025 순위는 문제에 제시한 자료로만 사용한다.'})

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--check',action='store_true');a=ap.parse_args();bad=[]
    for name,text in OUT.items():
        p=ROOT/name
        if a.check:
            if not p.exists() or p.read_text()!=text:bad.append(name)
        else:p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
    if bad:raise SystemExit('Out of date: '+', '.join(bad))
    print(json.dumps({'files':len(OUT),'reservesAreas':{k:len(v['areas']) for k,v in reserves.items()},'oilTradeRows':len(trade),'manufacturingStates':len(states),'australiaCalendarEconomies':{k:len(v) for k,v in calendar.items()}}))
if __name__=='__main__':main()
