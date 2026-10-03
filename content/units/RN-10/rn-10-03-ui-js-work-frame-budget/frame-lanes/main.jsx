// A 300 ms fade of a habit row while a synchronous sort of the habit list blocks the JS thread for 200 ms.
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { simulateFade } from './frameLanes.js';

const HZ = 60;           // the screen's refresh rate
const DRIVER = 'js';     // 'js' or 'native' — who computes the fade's frames
const DEFER_SORT = false; // true: start the sort only after the fade has ended
const FADE_MS = 300;
const SORT_STARTS_AT = DEFER_SORT ? FADE_MS : 50;
const SORT_MS = 200;

const frames = simulateFade({ hz: HZ, durationMs: FADE_MS, driver: DRIVER, busy: [{ start: SORT_STARTS_AT, end: SORT_STARTS_AT + SORT_MS }] });
const dropped = frames.filter((f) => f.dropped).length;
const firstDropped = frames.find((f) => f.dropped);

console.log(`${HZ} Hz, driver: ${DRIVER}, budget per frame: ${(1000 / HZ).toFixed(2)} ms`);
console.log(`%%dropped%%: ${dropped} / ${frames.length}`);
if (firstDropped) console.log(`%%first%%: #${firstDropped.frame} (${firstDropped.startMs} ms)`);

function Lane({ label, cells }) {
  return (
    <View style={styles.lane}>
      <Text style={styles.laneLabel}>{label}</Text>
      <View style={styles.cells}>
        {cells.map((cell, i) => (
          <Text key={i} style={[styles.cell, cell.style]}>{cell.mark}</Text>
        ))}
      </View>
    </View>
  );
}

function App() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>%%title%%</Text>
      <Lane label="%%jsLane%%" cells={frames.map((f) => ({ mark: f.jsBusy ? 'S' : '·', style: f.jsBusy && styles.busy }))} />
      <Lane label="%%uiLane%%" cells={frames.map((f) => ({ mark: f.dropped ? '✕' : '✓', style: f.dropped && styles.dropped }))} />
      <Text>%%legend%%</Text>
      <Text>%%dropped%%: {dropped} / {frames.length}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 12, gap: 10 },
  title: { fontSize: 16, fontWeight: '600' },
  lane: { gap: 4 },
  laneLabel: { fontSize: 14 },
  cells: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  cell: { width: 20, height: 24, textAlign: 'center', lineHeight: 24, borderWidth: 1, borderColor: '#4b5563' },
  busy: { backgroundColor: '#fde68a' },
  dropped: { backgroundColor: '#fecaca' },
});

createRoot(document.getElementById('root')).render(<App />);
