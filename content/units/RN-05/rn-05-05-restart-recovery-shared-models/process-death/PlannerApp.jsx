import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const KEY = 'jsll.planner.v1';
const DRAFT_KEY = 'jsll.planner.v1.draft';
const PERSIST_DRAFT = false; // save the half-typed title too?

export function PlannerApp({ storage, labels }) {
  const [status, setStatus] = useState('loading');
  const [tasks, setTasks] = useState([]);
  const [draft, setDraft] = useState('');

  // Restore on launch: everything that was only in memory starts from scratch.
  useEffect(() => {
    Promise.all([storage.getItem(KEY), PERSIST_DRAFT ? storage.getItem(DRAFT_KEY) : null]).then(([text, savedDraft]) => {
      setTasks(text === null ? [] : JSON.parse(text).records);
      setDraft(savedDraft ?? '');
      setStatus('ready');
    });
  }, [storage]);

  const changeDraft = (text) => {
    setDraft(text);
    if (PERSIST_DRAFT) storage.setItem(DRAFT_KEY, text);
  };

  const add = () => {
    const title = draft.trim();
    if (title === '') return;
    const next = [...tasks, { id: `t-${Date.now()}`, title, dueDate: null, done: false, priority: 'normal' }];
    setTasks(next);
    changeDraft('');
    storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: next }));
  };

  if (status === 'loading') return <Text style={styles.screen}>{labels.loading}</Text>;
  return (
    <View style={styles.screen}>
      {tasks.map((task) => (
        <Text key={task.id} style={styles.row}>{task.title}</Text>
      ))}
      <Text>{labels.newTask}</Text>
      <TextInput accessibilityLabel={labels.newTask} value={draft} onChangeText={changeDraft} style={styles.input} />
      <Pressable role="button" style={styles.button} onPress={add}>
        <Text style={styles.buttonText}>{labels.add}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 8 },
  row: { paddingVertical: 8, borderBottomWidth: 1, borderColor: '#d4d4d4' },
  input: { minHeight: 44, paddingHorizontal: 10, borderWidth: 1, borderColor: '#767676', borderRadius: 6 },
  button: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: '#1d4ed8', borderRadius: 6 },
  buttonText: { color: '#ffffff' },
});
