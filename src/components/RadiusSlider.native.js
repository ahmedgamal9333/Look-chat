import React from 'react';
import Slider from '@react-native-community/slider';

export default function RadiusSlider({ value, onValueChange }) {
  return <Slider style={{ width: '100%', height: 42 }} minimumValue={1} maximumValue={500} step={1} value={value} onValueChange={onValueChange} minimumTrackTintColor="#087F72" maximumTrackTintColor="#DCE5E7" thumbTintColor="#087F72" />;
}
