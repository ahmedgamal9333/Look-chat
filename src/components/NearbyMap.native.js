import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { createMapHtml } from './mapHtml';

export default function NearbyMap({ currentLocation, people, radiusKm, onOpenPerson }) {
  const html = createMapHtml({ currentLocation, people, radiusKm });
  function handleMessage(event) {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type !== 'lookchat-open-user' || !message.person?.userId) return;
      const person = people.find(item => item.user_id === message.person.userId);
      if (person && onOpenPerson) onOpenPerson(person);
    } catch {}
  }
  return (
    <View style={styles.container}>
      <WebView originWhitelist={['*']} source={{ html }} javaScriptEnabled domStorageEnabled scrollEnabled={false} onMessage={handleMessage} style={styles.webview} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 470, width: '100%', overflow: 'hidden', borderRadius: 16, backgroundColor: '#e9f1ef' },
  webview: { flex: 1, backgroundColor: 'transparent' }
});
