import React from 'react';
import { createMapHtml } from './mapHtml';

export default function NearbyMap({ currentLocation, people, radiusKm }) {
  const html = createMapHtml({ currentLocation, people, radiusKm });
  return React.createElement('iframe', {
    title: 'خريطة الأشخاص القريبين',
    srcDoc: html,
    style: { width: '100%', height: '430px', border: 0, borderRadius: 14, display: 'block', background: '#edf3f2' },
    allow: 'geolocation'
  });
}
