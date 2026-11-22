import test from 'node:test';
import assert from 'node:assert/strict';
import { getCurrentCoordinates } from '../src/location.js';

test('browser geolocation returns latitude and longitude', async () => {
  const geolocation = {
    getCurrentPosition(success) {
      success({ coords: { latitude: 29.98, longitude: 31.13 } });
    }
  };
  assert.deepEqual(await getCurrentCoordinates({ platform: 'web', geolocation }), {
    latitude: 29.98,
    longitude: 31.13
  });
});

test('browser permission denial is propagated', async () => {
  const denied = Object.assign(new Error('User denied Geolocation'), { code: 1 });
  const geolocation = { getCurrentPosition(_success, failure) { failure(denied); } };
  await assert.rejects(getCurrentCoordinates({ platform: 'web', geolocation }), error => error.code === 1);
});

test('native permission denial stops before reading location', async () => {
  let locationRead = false;
  const locationApi = {
    requestForegroundPermissionsAsync: async () => ({ status: 'denied' }),
    getCurrentPositionAsync: async () => { locationRead = true; }
  };
  await assert.rejects(
    getCurrentCoordinates({ platform: 'android', locationApi }),
    error => error.code === 'LOCATION_PERMISSION_DENIED'
  );
  assert.equal(locationRead, false);
});

test('native location returns latitude and longitude', async () => {
  const locationApi = {
    Accuracy: { Balanced: 3 },
    requestForegroundPermissionsAsync: async () => ({ status: 'granted' }),
    getCurrentPositionAsync: async options => {
      assert.equal(options.accuracy, 3);
      return { coords: { latitude: 30.04, longitude: 31.23 } };
    }
  };
  assert.deepEqual(await getCurrentCoordinates({ platform: 'android', locationApi }), {
    latitude: 30.04,
    longitude: 31.23
  });
});
