// The list screen of the stack — a swipe to the left acts on a row, with an undo bar — (it also says when a damaged snapshot was set aside, and offers a new
// read when the storage could not be read): the new-habit form and the habits in a FlatList keyed by id. The list
// is read again from the repository every time the screen gets the focus. "Today" comes from the
// clock adapter and is asked again whenever the app returns to the foreground (AppState "active"): one
// subscription while the screen exists, removed in the cleanup of the same effect, so after midnight
// "completed today" and "mark today" belong to the new day.
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { SYNTHETIC_COUNT } from './devConfig.ts';
import { measureJsFrames, runScrollScript } from './perfTools.ts';
import { SwipeRow } from './SwipeRow.tsx';
import { UndoBar } from './UndoBar.tsx';
import { useReducedMotion } from './useReducedMotion.ts';

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
  const reducedMotion = useReducedMotion(); // one subscription for all rows
  const [undo, setUndo] = useState<{ key: number; message: string; previous: Habit[] } | null>(null);
  const listRef = useRef<FlatList<Habit>>(null);
  const [report, setReport] = useState<string | null>(null); // the last measurement

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

  // A swipe: the action is saved at once, and the list as it was before stays for the undo bar.
  function swipe(action: HabitsAction, message: string) {
    const previous = habits;
    void repository.apply(action).then(
      (next) => {
        setHabits(next);
        if (previous !== null) {
          setUndo({ key: Date.now(), message: message, previous: previous });
        }
      },
      () => setFailed(true),
    );
  }

  function undoLast() {
    if (undo !== null) {
      void repository.restore(undo.previous).then(setHabits, () => setFailed(true));
      setUndo(null);
    }
  }

  // The fixed scroll script and the JS frame meter run together; the line says which build measured.
  async function measure() {
    setReport('…');
    const [frames] = await Promise.all([measureJsFrames(10000), runScrollScript(listRef.current)]);
    setReport((__DEV__ ? 'DEV JS' : 'PROD JS') + ' · ' + (habits?.length ?? 0) + ' rows · ' + frames.jsFps + ' JS fps · ' + frames.longFrames + ' long frames · worst ' + frames.worstMs + ' ms');
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <FlatList
        ref={listRef}
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
            {__DEV__ ? <ActionButton text="%%serviceLinkLabel%%" onPress={() => navigation.navigate('Service')} /> : null}
            {SYNTHETIC_COUNT > 0 ? (
              <View style={styles.failed}>
                <ActionButton text="%%measureLabel%%" onPress={() => void measure()} />
                {report !== null ? <Text style={styles.report}>{report}</Text> : null}
              </View>
            ) : null}
            <Text role="heading" style={styles.heading}>%%listTitle%%</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>{habits === null ? '%%loadingListMessage%%' : '%%emptyMessage%%'}</Text>}
        renderItem={({ item }) => (
          <SwipeRow
            actionLabel={'%%markTodayLabel%%'}
            reducedMotion={reducedMotion}
            leaves={false}
            enabled={item.active && !item.completions.includes(today)}
            onSwipe={() => swipe({ type: 'completionAdded', id: item.id, day: today }, '%%announceMarked%%'.replace('{name}', item.name))}
          >
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
          </SwipeRow>
        )}
      />
      {undo !== null ? <UndoBar key={undo.key} message={undo.message} onUndo={undoLast} onClose={() => setUndo(null)} /> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  top: { gap: 8, paddingTop: 8 },
  heading: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', paddingTop: 8 },
  error: { fontSize: 15, color: '#b91c1c' },
  failed: { gap: 8 },
  report: { fontSize: 14, color: '#1a1a1a' },
  empty: { fontSize: 15, color: '#1a1a1a', paddingVertical: 12 },
});
