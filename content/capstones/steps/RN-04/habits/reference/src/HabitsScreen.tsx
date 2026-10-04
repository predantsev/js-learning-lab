// The list screen of the stack: the new-habit form and the habits in a FlatList keyed by id. The list
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
import type { RootStackParamList } from './navigation.ts';
import { useServices } from './services.tsx';

type HabitsScreenProps = NativeStackScreenProps<RootStackParamList, 'List'>;

export function HabitsScreen({ navigation }: HabitsScreenProps) {
  const insets = useSafeAreaInsets();
  const { repository, clock, startingFailed } = useServices();
  const [habits, setHabits] = useState<Habit[] | null>(null); // null until the first read answers
  const [today, setToday] = useState(() => clock.today());
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void repository.readAll().then((next) => {
        if (active) {
          setHabits(next);
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

  function apply(action: HabitsAction) {
    void repository.apply(action).then(setHabits);
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
  empty: { fontSize: 15, color: '#1a1a1a', paddingVertical: 12 },
});
