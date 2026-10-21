# Agriculture source snapshots

`../agriculture-source-snapshots.zip` contains selected original records from FAOSTAT's official QCL, TCL and FBS bulk CSV files, plus their original code tables, the QCL methodology, UN M49 metadata and the provided teaching evidence. It is a **subset**, not a complete copy of each bulk archive.

The CSV header and selected record bytes are unchanged. `manifest.json` records the selected CSV's SHA-256, original archive URL and SHA-256, member path, release date, download date, row count and item/element/year filter. Flags and notes remain present. `scripts/fetch-agriculture-sources.py` independently extracts these same records from the complete pinned official archives and checks their hashes. It rejects changed upstream archives.

Rebuilding from the committed snapshots needs no network:

```sh
python3 scripts/build-agriculture-data.py --check
```

The teaching evidence was supplied in this project; it has a source name and hash rather than an invented public download URL. The scope of the workbook extraction is recorded in `audit/agriculture-evidence-20261021.json`. This is not a claim that all 820 questions were reread.

`entity-names.json` copies the 139 Korean country names and ISO3 codes already present in `assets/entity-kb.js` at commit `5f53b9a`. It does not invent Korean names for additional FAOSTAT reporting territories. Raw area identifiers and English names are retained separately.

See `docs/AGRICULTURE-DATA-HANDOFF.md` for rice, tea, cattle/buffalo, regional aggregation, missing-data and recall restrictions.
