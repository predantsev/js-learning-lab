// Replays three finger paths over an expense row inside a vertical list and shows who owns the touch.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { arbitrate } from './gestureSim.js';

// The row's pan gesture, as you would configure it on a device:
// Gesture.Pan().activeOffsetX([-12, 12]).failOffsetY([-8, 8])
const ACTIVE_OFFSET_X = 12;
const FAIL_OFFSET_Y = 8;

const PATHS = {
  vertical: [{ x: 1, y: 4 }, { x: 2, y: 9 }, { x: 3, y: 16 }, { x: 4, y: 30 }],
  diagonal: [{ x: 5, y: 4 }, { x: 10, y: 7 }, { x: 14, y: 11 }, { x: 20, y: 16 }],
  horizontal: [{ x: 6, y: 1 }, { x: 14, y: 2 }, { x: 30, y: 3 }, { x: 60, y: 4 }],
};
const NAMES = { vertical: '%%vertical%%', diagonal: '%%diagonal%%', horizontal: '%%horizontal%%' };
const OWNERS = { nobody: '%%nobody%%', row: '%%row%%', list: '%%list%%' };

function App() {
  const [result, setResult] = useState(null);

  function replay(name) {
    const steps = arbitrate(PATHS[name], { activeOffsetX: ACTIVE_OFFSET_X, failOffsetY: FAIL_OFFSET_Y });
    console.log(`${NAMES[name]}:`);
    for (const step of steps) console.log(`  (${step.x}, ${step.y}) → ${OWNERS[step.owner]}`);
    setResult({ name, owner: steps.at(-1).owner });
  }

  return (
    <View style={styles.screen}>
      <View style={styles.list}>
        <Text style={styles.row}>%%groceries%%</Text>
        <Text style={[styles.row, styles.touched]}>%%pass%%</Text>
        <Text style={styles.row}>%%coffee%%</Text>
      </View>
      <View style={styles.buttons}>
        {Object.keys(PATHS).map((name) => (
          <Pressable key={name} accessibilityRole="button" onPress={() => replay(name)} style={styles.button}>
            <Text style={styles.buttonText}>{NAMES[name]}</Text>
          </Pressable>
        ))}
      </View>
      <Text accessibilityLiveRegion="polite">
        {result ? `${NAMES[result.name]} → ${OWNERS[result.owner]}` : '%%pick%%'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 12, gap: 12 },
  list: { borderWidth: 1, borderColor: '#4b5563', borderRadius: 6 },
  row: { padding: 12, fontSize: 16 },
  touched: { backgroundColor: '#dbeafe' },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: '#1d4ed8', borderRadius: 6 },
  buttonText: { color: '#ffffff', fontWeight: '600' },
});

createRoot(document.getElementById('root')).render(<App />);
