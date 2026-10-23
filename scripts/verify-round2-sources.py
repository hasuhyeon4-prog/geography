#!/usr/bin/env python3
"""Verify raw and curated round-two snapshots; no network or dependencies."""
import hashlib,json,zipfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'data/round2-source-manifest.json').read_text())
with zipfile.ZipFile(root/manifest['archive']) as archive:
 assert set(archive.namelist())=={x['path'] for x in manifest['sources']}
 for item in manifest['sources']:
  data=archive.read(item['path'])
  assert len(data)==item['bytes'],item['path']+' bytes'
  assert hashlib.sha256(data).hexdigest()==item['sha256'],item['path']+' SHA-256'
for item in manifest['curatedSources']:
 data=(root/item['path']).read_bytes()
 assert len(data)==item['bytes'],item['path']+' bytes'
 assert hashlib.sha256(data).hexdigest()==item['sha256'],item['path']+' SHA-256'
print(json.dumps({'verifiedRawSources':len(manifest['sources']),'verifiedCuratedSources':len(manifest['curatedSources'])}))
