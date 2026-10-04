// main.jsx: a stepper over paths.js. It draws text and counters only; nothing native runs here.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { paths } from './paths.js';

function Button({ label, onPress, selected = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.button, selected && styles.selected]}
      onPress={onPress}
    >
      <Text style={selected ? styles.selectedText : null}>{label}</Text>
    </Pressable>
  );
}

function Stepper() {
  const [arch, setArch] = useState('legacy');
  const [shown, setShown] = useState(0); // how many steps of the path are shown
  const path = paths[arch];
  const done = path.steps.slice(0, shown);
  const messages = done.filter((step) => step.crossing === 'message').length;
  const jsiCalls = done.filter((step) => step.crossing === 'jsi').length;

  const choose = (next) => {
    setArch(next);
    setShown(0);
  };

  return (
    <View style={styles.page}>
      <View style={styles.row}>
        <Button label={paths.legacy.label} selected={arch === 'legacy'} onPress={() => choose('legacy')} />
        <Button label={paths.newArch.label} selected={arch === 'newArch'} onPress={() => choose('newArch')} />
      </View>
      {done.map((step, index) => (
        <View key={index} style={[styles.step, step.crossing && styles.crossing]}>
          <Text style={styles.side}>
            {index + 1}. {step.side === 'js' ? 'JavaScript' : 'native'}
            {step.crossing === 'message' ? ' · %%bridgeTag%%' : ''}
            {step.crossing === 'jsi' ? ' · JSI' : ''}
          </Text>
          <Text>{step.text}</Text>
        </View>
      ))}
      <Text style={styles.count}>
        %%messagesLabel%%: {messages} · %%jsiLabel%%: {jsiCalls}
      </Text>
      <View style={styles.row}>
        <Button
          label={shown < path.steps.length ? '%%nextStep%%' : '%%finished%%'}
          onPress={() => setShown((n) => Math.min(n + 1, path.steps.length))}
        />
        <Button label="%%reset%%" onPress={() => setShown(0)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 12, gap: 8, maxWidth: 440 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#767676', borderRadius: 8, backgroundColor: '#ffffff' },
  selected: { backgroundColor: '#1f3f73', borderColor: '#1f3f73' },
  selectedText: { color: '#ffffff' },
  step: { padding: 8, gap: 2, borderWidth: 1, borderColor: '#bdbdbd', borderRadius: 6 },
  crossing: { borderColor: '#1f3f73', borderWidth: 2 },
  side: { fontWeight: '600' },
  count: { fontSize: 15, fontWeight: '600' },
});

createRoot(document.getElementById('root')).render(<Stepper />);
