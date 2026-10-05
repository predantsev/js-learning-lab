// Preview helpers: Text and TextInput that apply a SIMULATED system text size of 200 %.
// On a device plain <Text> and <TextInput> do this by themselves; like them, these helpers
// respect allowFontScaling={false} and maxFontSizeMultiplier.
import { StyleSheet, Text, TextInput } from 'react-native';

const FONT_SCALE = 2;

function scaledStyle(style, { allowFontScaling = true, maxFontSizeMultiplier }) {
  const flat = StyleSheet.flatten(style) ?? {};
  const base = flat.fontSize ?? 14;
  const cap = maxFontSizeMultiplier >= 1 ? maxFontSizeMultiplier : Infinity;
  const factor = allowFontScaling ? Math.min(FONT_SCALE, cap) : 1;
  return [flat, { fontSize: base * factor }];
}

export function ScaledText({ style, ...props }) {
  return <Text {...props} style={scaledStyle(style, props)} />;
}

export function ScaledTextInput({ style, ...props }) {
  return <TextInput {...props} style={scaledStyle(style, props)} />;
}
