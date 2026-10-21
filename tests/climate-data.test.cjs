'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const data = require('../data/climate-normals.json');
const classification = require('../assets/classification-sets.js').byId.climateCities;
const byName = Object.fromEntries(data.sites.map(s => [s.name, s]));

test('climate source hashes and extraction reproduce the delivered dataset', () => {
  const r = spawnSync('python3', ['scripts/build-climate-data.py', '--check'], {cwd:root, encoding:'utf8'});
  assert.equal(r.status, 0, r.stderr || r.stdout);
});

test('all lecture sites are accounted for with explicit missing and held records', () => {
  assert.deepEqual(Object.keys(byName).sort(), Object.keys(classification.points).sort());
  assert.equal(data.sites.length, 41);
  assert.equal(data.sites.filter(s => s.usage.climateGraph).length, 38);
  assert.equal(data.sites.filter(s => s.usage.temperatureReading).length, 39);
  for (const s of data.sites) {
    assert.deepEqual(s.mapPoint, classification.points[s.name].slice(0,2));
    assert.equal(s.lectureClimate, classification.values[s.name]);
    assert.deepEqual(s.normalPeriod, [1991,2020]);
    assert.equal(s.temperatureC.length, 12);
    assert.equal(s.precipitationMm.length, 12);
    for (const v of s.temperatureC) assert.ok(v === null || (Number.isFinite(v) && v > -100 && v < 60));
    for (const v of s.precipitationMm) assert.ok(v === null || (Number.isFinite(v) && v >= 0 && v < 2000));
    if (s.usage.climateGraph) {
      assert.ok(s.temperatureC.every(v => v !== null));
      assert.ok(s.precipitationMm.every(v => v !== null));
      assert.ok(s.station.distanceFromMapPointKm < 35, s.name);
      assert.equal(s.status, 'complete');
    }
  }
});

test('known source problems cannot silently enter the graph pool', () => {
  const abuja = byName['아부자'];
  assert.equal(abuja.temperatureC[0], 35.2); // original suspect value retained
  assert.equal(abuja.maximumTemperatureC[0], 35.2);
  assert.equal(abuja.minimumTemperatureC[0], 18.5);
  assert.equal(abuja.usage.climateGraph, false);
  assert.equal(abuja.usage.temperatureReading, false);
  assert.equal(abuja.derived.temperatureRangeC, undefined);
  assert.equal(byName['키토'].sourceId, null);
  assert.ok(byName['키토'].temperatureC.every(v => v === null));
  assert.equal(byName['그린란드 내륙'].usage.temperatureReading, true);
  assert.equal(byName['그린란드 내륙'].usage.climateGraph, false);
  assert.ok(byName['그린란드 내륙'].precipitationMm.every(v => v === null));
  assert.equal(byName['마나우스'].usage.climateTypeRecall, false);
  assert.equal(byName['마나우스'].derived.driestMonthMm, 56.1);
});

test('station corrections, station alternatives and provider coverage remain visible', () => {
  const akl = byName['오클랜드'].station;
  assert.equal(akl.longitude, 174.8);
  assert.ok(akl.submittedCoordinates[0] < 172);
  assert.equal(akl.coordinateSourceId, 'noaa-auckland-meta');
  assert.equal(byName['로마'].station.id, '16242');
  assert.equal(byName['로마'].precipitationMm[6], 12.31);
  assert.equal(byName['시안'].station.id, '57036');
  for (const s of data.sites.filter(s => s.sourceId?.startsWith('jma-'))) {
    assert.equal(s.coverage.minimumYearsRequiredByProvider, 8);
    assert.equal(s.coverage.temperatureYears, null);
  }
  assert.equal(byName['아디스아바바'].station.elevationM, null);
  assert.equal(byName['몬트리올'].coverage.precipitationCode, 'C');
  assert.equal(byName['몬트리올'].precipitationMm[0], 85.8); // precipitation includes snow, not rainfall alone
});

test('units, month order, southern seasons and climate calculations match source anchors', () => {
  assert.equal(byName['배로(우트키아빅)'].temperatureC[0], -24.2);
  assert.equal(byName['푸저우'].temperatureC[6], 29.4);
  assert.equal(byName['보스토크(남극)'].temperatureC[7], -66.7);
  assert.equal(byName['다윈'].precipitationMm[0], 470.7);
  assert.ok(byName['다윈'].derived.djfPrecipitationMm > byName['다윈'].derived.jjaPrecipitationMm);
  assert.ok(byName['퍼스'].derived.jjaPrecipitationMm > byName['퍼스'].derived.djfPrecipitationMm);
  for (const s of data.sites.filter(s => s.usage.climateGraph)) {
    const d = s.derived;
    assert.ok(Math.abs(d.coldestC + d.temperatureRangeC - d.warmestC) < 1e-8);
    assert.ok(Math.abs(s.precipitationMm.reduce((a,b)=>a+b,0) - d.annualPrecipitationFromMonthsMm) < 0.006);
    assert.ok(d.jjaPrecipitationSharePct + d.djfPrecipitationSharePct <= 100.01);
  }
});
