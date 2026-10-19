"""Index the existing 800-question workbook plus the September 2027 answer sheet.

Usage: python3 scripts/build-exam-source-index.py SOURCE.xlsx SEPT_ANSWERS.txt
This is an index of available source records, never a certificate that all choices
were reread. Old-exam topic labels and dispositions are preserved, not inferred.
"""
import hashlib
import json
import re
import sys
from pathlib import Path
import openpyxl

ROOT = Path(__file__).resolve().parent.parent
source, september = map(Path, sys.argv[1:3])
book = openpyxl.load_workbook(source, read_only=True, data_only=True)
rows = []
for sheet in ['RAW_현행문항320', 'RAW_구기출480']:
    for row in list(book[sheet].values)[1:]:
        year, exam, q, topic = row[:4]
        old = sheet == 'RAW_구기출480'
        term = 'CSAT' if exam == '수능' else '06' if exam.startswith('6') else '09'
        rows.append({'id':f'{year[:4]}-{term}-{int(q):02}', 'topic':topic,
                     'domain':row[5 if old else 4], 'knowledgeIds':row[7 if old else 6],
                     'indexSource':sheet, 'reviewStatus':'indexOnly',
                     'source':row[10] if old else row[14],
                     **({'oldDisposition':row[8]} if old else {})})
for line in september.read_text().splitlines():
    match = re.match(r'^(\d{1,2})\.\s+(.+)', line.strip())
    if match and not re.search('[①②③④⑤]', match[2]):
        rows.append({'id':f'2027-09-{int(match[1]):02}', 'topic':match[2],
                     'indexSource':september.name, 'reviewStatus':'indexOnly'})
assert len(rows) == 820 and len({r['id'] for r in rows}) == 820
out = {'meaning':'기출 범위 색인이다. 820문항의 개별 선지를 새로 전수 재판독했다는 뜻이 아니다.',
       'sources':[{'name':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in [source,september]],
       'counts':{'workbookCurrent':320,'workbookOld':480,'september2027':20,'indexed':820},
       'questions':sorted(rows,key=lambda r:r['id'])}
(ROOT/'audit/exam-source-index-20261019.json').write_text(json.dumps(out,ensure_ascii=False,indent=1)+'\n')
print(out['counts'])
