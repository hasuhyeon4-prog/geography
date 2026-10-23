#!/usr/bin/env python3
"""Verify every pinned source byte; no network access or private files needed."""
import hashlib,json,zipfile
from pathlib import Path
R=Path(__file__).resolve().parents[1]
m=json.loads((R/'data/round3-source-manifest.json').read_text())
with zipfile.ZipFile(R/m['archive']) as z:
 assert z.testzip() is None
 assert set(z.namelist())=={x['path'] for x in m['sources']},'Unexpected/missing snapshot member'
 for x in m['sources']:
  b=z.read(x['path']);assert len(b)==x['bytes'],x['path'];assert hashlib.sha256(b).hexdigest()==x['sha256'],x['path']
print('Verified',len(m['sources']),'round-three source snapshots')
