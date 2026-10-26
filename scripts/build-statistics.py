#!/usr/bin/env python3
"""Rebuild R2/R5/R7 statistics from pinned source bytes using only stdlib.

Use: python3 scripts/build-statistics.py [--check]
Snapshots are input evidence. None/blank never becomes zero or another year.
"""
import argparse, csv, hashlib, io, json, math, re, zipfile
import xml.etree.ElementTree as E
from collections import defaultdict
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
ARCHIVE=ROOT/'data/extensions-source-snapshots.zip'
ARCHIVES=[ARCHIVE] if ARCHIVE.exists() else sorted((ROOT/'data').glob('extensions-source-snapshots-*.zip'))
if not ARCHIVES:raise FileNotFoundError('Unzip all three delivery packages into the same folder first.')
SRC=ROOT/'data/extension-sources'
NS={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
def raw(name):
    for path in ARCHIVES:
        with zipfile.ZipFile(path) as z:
            if name in z.namelist():return z.read(name)
    raise FileNotFoundError('Missing source '+name+'; unzip all three delivery packages first.')
def js(name):return json.loads(raw(name))
def number(x):
    if x is None or x=='':return None
    if isinstance(x,str) and x.strip() in {'--','NA','N/A','..','null','-999.9'}:return None
    try:v=float(x)
    except (TypeError,ValueError):return None
    return v if math.isfinite(v) else None
def xlsx_rows(name,sheet):
    z=zipfile.ZipFile(io.BytesIO(raw(name)))
    strings=[]
    if 'xl/sharedStrings.xml' in z.namelist():
        strings=[''.join(n.itertext()) for si in E.fromstring(z.read('xl/sharedStrings.xml')) for n in [si]]
    book=E.fromstring(z.read('xl/workbook.xml'))
    rid=next(x.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'] for x in book.find('s:sheets',NS) if x.attrib['name']==sheet)
    rel=E.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    path=next(x.attrib['Target'] for x in rel if x.attrib['Id']==rid)
    path=path.lstrip('/') if path.startswith('/') else 'xl/'+path
    for _,row in E.iterparse(io.BytesIO(z.read(path)),events=['end']):
        if row.tag!='{'+NS['s']+'}row':continue
        cells={}
        for c in row:
            if not c.tag.endswith('}c'):continue
            letters=re.match('[A-Z]+',c.attrib['r'])[0];ci=0
            for x in letters:ci=ci*26+ord(x)-64
            v=c.find('s:v',NS);t=c.attrib.get('t')
            if t=='inlineStr':value=''.join(c.find('s:is',NS).itertext())
            elif v is None:value=None
            elif t=='s':value=strings[int(v.text)]
            elif t in {'str','e'}:value=v.text
            elif t=='b':value=v.text=='1'
            else:value=number(v.text)
            cells[ci-1]=value
        if cells:yield int(row.attrib['r']),[cells.get(i) for i in range(max(cells)+1)]
        row.clear()
def write(name,data):
    OUTPUT[name]=json.dumps(data,ensure_ascii=False,indent=1,allow_nan=False)+'\n'
OUTPUT={}
boundary=(SRC/'country-boundaries.js').read_text()
KO_ISO=dict(re.findall(r'"([^\"]+)":\{"code":"([A-Z]{3})"',boundary))
ISO_KO={v:k for k,v in KO_ISO.items()}

# OWID maintains multiple providers. Keep the exact indicator codebook and do
# not substitute this energy series for the EIA physical-unit trade series.
fields=['primary_energy_consumption','energy_per_capita']+[x+'_'+t for x in ['coal','oil','gas'] for t in ['production','consumption','share_energy']]+[x+'_share_energy' for x in ['nuclear','hydro','wind','solar','biofuel','other_renewables']]
energy={};energy_regions={}
for r in csv.DictReader(io.StringIO(raw('owid_energy.csv').decode('utf-8-sig'))):
    if not 2013<=int(r['year'])<=2025:continue
    if r['iso_code'] in ISO_KO:
        name=ISO_KO[r['iso_code']];e=energy.setdefault(name,{'iso3':r['iso_code'],'series':{}})
    elif r['country'] in {'Africa','Asia','Europe','North America','South America','Oceania','World'}:
        e=energy_regions.setdefault(r['country'],{'sourceName':r['country'],'series':{}})
    else:continue
    for f in fields:
        v=number(r.get(f))
        if v is not None:e['series'].setdefault(f,{})[r['year']]=v
book={r['column']:r for r in csv.DictReader(io.StringIO(raw('owid-codebook.csv').decode()))}
write('data/energy-series.json',{'schemaVersion':1,'source':'OWID energy-data, provider by indicator in codebook',
    'retrievedAt':'2026-10-22','years':[2013,2025],'codebook':{f:book[f] for f in fields if f in book},
    'policy':'1차 에너지와 전력 구성 구별. substitution method 등 지표별 정의는 codebook. 공개 연도별 값만 보존.',
    'countries':energy,'regions':energy_regions,
    'regionPolicy':'OWID 원지역 이름 그대로. North America는 Northern America와 다르다. 지역 합계와 세계값의 차이는 유지.'})
production_shares={}
world=energy_regions['World']['series']
for region,d in energy_regions.items():
    if region=='World':continue
    output={}
    for metric in ['coal_production','oil_production','gas_production']:
        output[metric]={y:{'valueTWh':v,'worldTWh':world[metric][y],'shareOfReportedWorldPct':v/world[metric][y]*100}
            for y,v in d['series'].get(metric,{}).items() if y in world.get(metric,{}) and world[metric][y]>0}
    production_shares[region]=output
write('data/fossil-production-region-shares.json',{'source':'OWID energy-data original regional series / derived',
    'unit':'TWh / %','policy':'같은 지표·연도의 원지역 값÷원세계 값. 지역 구분은 OWID 원명 유지. 역내 교역·매장량·물리 수출량과 별개.',
    'regions':production_shares})

# IRENA table, PDF page 94 / printed page 81. Source text was extracted with
# pdftotext -layout and visually checked against the original PDF page.
text=raw('geothermal-page.txt').decode();lines=text.splitlines()
header=next(l for l in lines if l.startswith('PROD (GWh)'))
matches=list(re.finditer(r'20\d\d',header));years=[m[0] for m in matches]
centers=[(m.start()+m.end())/2 for m in matches]
bounds=[round(centers[0]-(centers[1]-centers[0])/2)]+[round((a+b)/2) for a,b in zip(centers,centers[1:])]+[len(header)+4]
geo={};aliases={'USA':'미국','New Zealand':'뉴질랜드','Iceland':'아이슬란드','Indonesia':'인도네시아','Philippines':'필리핀','Kenya':'케냐','Türkiye':'튀르키예','Mexico':'멕시코','Japan':'일본','China':'중국','Italy':'이탈리아','World':'세계'}
for line in lines:
    if not line or not re.search(r'\d',line[bounds[0]:]) or line.startswith('PROD'):continue
    name=line[:bounds[0]].strip()
    if not name or name.isdigit():continue
    vals={};flags={}
    for m in re.finditer(r'(\d{1,3}(?: \d{3})*)(?:\s+([eou]))?',line[bounds[0]:]):
        center=bounds[0]+(m.start(1)+m.end(1))/2
        i=min(range(len(centers)),key=lambda i:abs(centers[i]-center))
        y=years[i]
        if y in vals:raise ValueError(('Column collision',name,y,line))
        if abs(centers[i]-center)>5:raise ValueError(('Column mismatch',name,y,line))
        vals[y]=int(m[1].replace(' ',''))
        if m[2]:flags[y]=m[2]
    geo[aliases.get(name,name)]={'sourceName':name,'generationGWh':vals,'flags':flags,'sourceLine':line}
write('data/geothermal-generation.json',{'source':'IRENA Renewable energy statistics 2025','pdfPage':94,'printedPage':81,
    'years':[2015,2023],'unit':'GWh','flags':'원문 o/e/u 보존. 공란은 결측, 인쇄된 0만 0.',
    'areas':geo})

# BGS values retain observation precision/footnotes, and sub-commodities are
# separate series. Metal content and gross ore tonnage are never added.
minerals={}
for short,fn in [('구리','bgs-copper.json'),('보크사이트','bgs-bauxite.json'),('철광석','bgs-iron.json')]:
    d=js(fn);assert len(d['features'])==d['numberMatched'],'Incomplete BGS pagination'
    rows=[]
    for f in d['features']:
        p=f['properties'];year=p['year'][:4]
        if not '2013'<=year<='2024':continue
        rows.append({'id':f['id'],'iso3':p.get('country_iso3_code'),'name':ISO_KO.get(p.get('country_iso3_code'),p['country_trans']),
          'sourceName':p['country_trans'],'year':year,'commodity':p['bgs_commodity_trans'],
          'subCommodity':p.get('bgs_sub_commodity_trans'),'unit':p['units'],'value':p['quantity'],
          'valueAsPublished':p.get('quantity_in_book_style'),'precision':p.get('data_precision_description'),
          'flag':p.get('sdmx_code'),'flagMeaning':p.get('sdmx_translation'),
          'tableNotes':p.get('concat_table_notes_text'),'figureNotes':p.get('concat_figure_notes_text')})
    minerals[short]={'rows':rows,'provider':'British Geological Survey','requestedRange':[2013,2024]}
write('data/mineral-production.json',{'schemaVersion':1,'source':'BGS World Mineral Statistics OGC API','retrievedAt':'2026-10-22',
    'policy':'국가별 생산량 원행 보존. 원광·금속 함량·품위·공란·각주를 유지한다. 전체 생산 비중은 동일 subCommodity·unit 안에서만 계산.',
    'minerals':minerals})
mineral_shares={}
for mineral,d in minerals.items():
    groups=defaultdict(list)
    for r in d['rows']:groups[(r['year'],r['subCommodity'],r['unit'])].append(r)
    parts=[]
    for (year,sub,unit),rows in sorted(groups.items(),key=lambda x:str(x[0])):
        known=[r for r in rows if number(r['value']) is not None and r['value']>=0]
        total=sum(r['value'] for r in known)
        if not total:continue
        parts.append({'year':year,'subCommodity':sub,'unit':unit,'reportedTotal':total,
            'missingRows':[r['id'] for r in rows if r['value'] is None],
            'countries':[{'name':r['name'],'iso3':r['iso3'],'value':r['value'],'shareOfReportedTotalPct':r['value']/total*100,'sourceRowId':r['id']} for r in sorted(known,key=lambda r:-r['value'])]})
    mineral_shares[mineral]=parts
write('data/mineral-production-shares.json',{'source':'BGS World Mineral Statistics / derived',
    'denominator':'같은 연도·하위 품목·단위의 수치가 있는 BGS 국가 원행 합계. 결측 국가를 0으로 간주하지 않는다.',
    'practice':'suppliedData','minerals':mineral_shares})

# World Urbanization Prospects 2025: NATIONAL definitions, not DEGURBA.
pop={};locations={};m49_iso={}
region_by_id={900:'세계',903:'아프리카',935:'아시아',908:'유럽',909:'오세아니아',
    904:'라틴 아메리카',905:'앵글로아메리카'}
for sheet,key in [('Urban','urbanPopulation'),('Rural','ruralPopulation'),('Total','totalPopulation')]:
    for ri,row in xlsx_rows('wup2025-pop.xlsx',sheet):
        if ri==1:continue
        if len(row)<11:continue
        iso=row[4];name=ISO_KO.get(iso) or region_by_id.get(int(row[3]))
        if iso:m49_iso[int(row[3])]=iso
        if not name:continue
        loc={'id':int(row[3]),'iso3':iso,'sourceName':row[1],'type':row[8],'sdmxCode':row[6]}
        locations[name]=loc
        series={str(1950+i):v*1000 for i,v in enumerate(row[10:]) if number(v) is not None}
        pop.setdefault(name,{'location':loc,'series':{}})['series'][key]=series
for ri,row in xlsx_rows('wup2025-share.xlsx','Urban'):
    if ri==1 or len(row)<11:continue
    name=ISO_KO.get(row[4]) or region_by_id.get(int(row[3]))
    if name not in pop:continue
    pop[name]['series']['urbanShare']={str(1950+i):v for i,v in enumerate(row[10:]) if number(v) is not None}
write('data/urbanization-change.json',{'schemaVersion':1,'source':'UN DESA World Urbanization Prospects 2025, F14/F15',
    'definition':'national urban definitions; DEGURBA 도시/준도시/농촌과 구분','years':[1950,2050],
    'units':{'urbanPopulation':'명','ruralPopulation':'명','totalPopulation':'명','urbanShare':'%'},
    'projection':'1950~2025 추정치, 2026~2050 전망치. 미래 수치를 관측값으로 표시하지 않는다.',
    'continents':'UN 원지역 보존. 라틴 아메리카는 Caribbean 포함, 앵글로아메리카= Northern America.',
    'areas':pop})

# WDI TFR does not admit population-weighted arithmetic averaging to make a
# continent. Keep official region aggregates under their original WDI names.
wb=js('wb_fertility.json');assert int(wb[0]['pages'])==1
fertility={};regions={}
for r in wb[1]:
    v=number(r['value'])
    if v is None:continue
    iso=r['countryiso3code'];name=ISO_KO.get(iso)
    target=fertility if name else regions
    k=name or r['country']['value']
    target.setdefault(k,{'iso3':iso,'series':{}})['series'][r['date']]=v
write('data/fertility-change.json',{'schemaVersion':1,'source':'World Bank WDI SP.DYN.TFRT.IN','unit':'출생아 수/여성 1명',
    'retrievedAt':'2026-10-22','lastUpdated':wb[0].get('lastupdated'),
    'policy':'국가·WDI 공식 지역 집계만 사용. 국가 출산율을 단순·인구 가중 평균하여 대륙 출산율로 만들지 않는다.',
    'countries':fertility,'officialWdiAreas':regions})

un_tfr_regions={}
names={'Africa (UN)':'아프리카','Asia (UN)':'아시아','Europe (UN)':'유럽',
       'Latin America and the Caribbean (UN)':'라틴 아메리카','Northern America (UN)':'앵글로아메리카','Oceania (UN)':'오세아니아','World':'세계'}
for r in csv.DictReader(io.StringIO(raw('un-tfr-owid.csv').decode('utf-8-sig'))):
    if r['Entity'] not in names:continue
    v=number(r['Fertility rate'])
    if v is not None:un_tfr_regions.setdefault(names[r['Entity']],{'sourceName':r['Entity'],'series':{}})['series'][r['Year']]=v
write('data/fertility-un-regions.json',{'schemaVersion':1,'source':'UN World Population Prospects 2024, distributed by OWID',
    'sourceUrl':'https://ourworldindata.org/grapher/children-per-woman-un','sourceDownload':'https://ourworldindata.org/grapher/children-per-woman-un.csv',
    'unit':'출생아 수/여성 1명','years':[1950,2023],
    'policy':'(UN) 공식 지역 계열만 선택. OWID가 자체 합성한 Africa/Asia 등 동명 대륙 계열은 제외. WDI와 판본을 섞지 않는다.',
    'areas':un_tfr_regions})

# Destination USA, source countries only, both sexes combined, 8 reference years.
# The identical UN workbook was acquired from two independent public mirrors;
# transport provenance and failed origin download are in manifest.json.
ims={};years=['1990','1995','2000','2005','2010','2015','2020','2024'];sex_sums=[]
for ri,row in xlsx_rows('ims2024.xlsx','Table 1'):
    if ri<12 or len(row)<31 or row[4]!=840:continue
    code=row[6];iso=m49_iso.get(int(code)) if isinstance(code,(int,float)) else None
    if iso not in ISO_KO:continue
    name=ISO_KO[iso]
    vals={y:row[7+i] for i,y in enumerate(years) if number(row[7+i]) is not None}
    males={y:row[15+i] for i,y in enumerate(years) if number(row[15+i]) is not None}
    females={y:row[23+i] for i,y in enumerate(years) if number(row[23+i]) is not None}
    ims[name]={'iso3':iso,'originM49':int(code),'sourceName':row[5],'bothSexes':vals,
        'male':males,'female':females,'sourceSheet':'Table 1','sourceRow':ri,
        'coverage':row[2],'dataType':row[3]}
write('data/us-migrants-by-origin.json',{'schemaVersion':1,'source':'UN DESA International Migrant Stock 2024, Table 1',
    'destination':{'name':'미국','M49':840},'unit':'명','years':years,
    'definition':'특정 시점에 거주하는 국제 이주민 stock. 연간 유입 flow나 해당 출신국 총인구가 아니다.',
    'transport':'UN 배포 XLSX의 동일한 공개 사본 2개 SHA-256 일치. 공식 원본 서버는 403으로 바이트 대조 불가. provided-data 연습에 사용.',
    'practice':'suppliedData','countries':ims})
write('data/us-migrants-lecture-given.json',{'source':{'blockId':'L1-B1421','volume':1,'section':'P05'},
    'year':'2020','unit':'명','practice':'suppliedData','data':{'멕시코':10853000,'인도':2724000,'독일':534000,'세네갈':61000},
    'policy':'강의 원문 1,085.3·272.4·53.4·6.1만 명의 단위만 변환. IMS2024 판본의 값으로 덮어쓰지 않는다.'})

# Exact, unrounded Pew estimates for countries on the app map. All 7 categories
# are kept; share and population always come from the same original record.
with zipfile.ZipFile(io.BytesIO(raw('pew2025.zip'))) as z:
    fn=next(n for n in z.namelist() if n.endswith('(percentages).csv'))
    rows=list(csv.DictReader(io.StringIO(z.read(fn).decode('utf-8-sig'))))
pew={};cols={'christianity':'Christians','islam':'Muslims','unaffiliated':'Religiously_unaffiliated',
    'buddhism':'Buddhists','hinduism':'Hindus','judaism':'Jews','other':'Other_religions'}
# The app boundaries (Natural Earth) code South Sudan 'SDS' where ISO uses 'SSD'.
BOUNDARY_CODE={'SSD':'SDS'}
world={}
for r in rows:
    # Level 3 is the Pew world total: the world adherent order the lecture compares (1권 P04).
    if r['Level']=='3':
        y=r['Year'];world.setdefault('series',{})[y]={k:number(r[v]) for k,v in cols.items()}
        world.setdefault('populationSeries',{})[y]=number(r['Population']);continue
    if r['Level']!='1':continue
    iso=m49_iso.get(int(r['Countrycode']));name=ISO_KO.get(BOUNDARY_CODE.get(iso,iso))
    if not name:continue
    y=r['Year'];p=pew.setdefault(name,{'iso3':iso,'sourceName':r['Country'],'series':{},'populationSeries':{}})
    p['series'][y]={k:number(r[v]) for k,v in cols.items()};p['populationSeries'][y]=number(r['Population'])
write('data/religion-composition-extension.json',{'schemaVersion':1,'source':'Pew Research Center Religious Composition 2010–2020 dataset (2025)',
    'unit':'% of population','populationUnit':'명','years':[2010,2020],'precision':'원본 비반올림 비율. 표시 단계에서만 반올림.',
    'countries':pew,'world':world})

# EIA physical quantities preserve their own product and activity definitions.
eia={}
names=[]
for path in ARCHIVES:
    with zipfile.ZipFile(path) as z:names.extend(z.namelist())
for fn in sorted(n for n in names if re.match(r'eia-(coal|gas|oil)-(exports|reserves|production)\.json$',n)):
    d=js(fn).get('response',{});rows=d.get('data',[])
    assert len(rows)==int(d.get('total',0)),('Incomplete EIA pagination',fn)
    eia[fn[4:-5]]={'total':len(rows),'rows':rows,'policy':'물리 단위 원행 보존. 에너지 환산 TWh와 직접 합산하지 않는다.'}
write('data/fossil-trade-reserves.json',{'schemaVersion':1,'source':'U.S. EIA International Energy Data API',
    'retrievedAt':'2026-10-22','requestedYears':[2013,2024],
    'policy':'countryRegionTypeId c/r 구분. 원유(lease condensate 포함)와 전체 석유제품을 혼합하지 않는다. reserves는 stock, production/exports는 flow.',
    'datasets':eia})

# A small, lecture-grounded candidate list. Only unanimous >=8 covered years
# passes for recall; changed or missing comparisons are held for supplied data.
blocks={b['id']:b for b in json.loads((SRC/'lecture-blocks.json').read_text())}
candidates=[('중국','coal_share_energy','oil_share_energy','L2-B0373'),('인도','coal_share_energy','oil_share_energy','L2-B0373'),
 ('러시아','gas_share_energy','oil_share_energy','L2-B0373'),('이란','gas_share_energy','oil_share_energy','L2-B0373'),
 ('브라질','oil_share_energy','hydro_share_energy','L2-B0377'),('프랑스','nuclear_share_energy','oil_share_energy','L2-B0373')]
validation=[];orders=[]
for country,hi,lo,bid in candidates:
    ser=energy.get(country,{}).get('series',{});a=ser.get(hi,{});b=ser.get(lo,{})
    years=sorted(y for y in a.keys()&b.keys() if '2015'<=y<='2025')
    failed=[y for y in years if not a[y]>b[y]]
    status='active' if len(years)>=8 and not failed else 'changed' if failed else 'insufficientYears'
    id=f'{country}:{hi}>{lo}'
    validation.append({'id':id,'country':country,'hi':hi,'lo':lo,'years':years,'failedYears':failed,'status':status,'sourceBlockId':bid})
    if status=='active':orders.append({'entity':country,'indicators':[hi,lo],'source':f'강의 2권 P07 / {bid}',
        'scope':'동일 국가의 해당 두 에너지원 비교. 전체 에너지원 1·2위를 뜻하지 않는다.','validationId':id})
components=['coal','oil','gas','nuclear','hydro','wind','solar','biofuel','other_renewables']
top_candidates=[('중국',['coal','oil'],'L2-B0373'),('인도',['coal','oil'],'L2-B0373'),
    ('러시아',['gas','oil'],'L2-B0375'),('이란',['gas','oil'],'L2-B0375'),
    ('프랑스',['nuclear','oil'],'L2-B0375'),('브라질',['oil'],'L2-B0373'),
    ('남아프리카 공화국',['coal'],'L2-B0385')]
top_audit=[];top_orders=[]
for country,expected,bid in top_candidates:
    ss=energy.get(country,{}).get('series',{});rankings={}
    for y in map(str,range(2015,2026)):
        vals={c:ss.get(c+'_share_energy',{}).get(y) for c in components}
        # A missing component cannot be inferred to be zero.
        if any(v is None for v in vals.values()):continue
        rankings[y]=sorted(vals,key=lambda c:(-vals[c],c))
    failed=[y for y,rank in rankings.items() if rank[:len(expected)]!=expected]
    status='active' if len(rankings)>=8 and not failed else 'changed' if failed else 'insufficientYears'
    aid=country+':primary-top-'+str(len(expected))
    top_audit.append({'id':aid,'country':country,'expected':expected,'years':sorted(rankings),
        'annualRanks':rankings,'failedYears':failed,'status':status,'sourceBlockId':bid})
    if status=='active':top_orders.append({'composition':'primaryEnergy','orders':{country:expected},
        'basis':f'강의 2권 P07 / {bid}','validationId':aid})
cross_candidates=[('primary_energy_consumption','중국','미국','L2-B0368'),
    ('primary_energy_consumption','미국','인도','L2-B0368'),
    ('energy_per_capita','미국','중국','L2-B0368'),('gas_consumption','미국','중국','L2-B0368'),
    ('hydro_share_energy','브라질','러시아','L2-B0385')]
cross_audit=[];relations=[]
for indicator,hi,lo,bid in cross_candidates:
    a=energy[hi]['series'].get(indicator,{});b=energy[lo]['series'].get(indicator,{})
    years=sorted(y for y in a.keys()&b.keys() if '2015'<=y<='2025')
    failed=[y for y in years if a[y]<=b[y]]
    status='active' if len(years)>=8 and not failed else 'changed' if failed else 'insufficientYears'
    aid=indicator+':'+hi+'>'+lo
    cross_audit.append({'id':aid,'indicator':indicator,'hi':hi,'lo':lo,'years':years,'failedYears':failed,'status':status,'sourceBlockId':bid})
    if status=='active':relations.append({'indicator':indicator,'pairs':[[hi,lo]],'basis':f'강의 2권 P07 / {bid}','validationId':aid})
write('audit/energy-validation-20261022.json',{'candidates':validation,'topOrders':top_audit,'countryComparisons':cross_audit,
    'policy':'8개 이상 공통 연도 모두에서 방향 일치. 전체 구성의 순위는 모든 구성요소가 있는 연도만 확인. 반례는 숨기지 않는다.'})
write('data/exam-relations-energy.json',{'schemaVersion':2,'check':{'window':['2015','2025'],'minYears':8},
    'relations':relations,'orders':top_orders,
    'validatedIndicatorOrders':orders,'candidateAudit':'audit/energy-validation-20261022.json',
    'groups':{'BRICS-2021-given':{'entities':['브라질','러시아','인도','중국','남아프리카 공화국'],'sourceBlockId':'L2-B0385','period':2021}},
    'policy':'relations·orders는 기존 관계 형식. primaryEnergy 구성과 지표를 엔진에 등록해야 한다. validatedIndicatorOrders는 별도 어댑터 필요. 강의에 G7 비교 근거가 없어 G7의 임의 전체 순위는 허용하지 않는다.'})

# Additions to the station-based 1991-2020 normals; existing 41 records are not
# overwritten. Incomplete mean temperature remains null, even with Tmax/Tmin.
import importlib.util
spec=importlib.util.spec_from_file_location('climate_source_parser',ROOT/'scripts/climate-source-parser.py')
parser=importlib.util.module_from_spec(spec);spec.loader.exec_module(parser)
base_climate=json.loads((SRC/'climate-normals.json').read_text())
extra_sites=[]
locs=json.loads((SRC/'location-items.json').read_text())
for filename,name,climate,bid in [('singapore.csv','싱가포르','af','L1-B0341'),('iquitos-sanroque.csv','이키토스','af','L1-B0441')]:
    station,values=parser.wmo(raw(filename).decode('utf-8-sig'))
    loc=next((x for x in locs if x.get('name')==name and x.get('geometry',{}).get('type')=='point'),None)
    if loc:g=loc['geometry'];point=[g['lon'],g['lat']]
    else:point=None
    complete=all(v is not None for v in values['temperatureC']+values['precipitationMm'])
    record={'name':name,'mapPoint':point,'lectureClimate':climate,'sourceBlockId':bid,
        'normalPeriod':[1991,2020],'station':station,'sourceFile':filename,
        'temperatureC':values['temperatureC'],'precipitationMm':values['precipitationMm'],
        'temperatureYears':values.get('temperatureCYears'),'precipitationYears':values.get('precipitationMmYears'),
        'status':'complete' if complete else 'partial','usage':{'climateGraph':complete,
        'temperatureReading':all(v is not None for v in values['temperatureC']),
        'precipitationReading':all(v is not None for v in values['precipitationMm'])},
        'issues':[] if complete else ['WMO 제출에 Daily_Mean이 없다. Tmax/Tmin 평균으로 대체하지 않는다.']}
    if point:record['station']['distanceFromMapPointKm']=parser.distance(point,station)
    extra_sites.append(record)
q=json.loads((SRC/'curation.json').read_text())['climatePrimaryExtraction']['QuitoInaquInfo']
extra_sites.append({'name':'키토','normalPeriod':q['normalPeriod'],'station':q['station'],
    'sourceFile':q['source'],'pdfPage':1,'extraction':q['extraction'],
    'temperatureC':q['temperatureC'],'annualTemperatureC':q['annualTemperatureC'],
    'precipitationMm':[None]*12,'status':'partial','usage':{'climateGraph':False,'temperatureReading':True,'precipitationReading':False},
    'issues':['INAMHI 1991–2020 Iñaquito 월평균 기온을 확보. WWIS 강수는 1981–2010이며 기간이 달라 결합하지 않는다.']})
climate_extension={'schemaVersion':1,'normalPeriod':[1991,2020],
    'mode':'additive; 기존 data/climate-normals.json 41개를 보존','sites':extra_sites,
    'reviewedHolds':[{'name':'키토','status':'partial','reason':'INAMHI Iñaquito 기온 확보. 같은 1991–2020 기간 강수 미확보. WWIS 1981–2010 강수와 합성하지 않음.'},
        {'name':'아부자','status':'hold','reason':'기존 1월 월평균 기온=최고 기온 35.2℃의 이상치가 재수집본에도 남음. JMA 65125 대체 페이지 404. 기존 강수 사용과 기온 보류 유지.'}]}
# Rebuild the final dataset, including the later pinned completion stations.
# Importing this builder performs no writes, including during --check.
completion_spec=importlib.util.spec_from_file_location('completion_climate',ROOT/'scripts/build-completion-climate.py')
completion_climate=importlib.util.module_from_spec(completion_spec)
completion_spec.loader.exec_module(completion_climate)
write('data/climate-normals-extension.json',completion_climate.build(climate_extension))

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--check',action='store_true');args=ap.parse_args();bad=[]
    for name,text in OUTPUT.items():
        p=ROOT/name
        if args.check:
            if not p.exists() or p.read_text()!=text:bad.append(name)
        else:p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
    if bad:raise SystemExit('Out of date: '+', '.join(bad))
    print(json.dumps({'files':len(OUTPUT),'energyCountries':len(energy),'urbanizationAreas':len(pop),
      'migrantOrigins':len(ims),'religionCountries':len(pew),'eiaDatasets':len(eia),'mineralRows':sum(len(x['rows']) for x in minerals.values())}))
if __name__=='__main__':main()
