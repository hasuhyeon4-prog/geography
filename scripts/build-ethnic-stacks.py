"""Render the data-only panel from the pinned EBS public PDF; never publish the full PDF.
Usage: python scripts/build-ethnic-stacks.py --source /path/to/source.pdf
       python scripts/build-ethnic-stacks.py --check
The rounded exercise readings in data/ethnic-stacks-given.json are not exact census counts.
"""
from pathlib import Path
import argparse,hashlib,io,json
R=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--source',type=Path);p.add_argument('--check',action='store_true');a=p.parse_args()
meta_path=R/'data/ethnic-stacks-given.json';m=json.loads(meta_path.read_text());out=R/m['figure']
if a.check:
 assert hashlib.sha256(out.read_bytes()).hexdigest()==m['figureSHA256']
 assert '근삿값' in m['method'] and len(m['categories'])==4
 assert all(len(v)==4 and min(v)>=0 and sum(v)>0 for v in m['countries'].values())
else:
 import fitz
 from PIL import Image
 if a.source is None:p.error('--source is required when rendering')
 raw=a.source.read_bytes();assert hashlib.sha256(raw).hexdigest()==m['pdfSHA256']
 doc=fitz.open(stream=raw,filetype='pdf');pix=doc[m['page']-1].get_pixmap(matrix=fitz.Matrix(4,4),clip=fitz.Rect(*m['cropPoints']))
 Image.open(io.BytesIO(pix.tobytes('png'))).save(out,'WEBP',quality=90)
 m['figureSHA256']=hashlib.sha256(out.read_bytes()).hexdigest();meta_path.write_text(json.dumps(m,ensure_ascii=False,indent=1)+'\n')
print('Ethnic stacks: pinned source and explicitly approximate readings verified')
