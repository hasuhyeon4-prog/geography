(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WGLocationGrading = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var RAD = Math.PI / 180, KM = 111.195;
  function wrap(x) { return ((x + 180) % 360 + 360) % 360 - 180; }
  function distance(a, b) {
    var h = Math.sin((a.lat - b.lat) * RAD / 2) ** 2 +
      Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(wrap(a.lon - b.lon) * RAD / 2) ** 2;
    return 12742 * Math.asin(Math.min(1, Math.sqrt(Math.max(0, h))));
  }
  function unroll(ring) {
    // Polar polygons can genuinely span the full longitude range.
    var lons = ring.map(function (p) { return p[0]; });
    if (Math.max.apply(null, lons) - Math.min.apply(null, lons) > 359 &&
        ring.some(function (p) { return Math.abs(p[1]) >= 89; })) return ring;
    var x = ring[0][0];
    return ring.map(function (p, i) {
      if (i) x += wrap(p[0] - ring[i - 1][0]);
      return [x, p[1]];
    });
  }
  function inRing(p, ring) {
    if (!ring || ring.length < 3) return false;
    var r = unroll(ring), xs = r.map(function (v) { return v[0]; });
    var mid = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2;
    var x = p.lon + 360 * Math.round((mid - p.lon) / 360), inside = false;
    for (var i = 0, j = r.length - 1; i < r.length; j = i++) {
      var a = r[i], b = r[j];
      // Include the drawn boundary as well as the interior.
      var dx = b[0] - a[0], dy = b[1] - a[1], length2 = dx * dx + dy * dy;
      var t = length2 ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (p.lat - a[1]) * dy) / length2)) : 0;
      if (Math.hypot(x - a[0] - t * dx, p.lat - a[1] - t * dy) < 1e-8) return true;
      if ((a[1] > p.lat) !== (b[1] > p.lat) &&
          x < (b[0] - a[0]) * (p.lat - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside;
  }
  function inPolygon(p, polygon) {
    return inRing(p, polygon[0]) && !polygon.slice(1).some(function (ring) { return inRing(p, ring); });
  }
  function inPolygons(p, polygons) {
    return (polygons || []).some(function (poly) { return inPolygon(p, poly); });
  }
  function segmentKm(p, a, b) {
    var dx = wrap(b[0] - a[0]), middle = a[0] + dx / 2;
    var px = p.lon + 360 * Math.round((middle - p.lon) / 360);
    var c = Math.max(0.01, Math.cos((p.lat + a[1] + b[1]) / 3 * RAD));
    var ax = (a[0] - px) * KM * c, ay = (a[1] - p.lat) * KM;
    var bx = (a[0] + dx - px) * KM * c, by = (b[1] - p.lat) * KM;
    var vx = bx - ax, vy = by - ay;
    var t = Math.max(0, Math.min(1, -(ax * vx + ay * vy) / (vx * vx + vy * vy || 1)));
    return Math.hypot(ax + t * vx, ay + t * vy);
  }
  function lineDistance(p, lines, closed) {
    var best = Infinity;
    (lines || []).forEach(function (line) {
      for (var i = 1; i < line.length; i++) best = Math.min(best, segmentKm(p, line[i - 1], line[i]));
      if (closed && line.length > 2) best = Math.min(best, segmentKm(p, line[line.length - 1], line[0]));
    });
    return best;
  }
  function polygonDistance(p, polygons) { return lineDistance(p, (polygons || []).flat(), true); }
  function result(status, reason, km) {
    return { status: status, reason: reason, distance: Number.isFinite(km) ? Math.round(km) : null };
  }
  function usablePoint(p) {
    return p && Number.isFinite(p.lon) && Number.isFinite(p.lat) && Math.abs(p.lon) <= 180 && Math.abs(p.lat) <= 90;
  }
  function tapRadius(guess, minimum, maximum) {
    // precisionKm represents six CSS pixels at the scale where the answer was
    // placed. Allow twelve pixels, with a geographic floor and a finite cap.
    // Nearby reference places must never shrink a learner's acceptance area.
    var precision = Number.isFinite(guess.precisionKm) ? Math.max(0, guess.precisionKm) : 0;
    return Math.round(Math.max(minimum, Math.min(maximum, precision * 2)));
  }
  function grade(item, guess, options) {
    options = options || {};
    if (!guess) return result('wrong', '위치를 선택하지 않아 내일 다시 복습합니다.');
    if (!usablePoint(guess) || !item || !item.geometry) return result('uncertain', '위치를 안전하게 판정할 수 없습니다.');
    var g = item.geometry;
    var data = options.countries || {}, kind = item.featureKind || item.topic;
    if (item.topic === 'country') {
      var boundary = data.byName && data.byName[item.name];
      if (!boundary) return result('uncertain', '국경 자료가 없어 대표점만 표시합니다.');
      g = { type: 'polygons', polygons: boundary.polygons };
    }
    if (g.type === 'point') {
      var radii = { city: 80, peak: 75, heritage: 75, park: 100, canal: 75, strait: 75 };
      var target = { lon: g.lon, lat: g.lat }, d = distance(guess, target), radius = tapRadius(guess, radii[kind] || 100, 180);
      return result(d <= radius ? 'correct' : 'wrong', '대표 위치의 허용 거리(' + Math.round(radius) + ' km) ' + (d <= radius ? '안' : '밖') + '에 찍었습니다.', d);
    }
    if (g.type === 'multipoint') {
      var nearest = Math.min.apply(null, g.points.map(function (p) { return distance(guess, { lon: p[0], lat: p[1] }); })), pointRadius = tapRadius(guess, 80, 180);
      return result(nearest <= pointRadius ? 'correct' : 'wrong', '대표 위치의 허용 거리(' + pointRadius + ' km) ' + (nearest <= pointRadius ? '안' : '밖') + '에 찍었습니다.', nearest);
    }
    if (g.type === 'line' || g.type === 'multiline') {
      var lines = g.lines || [g.pts], dline = lineDistance(guess, lines);
      var radius = tapRadius(guess, ['mountain', 'fault', 'rift', 'belt', 'industry'].includes(kind) ? 150 : 75, 200);
      return result(dline <= radius ? 'correct' : 'wrong', '표시된 경로의 허용 거리(' + radius + ' km) ' + (dline <= radius ? '안' : '밖') + '에 찍었습니다.', dline);
    }
    var inside;
    if (g.type === 'polygons' || g.type === 'poly') {
      inside = inPolygons(guess, g.type === 'poly' ? [[g.pts]] : g.polygons);
    } else if (g.type === 'box') {
      var b = g.bbox, span = b[2] - b[0], offset = ((guess.lon - b[0]) % 360 + 360) % 360;
      inside = guess.lat >= b[1] && guess.lat <= b[3] && (span >= 360 || offset <= (span < 0 ? span + 360 : span));
    } else if (g.type === 'ellipse') {
      // Match the rotation of the ellipse drawn in the map's SVG (y runs south).
      var angle = (g.rot || 0) * RAD, dx = wrap(guess.lon - g.lon), dy = g.lat - guess.lat;
      var x = dx * Math.cos(angle) + dy * Math.sin(angle), y = -dx * Math.sin(angle) + dy * Math.cos(angle);
      inside = (x / g.rx) ** 2 + (y / g.ry) ** 2 <= 1 + 1e-10;
    }
    if (inside !== undefined) return result(inside ? 'correct' : 'wrong', '표시된 범위 ' + (inside ? '안' : '밖') + '에 찍었습니다.', inside ? 0 : null);
    return result('uncertain', '판정할 위치 자료가 없습니다. 정답을 직접 확인하세요.');
  }
  return { grade: grade, distance: distance, inPolygons: inPolygons, polygonDistance: polygonDistance, lineDistance: lineDistance };
});
