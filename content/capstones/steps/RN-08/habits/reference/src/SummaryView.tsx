// What the week screen shows, without loading anything: per habit seven cells, the oldest day first,
// and the weekly rate. A screen reader hears every cell as its date and "done" or "missed", and the
// rate as a sentence.
import { StyleSheet, Text, View } from 'react-native';
import type { Habit } from '../domain/habits.ts';
import { weekRow } from './summary.ts';

export function SummaryView({ habits, today }: { habits: Habit[]; today: string }) {
  return (
    <View style={styles.view}>
      {habits.map((habit) => {
        const row = weekRow(habit, today);
        const rate = '%%weekRateLabel%%: ' + Math.round(row.rate * 100) + '%';
        return (
          <View key={habit.id} style={styles.habit}>
            <Text role="heading" style={styles.name}>{habit.name}</Text>
            <View style={styles.cells}>
              {row.cells.map((cell) => (
                <Text key={cell.day} accessibilityLabel={cell.day + ': ' + (cell.done ? '%%doneDayMark%%' : '%%missedDayMark%%')} style={[styles.cell, cell.done ? styles.done : styles.missed]}>
                  {cell.done ? '✓' : '·'}
                </Text>
              ))}
            </View>
            <Text style={styles.rate}>{rate}</Text>
          </View>
        );
      })}
      <Text style={styles.note}>%%savedOnDeviceNote%%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  view: { gap: 12 },
  habit: { gap: 6, paddingVertical: 8, borderBottomWidth: 1, borderColor: '#d4d4d4' },
  name: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  cells: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: { minWidth: 36, minHeight: 36, textAlign: 'center', textAlignVertical: 'center', fontSize: 18, borderWidth: 1, borderRadius: 4 },
  done: { borderColor: '#2f6b2f', color: '#2f6b2f' },
  missed: { borderColor: '#767676', color: '#4a4a4a' },
  rate: { fontSize: 15, color: '#1a1a1a' },
  note: { fontSize: 14, color: '#4a4a4a' },
});
