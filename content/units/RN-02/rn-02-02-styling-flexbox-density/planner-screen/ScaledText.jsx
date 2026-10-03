// Preview helper: a Text that multiplies its fontSize by the simulated FONT_SCALE.
// On a device you write plain <Text>: it scales with the system text size by itself (allowFontScaling is true by default).
import { StyleSheet, Text } from 'react-native';
import { FONT_SCALE } from './device.js';

export function ScaledText({ style, ...props }) {
  const flat = StyleSheet.flatten(style) ?? {};
  const fontSize = (flat.fontSize ?? 14) * FONT_SCALE;
  return <Text {...props} style={[flat, { fontSize }]} />;
}
