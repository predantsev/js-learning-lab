import { useRef, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { moveAccessibilityFocus } from './a11yFocus.js';
import { books as initialBooks, MESSAGES, validateBook } from './catalog.js';
import { useSimulatedInsets } from './DeviceFrame.jsx';
import { ScaledText as Text, ScaledTextInput as TextInput } from './Scaled.jsx';

// Pictures do not load in the preview; give the cover a size and a background.
const COVER = { uri: 'https://example.com/cover.png' };

// The object you pass to Platform.select for your one platform difference.
export const platformSpec = {};

export function Catalog() {
  return <View style={{ flex: 1 }} />;
}

const styles = StyleSheet.create({});
