import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { createMapHtml } from './mapHtml';

export default function NearbyMap({ currentLocation, people, radiusKm }) {
  const html = createMapHtml({ currentLocation, people, radiusKm });
  return (
    <View style={styles.container}>
      <WebView originWhitelist={['*']} source={{ html }} javaScriptEnabled domStorageEnabled scrollEnabled={false} style={styles.webview} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 430, width: '100%', overflow: 'hidden', borderRadius: 14, backgroundColor: '#edf3f2' },
  webview: { flex: 1, backgroundColor: 'transparent' }
});
