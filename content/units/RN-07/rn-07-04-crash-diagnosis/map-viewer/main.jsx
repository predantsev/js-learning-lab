// The labeled stack viewer: the minified frames, mapped through the chosen source map.
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { crash } from './releaseStack.js';
import { sourceMaps } from './sourceMaps.js';
import { mapBuild } from './settings.js';

// The last map entry that starts at or before the frame's column.
function lookup(map, column) {
  return map.filter((entry) => entry.from <= column).at(-1) ?? null;
}

const map = mapBuild ? sourceMaps[mapBuild] : null;
const lines = crash.frames.map((frame) => {
  const where = `${frame.file}:${frame.line}:${frame.column}`;
  const found = map && lookup(map, frame.column);
  return found ? `at ${found.name} (${found.file}:${found.line})` : `at ${frame.name} (${where})`;
});

console.log(crash.message);
for (const line of lines) console.log(`  ${line}`);
console.log(`%%stackOf%% ${crash.build} · %%mapOf%% ${mapBuild ?? '—'}`);

function StackView() {
  return (
    <View style={styles.box}>
      <Text style={styles.message}>{crash.message}</Text>
      {lines.map((line, index) => <Text key={index} style={styles.frame}>{line}</Text>)}
      <Text>%%stackOf%% {crash.build} · %%mapOf%% {mapBuild ?? '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: 10, gap: 4 },
  message: { fontWeight: '600', color: '#b91c1c' },
  frame: { fontFamily: 'monospace', fontSize: 12 },
});

createRoot(document.getElementById('root')).render(<StackView />);
