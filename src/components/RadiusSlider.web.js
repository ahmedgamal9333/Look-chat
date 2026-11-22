import React from 'react';

export default function RadiusSlider({ value, onValueChange }) {
  return React.createElement('input', {
    type: 'range',
    min: 1,
    max: 500,
    step: 1,
    value,
    onChange: event => onValueChange(Number(event.target.value)),
    'aria-label': 'نطاق البحث بالكيلومتر',
    style: { width: '100%', height: 34, accentColor: '#087F72', cursor: 'pointer', direction: 'ltr' }
  });
}
