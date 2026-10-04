// The list screen of the stack (it also says when a damaged snapshot was set aside, and offers a new
// read when the storage could not be read): the new-habit form and the habits in a FlatList keyed by id. The list
// is read again from the repository every time the screen gets the focus. "Today" comes from the
// clock adapter and is asked again whenever the app returns to the foreground (AppState "active"): one
// subscription while the screen exists, removed in the cleanup of the same effect, so after midnight
// "completed today" and "mark today" belong to the new day.
import { useCallback, useEffect, useState } from 'react';
import { AppState, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Habit } from '../domain/habits.ts';
import type { HabitsAction } from '../ui/habitsReducer.ts';
import { HabitForm } from './HabitForm.tsx';
import { HabitRow } from './HabitRow.tsx';
import { ActionButton } from './ActionButton.tsx';
import type { RootStackParamList } from './navigation.ts';
import { useServices } from './services.tsx';

type HabitsScreenProps = NativeStackScreenProps<RootStackParamList, 'List'>;

export function HabitsScreen({ navigation }: HabitsScreenProps) {
  const insets = useSafeAreaInsets();
  const { repository, clock, startingFailed } = useServices();
  const [habits, setHabits] = useState<Habit[] | null>(null); // null until the first read answers
  const [today, setToday] = useState(() => clock.today());
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false); // the storage could not be read
  const [recovered, setRecovered] = useState(false); // a damaged snapshot was set aside
  const [attempt, setAttempt] = useState(0); // a new value reads again

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void repository.readAll().then(
        (read) => {
          if (active) {
            setHabits(read.records);
            setFailed(false);
            if (read.recovered) {
              setRecovered(true);
            }
          }
        },
        () => {
          if (active) {
            setFailed(true);
          }
        },
      );
      return () => {
        active = false;
      };
    }, [repository, attempt]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        setToday(clock.today());
      }
    });
    return () => subscription.remove();
  }, [clock]);

  function apply(action: HabitsAction) {
    void repository.apply(action).then(setHabits, () => setFailed(true));
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <FlatList
        data={habits ?? []}
        keyExtractor={(habit) => habit.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingLeft: insets.left + 16, paddingRight: insets.right + 16, paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={
          <View style={styles.top}>
            {startingFailed ? <Text style={styles.error}>%%loadDataError%%</Text> : null}
            {recovered ? <Text style={styles.error}>%%loadErrorMessage%%</Text> : null}
            {failed ? (
              <View style={styles.failed}>
                <Text style={styles.error}>%%listLoadFailedMessage%%</Text>
                <ActionButton text="%%retryLoadLabel%%" onPress={() => setAttempt(attempt + 1)} />
              </View>
            ) : null}
            <HabitForm habit={null} onSave={(fields) => apply({ type: 'added', fields: fields })} />
            <Text role="heading" style={styles.heading}>%%listTitle%%</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>{habits === null ? '%%loadingListMessage%%' : '%%emptyMessage%%'}</Text>}
        renderItem={({ item }) => (
          <HabitRow
            habit={item}
            today={today}
            confirming={item.id === confirmingId}
            onOpen={() => navigation.navigate('Detail', { id: item.id })}
            onMarkToday={() => apply({ type: 'completionAdded', id: item.id, day: today })}
            onToggleActive={() => apply({ type: 'activeToggled', id: item.id })}
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
  heading: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', paddingTop: 8 },
  error: { fontSize: 15, color: '#b91c1c' },
  failed: { gap: 8 },
  empty: { fontSize: 15, color: '#1a1a1a', paddingVertical: 12 },
});
