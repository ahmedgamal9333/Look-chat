export async function getCurrentCoordinates({
  platform,
  locationApi,
  geolocation = globalThis.navigator?.geolocation
}) {
  if (platform === 'web') {
    if (!geolocation?.getCurrentPosition) {
      throw new Error('المتصفح لا يدعم تحديد الموقع. جرّب متصفحًا آخر.');
    }

    return new Promise((resolve, reject) => {
      geolocation.getCurrentPosition(
        ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
        reject,
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
      );
    });
  }

  const permission = await locationApi.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    const error = new Error('LOCATION_PERMISSION_DENIED');
    error.code = 'LOCATION_PERMISSION_DENIED';
    throw error;
  }

  const position = await locationApi.getCurrentPositionAsync({
    accuracy: locationApi.Accuracy.Balanced
  });
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude
  };
}
