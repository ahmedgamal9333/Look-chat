import React, { useEffect, useRef } from 'react';
import { createMapHtml } from './mapHtml';

export default function NearbyMap({ currentLocation, people, radiusKm, onOpenPerson }) {
  const frame = useRef(null);
  const html = createMapHtml({ currentLocation, people, radiusKm });
  useEffect(() => {
    function receive(event) {
      if (event.source !== frame.current?.contentWindow) return;
      if (event.data?.type !== 'lookchat-open-user' || !event.data.person?.userId) return;
      const person = people.find(item => item.user_id === event.data.person.userId);
      if (person && onOpenPerson) onOpenPerson(person);
    }
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [people, onOpenPerson]);
  return React.createElement('iframe', {
    ref: frame,
    title: 'خريطة الأشخاص القريبين',
    srcDoc: html,
    style: { width: '100%', height: '470px', border: 0, borderRadius: 16, display: 'block', background: '#e9f1ef' },
    allow: 'geolocation'
  });
}
