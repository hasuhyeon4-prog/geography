# Climate station source snapshots

Public station normals used for the 2026-10-21 handoff. See
`manifest.json` for exact URLs, SHA-256, retrieval date, and extraction type.
Original source spelling, missing cells, and suspected errors are preserved in
`data/climate-source-snapshots.zip`. The manifest's `path` is the member path
inside that archive. Original line endings and bytes are preserved for hashes.

- `wmo/`: WMO member submissions, archived by NOAA NCEI, accession 0253808
  version 6.6, reference period 1991–2020. Parameter 5 / Mean is mean daily
  temperature (°C); parameter 1 / Sum is monthly total precipitation (mm).
  `NOY` is the number of contributing years, not an observation.
- `jma/`: Japan Meteorological Agency TCC station normals, 1991–2020,
  calculated from GHCN and CLIMAT reports. Provider requires at least eight
  years of monthly data; actual per-station monthly counts are not shown.
- `eccc/`: Environment and Climate Change Canada official 1991–2020 Montreal
  Trudeau composite normals, including source quality codes and analytics.
- `documentation/`: official method text and the NOAA ISD metadata row used
  to resolve the erroneous longitude in the Auckland submission.

Ciampino 16239 and Jinghe 57131 are retained as **rejected alternatives**,
not spliced into Fiumicino 16242 or JMA Xi'an 57036. No gridded values, inferred
missing precipitation, or other normal periods were substituted.

Rebuild: `python3 scripts/build-climate-data.py`.
Verify pinned bytes and exact rebuild: `python3 scripts/build-climate-data.py --check`.
Usage restrictions and unresolved sites: `docs/CLIMATE-DATA-HANDOFF.md`.
