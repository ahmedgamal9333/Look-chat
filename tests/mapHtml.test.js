import test from 'node:test';
import assert from 'node:assert/strict';
import { createMapHtml } from '../src/components/mapHtml.js';

test('nearby map includes the current location and approximate nearby pins', () => {
  const html = createMapHtml({
    currentLocation: { latitude: 30.04, longitude: 31.23 },
    radiusKm: 25,
    people: [{ display_name: 'مستخدم تجريبي', distance_m: 850, map_lat: 30.042, map_lon: 31.232 }]
  });
  assert.match(html, /const data =/);
  assert.match(html, /30\.042/);
  assert.match(html, /31\.232/);
  assert.match(html, /مستخدم تجريبي/);
  assert.match(html, /radius:data\.radiusKm\*1000/);
});

test('nearby map omits people without approximate coordinates', () => {
  const html = createMapHtml({
    currentLocation: { latitude: 30, longitude: 31 },
    people: [{ display_name: 'بدون إحداثيات', distance_m: 500 }]
  });
  assert.doesNotMatch(html, /بدون إحداثيات/);
});
