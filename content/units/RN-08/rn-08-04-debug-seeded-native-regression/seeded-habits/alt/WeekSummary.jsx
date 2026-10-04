// WeekSummary.jsx: the week screen — the completion rate of all habits over the last seven days.
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRepo } from './habitRepo.js';
import { WEEK, weeklyRate } from './habits.js';

export function WeekScreen({ navigation }) {
  const repo = useRepo();
  const [rate, setRate] = useState(() => weeklyRate(repo.getHabits(), WEEK));

  // Keep the rate up to date while this screen is focused, and only then.
  useEffect(() => {
    let unsubscribe = null;
    function recalculate() {
      console.log('week: recalculated');
      setRate(weeklyRate(repo.getHabits(), WEEK));
    }
    function stop() {
      if (unsubscribe) unsubscribe();
      unsubscribe = null;
    }
    const removeFocus = navigation.addListener('focus', () => {
      stop();
      recalculate();
      unsubscribe = repo.subscribe(recalculate);
    });
    const removeBlur = navigation.addListener('blur', stop);
    return () => {
      removeFocus();
      removeBlur();
      stop();
    };
  }, [navigation, repo]);

  return (
    <View style={styles.column}>
      <Text accessibilityRole="header" style={styles.rate}>
        %%weekRate%% {rate}%
      </Text>
      {repo.getHabits().map((habit) => (
        <Pressable key={habit.id} accessibilityRole="button" style={styles.row} onPress={() => navigation.push('Detail', { id: habit.id })}>
          <Text>{habit.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: 8 },
  rate: { fontSize: 20, fontWeight: '600' },
  row: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, borderBottomWidth: 1, borderColor: '#d4d4d4' },
});
