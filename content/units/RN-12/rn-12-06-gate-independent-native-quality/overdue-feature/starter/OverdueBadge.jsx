// OverdueBadge.jsx: the overdue badge of the "today" screen.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { overdueOn } from './overdue.js';

export function OverdueBadge({ tasks, day }) {
  return null;
}

const styles = StyleSheet.create({
  badge: { gap: 6 },
  button: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, borderWidth: 1, borderColor: '#8a3b00', borderRadius: 8 },
});
