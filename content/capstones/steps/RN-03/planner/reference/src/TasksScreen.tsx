// The planner screen: create, edit, mark and delete tasks. The list is a FlatList keyed by id, so a
// row keeps its state when the rows around it change. Every change is an action of tasksReducer
// (copied unchanged from the React project), and every new list is saved through the storage adapter.
// The adapters come from App.tsx: this screen does not know which platform made them.
import { useEffect, useReducer, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Task } from '../domain/tasks.ts';
import { tasksReducer } from '../ui/tasksReducer.ts';
import type { DateFormat, StorageAdapter } from './contracts.ts';
import { saveSnapshot } from './snapshot.ts';
import { TaskForm } from './TaskForm.tsx';
import { TaskRow } from './TaskRow.tsx';

type TasksScreenProps = {
  initialTasks: Task[];
  loadFailed: boolean;
  storage: StorageAdapter;
  format: DateFormat;
};

export function TasksScreen({ initialTasks, loadFailed, storage, format }: TasksScreenProps) {
  const insets = useSafeAreaInsets();
  const [tasks, dispatch] = useReducer(tasksReducer, initialTasks);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Every new list is saved; the reducer returns the same list for a refused action, so nothing
  // changes and nothing is saved then.
  useEffect(() => {
    void saveSnapshot(storage, tasks);
  }, [storage, tasks]);

  const sides = { paddingLeft: insets.left + 16, paddingRight: insets.right + 16 };
  return (
    <View style={styles.screen}>
      <View style={[styles.header, sides, { paddingTop: insets.top + 12 }]}>
        <Text role="heading" style={styles.title}>%%projectTitle%%</Text>
      </View>
      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          data={tasks}
          keyExtractor={(task) => task.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, sides, { paddingBottom: insets.bottom + 24 }]}
          ListHeaderComponent={
            <View style={styles.top}>
              {loadFailed ? <Text style={styles.error}>%%loadDataError%%</Text> : null}
              <TaskForm task={null} onSave={(fields) => dispatch({ type: 'added', fields: fields })} />
              <Text role="heading" style={styles.heading}>%%listTitle%%</Text>
            </View>
          }
          ListEmptyComponent={<Text style={styles.empty}>%%emptyMessage%%</Text>}
          renderItem={({ item }) =>
            item.id === editingId ? (
              <TaskForm
                task={item}
                onSave={(fields) => {
                  dispatch({ type: 'updated', id: item.id, fields: fields });
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <TaskRow
                task={item}
                format={format}
                confirming={item.id === confirmingId}
                onToggle={() => dispatch({ type: 'doneToggled', id: item.id })}
                onEdit={() => {
                  setConfirmingId(null);
                  setEditingId(item.id);
                }}
                onDelete={() => setConfirmingId(item.id)}
                onConfirmDelete={() => {
                  dispatch({ type: 'removed', id: item.id });
                  setConfirmingId(null);
                }}
                onCancelDelete={() => setConfirmingId(null)}
              />
            )
          }
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  header: { paddingBottom: 12, backgroundColor: '#e8eef7' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  body: { flex: 1 },
  content: { paddingTop: 8 },
  top: { gap: 8 },
  heading: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', paddingTop: 8 },
  error: { fontSize: 15, color: '#b91c1c' },
  empty: { fontSize: 15, color: '#1a1a1a', paddingVertical: 12 },
});
