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


test('map photo pins include avatar and chat action safely', () => {
  const html = createMapHtml({
    currentLocation: { latitude: 30, longitude: 31 },
    people: [{ user_id: 'user-123', display_name: 'صديق', avatar_url: 'https://example.com/photo.jpg', bio: 'أحب السفر', distance_m: 700, map_lat: 30.01, map_lon: 31.01 }]
  });
  assert.match(html, /user-pin/);
  assert.match(html, /https:\\/\\/example.com\\/photo.jpg/);
  assert.match(html, /data-open-user/);
  assert.match(html, /ابدأ محادثة/);
});
