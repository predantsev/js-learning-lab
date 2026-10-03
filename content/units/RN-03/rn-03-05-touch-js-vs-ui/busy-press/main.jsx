// One task row. Its press handler also rebuilds a report over 50,000 synthetic archived tasks.
import { useLayoutEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const archive = Array.from({ length: 50000 }, (_, i) => ({
  id: `a-${i}`,
  title: `%%task%% ${(i * 7919) % 50000}`,
  done: true,
}));

const start = performance.now();
const at = () => `${Math.round(performance.now() - start)} ms`;

function buildReport(tasks) {
  const sorted = [...archive, ...tasks].sort((a, b) => a.title.localeCompare(b.title, 'uk'));
  return { total: sorted.length, done: sorted.filter((task) => task.done).length };
}

function App() {
  const [task, setTask] = useState({ id: 't-01', title: '%%water%%', done: false });
  const [report, setReport] = useState(() => buildReport([task]));

  useLayoutEffect(() => {
    console.log(`${at()}: the row shows done = ${task.done}`);
  }, [task.done]);

  function rebuildReport(tasks) {
    const t0 = performance.now();
    setReport(buildReport(tasks));
    console.log(`${at()}: report rebuilt in ${Math.round(performance.now() - t0)} ms`);
  }

  function handlePress() {
    console.log(`${at()}: onPress started`);
    const next = { ...task, done: !task.done };
    setTask(next);
    rebuildReport([next]); // heavy work right inside the handler
  }

  return (
    <View style={styles.screen}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ checked: task.done }}
        onPress={handlePress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <Text style={styles.title}>{task.done ? '✓ ' : '○ '}{task.title}</Text>
      </Pressable>
      <Text>%%report%%: {report.done} / {report.total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 12, gap: 12 },
  row: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#4b5563', borderRadius: 6 },
  pressed: { backgroundColor: '#dbeafe' },
  title: { fontSize: 16 },
});

createRoot(document.getElementById('root')).render(<App />);
