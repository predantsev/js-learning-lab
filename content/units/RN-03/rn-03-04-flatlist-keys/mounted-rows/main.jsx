// 1,000 synthetic tasks: FlatList versus ScrollView with map. The counter shows mounted rows.
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const tasks = Array.from({ length: 1000 }, (_, i) => ({
  id: `t-${String(i + 1).padStart(4, '0')}`,
  title: `%%task%% ${i + 1}`,
  done: false,
}));

let mounted = 0; // rows that exist right now

function TaskRow({ task }) {
  useEffect(() => {
    mounted += 1;
    return () => {
      mounted -= 1;
    };
  }, []);
  return (
    <View style={styles.row}>
      <Text>{task.title}</Text>
    </View>
  );
}

function App() {
  const [mode, setMode] = useState('flat');
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCount(mounted), 200);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.screen}>
      <Pressable accessibilityRole="button" style={styles.toggle} onPress={() => setMode(mode === 'flat' ? 'scroll' : 'flat')}>
        <Text>{mode === 'flat' ? 'FlatList' : 'ScrollView + map'} — %%switch%%</Text>
      </Pressable>
      <Text accessibilityLiveRegion="polite">%%mounted%%: {count}</Text>
      <View style={styles.viewport}>
        {mode === 'flat' ? (
          <FlatList data={tasks} keyExtractor={(task) => task.id} renderItem={({ item }) => <TaskRow task={item} />} />
        ) : (
          <ScrollView>
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 12, gap: 8 },
  toggle: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#4b5563', borderRadius: 6 },
  viewport: { height: 320, borderWidth: 1, borderColor: '#4b5563' },
  row: { height: 40, justifyContent: 'center', paddingHorizontal: 12, borderBottomWidth: 1, borderColor: '#d1d5db' },
});

createRoot(document.getElementById('root')).render(<App />);
