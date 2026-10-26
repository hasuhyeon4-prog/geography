# Completion sources (2026-10-26)

The four HTML files pin JMA ClimatView station pages. Only the **Normal** monthly mean temperature and precipitation columns enter the app. JMA defines the normals as 1991–2020: https://ds.data.jma.go.jp/tcc/tcc/products/climate/climatview/outline.html

Station IDs: Bamako/Senou 61291, Mumbai/Colaba 43057, Ulaanbaatar 44292, Abidjan 65578. Mumbai/Santacruz 43003 was rejected because precipitation normals were missing. Coordinates and elevation are from each selected station's own header. Per-element valid-year counts are not reported; no daily maximum/minimum average is substituted for mean temperature.

`eia-coal-2025.csv` contains the US government's annual 2025 coal-consumption record, CLTCBUS, from Monthly Energy Review Table 1.3. The full download's SHA256 and original URL are recorded in `data/coal-2025-endpoints.json`. China's 2025 endpoint uses the National Bureau of Statistics' 2026-02-28 bulletin's provisional energy total and coal share, with its separate source and rounding disclosed. These supplement endpoint direction checks; the original EI/OWID historical snapshot is preserved. Missing other fuels remain missing.

Energy conversion references: US/Canada/Mexico cooperation conversion table (Btu → joule), https://natural-resources.canada.ca/climate-change/conversion-factors-common-units-used-north-american-cooperation-energy-information ; tce = 7,000 Mcal = 29.3076 GJ (IT calorie), see IEA unit converter https://www.iea.org/data-and-statistics/data-tools/unit-converter and UNECE https://unece.org/forests/handy-guide-wood-energy .

Photographs have separate original-source, author, license, original download hash and converted-file hash records in `data/goal-figure-panels.json`; attribution is displayed beside each photo and listed in `assets/goal-figures/ATTRIBUTION.md`. No private lecture document is included here.
