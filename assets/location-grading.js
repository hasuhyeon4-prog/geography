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
  function grade(item, guess, options) {
    options = options || {};
    if (!guess) return result('wrong', '정답을 보았으므로 오늘 다시 복습합니다.');
    if (!usablePoint(guess) || !item || !item.geometry) return result('uncertain', '위치를 안전하게 판정할 수 없습니다.');
    var g = item.geometry, precision = Number.isFinite(guess.precisionKm) ? Math.max(0, guess.precisionKm) : 0;
    var data = options.countries || {}, peers = options.items || [], kind = item.featureKind || item.topic;
    if (item.topic === 'country') {
      var boundary = data.byName && data.byName[item.name];
      if (!boundary) return result('uncertain', '국경 자료가 없어 대표점만 표시합니다.');
      var polygons = boundary.polygons, inside = inPolygons(guess, polygons), edge = polygonDistance(guess, polygons);
      if ((inside || edge < 150) && inPolygons(guess, data.disputed || []))
        return result('uncertain', '경계 해석이 다른 지역이어서 직접 확인합니다.');
      if (edge <= Math.max(12, precision * (inside ? 1 : 2)))
        return result('uncertain', '국경·해안에 가깝거나 지도가 너무 작습니다. 확대해 확인하세요.', edge);
      return result(inside ? 'correct' : 'wrong', inside ? '국가 범위 안에 찍었습니다.' : '국가 범위 밖에 찍었습니다.', edge);
    }
    if (g.type === 'point') {
      var radii = { city: 50, peak: 25, heritage: 20, park: 40, canal: 15, strait: 20 };
      if (!radii[kind]) return result('uncertain', '이 항목은 대표 위치만 있어 전체 범위를 자동 판정하지 않습니다.');
      var target = { lon: g.lon, lat: g.lat }, d = distance(guess, target), radius = radii[kind], other = Infinity;
      peers.forEach(function (peer) {
        if (peer.id === item.id || peer.featureKind !== kind || !peer.geometry || peer.geometry.type !== 'point') return;
        var q = peer.geometry, separation = distance(target, q);
        if (separation < 1) return;
        radius = Math.min(radius, Math.max(2, separation / 3));
        other = Math.min(other, distance(guess, q));
      });
      if (d <= radius && precision <= radius && other > d + precision)
        return result('correct', '해당 장소의 위치에 가깝게 찍었습니다.', d);
      if (d > radius + Math.max(80, precision * 2))
        return result('wrong', '해당 장소에서 멀리 떨어져 있습니다.', d);
      return result('uncertain', other <= d + precision ? '가까운 다른 장소와 구분이 어렵습니다. 확대해 확인하세요.' : '허용 거리의 경계이거나 지도가 너무 작습니다. 확대해 확인하세요.', d);
    }
    if (g.type === 'line' || g.type === 'multiline') {
      var lines = g.lines || [g.pts], dline = lineDistance(guess, lines), radius = kind === 'river' ? 25 : 20;
      var schematic = ['mountain', 'fault', 'rift', 'belt', 'industry'].includes(kind);
      if (dline <= radius && precision <= radius && !schematic) {
        var competing = peers.some(function (peer) {
          if (peer.id === item.id || peer.featureKind !== kind || !peer.geometry) return false;
          var q = peer.geometry;
          return ['line', 'multiline'].includes(q.type) && lineDistance(guess, q.lines || [q.pts]) <= dline + Math.max(3, precision);
        });
        if (!competing) return result('correct', '경로 위나 가까운 곳에 찍었습니다.', dline);
      }
      if (dline > Math.max(schematic ? 300 : 120, precision * 2 + radius))
        return result('wrong', '표시된 경로에서 멀리 떨어져 있습니다.', dline);
      return result('uncertain', schematic ? '대략적인 분포선이어서 직접 확인합니다.' : '주변 경로와 구분이 어렵거나 지도가 너무 작습니다. 확대해 확인하세요.', dline);
    }
    if (g.type === 'polygons') {
      var physical = g.source === 'Natural Earth 1:10m';
      if (!physical) return result('uncertain', '대략적인 범위이어서 직접 확인합니다.');
      var inside = inPolygons(guess, g.polygons), edge = polygonDistance(guess, g.polygons);
      var broad = ['mountain', 'plateau', 'desert', 'ecoregion', 'landform', 'peninsula'].includes(kind);
      if (inside && edge > Math.max(broad ? 40 : 12, precision))
        return result('correct', '표시된 범위 안에 찍었습니다.', 0);
      if (!inside && edge > Math.max(broad ? 180 : 80, precision * 2))
        return result('wrong', '표시된 범위에서 멀리 떨어져 있습니다.', edge);
      return result('uncertain', '범위의 경계에 가깝거나 지도가 너무 작습니다. 확대해 확인하세요.', edge);
    }
    return result('uncertain', '대략적인 범위·대표 위치만 있어 직접 확인합니다.');
  }
  return { grade: grade, distance: distance, inPolygons: inPolygons, polygonDistance: polygonDistance, lineDistance: lineDistance };
});
