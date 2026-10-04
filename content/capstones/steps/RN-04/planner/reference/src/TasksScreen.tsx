// The list screen of the stack: the new-task form, the count of tasks due today and the tasks in a
// FlatList keyed by id. The list is read again from the repository every time the screen gets the
// focus. "Today" comes from the clock adapter and is asked again whenever the app returns to the
// foreground (AppState "active"): one subscription while the screen exists, removed in the cleanup of
// the same effect, so a day that changed while the app was in the background is counted right.
import { useCallback, useEffect, useState } from 'react';
import { AppState, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { countDueTasks } from '../domain/tasks.ts';
import type { Task } from '../domain/tasks.ts';
import type { TasksAction } from '../ui/tasksReducer.ts';
import type { RootStackParamList } from './navigation.ts';
import { useServices } from './services.tsx';
import { TaskForm } from './TaskForm.tsx';
import { TaskRow } from './TaskRow.tsx';

type TasksScreenProps = NativeStackScreenProps<RootStackParamList, 'List'>;

export function TasksScreen({ navigation }: TasksScreenProps) {
  const insets = useSafeAreaInsets();
  const { repository, format, clock, startingFailed } = useServices();
  const [tasks, setTasks] = useState<Task[] | null>(null); // null until the first read answers
  const [today, setToday] = useState(() => clock.today());
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void repository.readAll().then((next) => {
        if (active) {
          setTasks(next);
        }
      });
      return () => {
        active = false;
      };
    }, [repository]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        setToday(clock.today());
      }
    });
    return () => subscription.remove();
  }, [clock]);

  function apply(action: TasksAction) {
    void repository.apply(action).then(setTasks);
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <FlatList
        data={tasks ?? []}
        keyExtractor={(task) => task.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingLeft: insets.left + 16, paddingRight: insets.right + 16, paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={
          <View style={styles.top}>
            {startingFailed ? <Text style={styles.error}>%%loadDataError%%</Text> : null}
            <TaskForm task={null} onSave={(fields) => apply({ type: 'added', fields: fields })} />
            {tasks !== null ? <Text style={styles.due}>{'%%dueSummary%% ' + today + ': ' + countDueTasks(tasks, today)}</Text> : null}
            <Text role="heading" style={styles.heading}>%%listTitle%%</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>{tasks === null ? '%%loadingListMessage%%' : '%%emptyMessage%%'}</Text>}
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            format={format}
            confirming={item.id === confirmingId}
            onOpen={() => navigation.navigate('Detail', { id: item.id })}
            onToggle={() => apply({ type: 'doneToggled', id: item.id })}
            onDelete={() => setConfirmingId(item.id)}
            onConfirmDelete={() => {
              apply({ type: 'removed', id: item.id });
              setConfirmingId(null);
            }}
            onCancelDelete={() => setConfirmingId(null)}
          />
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  top: { gap: 8, paddingTop: 8 },
  due: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  heading: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', paddingTop: 8 },
  error: { fontSize: 15, color: '#b91c1c' },
  empty: { fontSize: 15, color: '#1a1a1a', paddingVertical: 12 },
});
