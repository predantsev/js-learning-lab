// One habit in the list: the name, the frequency in words, the active or paused mark and whether it
// is completed today, then its actions. Today comes from the clock adapter through the screen. A
// delete asks first, inside the row. A screen reader hears the text part as one sentence.
import { StyleSheet, Text, View } from 'react-native';
import { formatHabitLabel, frequencyText } from '../domain/habits.ts';
import type { Habit } from '../domain/habits.ts';
import { ActionButton } from './ActionButton.tsx';

type HabitRowProps = {
  habit: Habit;
  today: string; // "YYYY-MM-DD" from the clock adapter
  confirming: boolean; // the delete question is open
  onMarkToday: () => void;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
};

export function HabitRow({ habit, today, confirming, onMarkToday, onToggleActive, onEdit, onDelete, onConfirmDelete, onCancelDelete }: HabitRowProps) {
  const state = habit.active ? '%%activeMark%%' : '%%pausedMark%%';
  const doneToday = habit.completions.includes(today);
  const label = (habit.active ? formatHabitLabel(habit) + ' · ' + state : formatHabitLabel(habit)) + (doneToday ? ', %%doneTodayMark%%' : '');
  return (
    <View style={styles.row}>
      <View style={styles.line} accessible={true} accessibilityLabel={label}>
        <View style={styles.text}>
          <Text style={styles.name}>{habit.name}</Text>
          <Text style={styles.meta}>{frequencyText(habit.frequency)}</Text>
          {doneToday ? <Text style={styles.done}>%%doneTodayMark%%</Text> : null}
        </View>
        <Text style={habit.active ? styles.active : styles.paused}>{state}</Text>
      </View>
      {confirming ? (
        <View style={styles.actions}>
          <Text style={styles.question}>%%confirmQuestion%%</Text>
          <ActionButton text="%%confirmDeleteLabel%%" kind="danger" onPress={onConfirmDelete} />
          <ActionButton text="%%cancelLabel%%" onPress={onCancelDelete} />
        </View>
      ) : (
        <View style={styles.actions}>
          {habit.active && !doneToday ? <ActionButton text="%%markTodayLabel%%" onPress={onMarkToday} /> : null}
          <ActionButton text={habit.active ? '%%pauseLabel%%' : '%%resumeLabel%%'} onPress={onToggleActive} />
          <ActionButton text="%%editLabel%%" onPress={onEdit} />
          <ActionButton text="%%deleteLabel%%" kind="danger" onPress={onDelete} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderColor: '#d4d4d4' },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  text: { flexShrink: 1, flexGrow: 1, gap: 2 },
  name: { fontSize: 16, color: '#1a1a1a' },
  meta: { fontSize: 14, color: '#4a4a4a' },
  done: { fontSize: 14, color: '#2f6b2f' },
  active: { fontSize: 14, color: '#2f6b2f' },
  paused: { fontSize: 14, color: '#4a4a4a' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  question: { fontSize: 15, color: '#1a1a1a', flexBasis: '100%' },
});
