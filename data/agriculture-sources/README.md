# Agriculture source snapshots

The ZIP contains selected original FAOSTAT QCL, TCL and FBS CSV records, original code tables, QCL methodology and UN M49 metadata. It is a subset of the bulk archives. Headers and selected record bytes, flags, units and notes are unchanged.

The manifest records URLs, dates, complete bulk archive hashes, original member paths, exact row filters and selected CSV hashes. The standard-library fetch script verifies pinned archives and rejects revised releases. Incomplete ZIP transfers are retried. Rebuild offline with `python3 scripts/build-agriculture-data.py --check`.

The two earlier audit files were recovered from GitHub after scratch cleanup. Data and source code were rebuilt and checked again. This ZIP contains official statistical sources; it does not contain full copies of the supplied lecture or exam PDFs. Earlier source names, hashes and review scope remain in the evidence audit. No new 820-question review is claimed.

Korean country names copy the existing 139 country/ISO3 entries at commit 5f53b9a. Additional FAOSTAT reporting areas retain their raw codes and source names.

See docs/AGRICULTURE-DATA-HANDOFF.md for source boundaries and integration.
