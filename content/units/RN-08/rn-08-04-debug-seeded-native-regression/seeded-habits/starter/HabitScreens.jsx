// HabitScreens.jsx (read-only): the list and the detail screens of the habit tracker.
import { useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRepo } from './habitRepo.js';
import { TODAY } from './habits.js';

export function ListScreen({ navigation }) {
  const repo = useRepo();
  const { status, habits } = useSyncExternalStore(repo.subscribe, repo.getState);
  if (status === 'loading') return <Text>%%loading%%</Text>;
  if (status === 'failed') return <Text accessibilityRole="alert">%%loadFailed%%</Text>;
  return (
    <View style={styles.column}>
      {habits.length === 0 ? <Text>%%noHabits%%</Text> : null}
      {habits.map((habit) => (
        <Pressable
          key={habit.id}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: habit.completions.includes(TODAY) }}
          style={styles.row}
          onPress={() => repo.toggleToday(habit.id)}
        >
          <Text>
            {habit.completions.includes(TODAY) ? '✓ ' : '○ '}
            {habit.name}
          </Text>
        </Pressable>
      ))}
      <Pressable accessibilityRole="button" style={styles.button} onPress={() => navigation.push('Week')}>
        <Text>%%openWeek%%</Text>
      </Pressable>
    </View>
  );
}

export function DetailScreen({ route }) {
  const repo = useRepo();
  const { habits } = useSyncExternalStore(repo.subscribe, repo.getState);
  const habit = habits.find((item) => item.id === route.params.id);
  if (!habit) return <Text>%%notFound%%</Text>;
  return (
    <View style={styles.column}>
      <Text accessibilityRole="header" style={styles.title}>
        {habit.name}
      </Text>
      <Text>
        %%doneDays%% {habit.completions.length}
      </Text>
      <Pressable accessibilityRole="button" style={styles.button} onPress={() => repo.toggleToday(habit.id)}>
        <Text>{habit.completions.includes(TODAY) ? '%%unmarkToday%%' : '%%markToday%%'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: 8 },
  row: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, borderBottomWidth: 1, borderColor: '#d4d4d4' },
  button: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#767676', borderRadius: 8 },
  title: { fontSize: 20, fontWeight: '600' },
});
