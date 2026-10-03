import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppState } from './appStateSim.jsx';
import { habits } from './habits.js';
import { useFocusEffect } from './navSim.jsx';

// Every refresh of the list is recorded here.
export const refreshLog = [];

export function ListScreen({ navigation }) {
  useFocusEffect(
    useCallback(() => {
      const subscription = AppState.addEventListener('change', (next) => {
        if (next === 'active') {
          refreshLog.push(next);
          console.log(`%%logRefresh%% ${refreshLog.length}`);
        }
      });
      return () => subscription.remove();
    }, []),
  );
  return habits.map((habit) => (
    <Pressable key={habit.id} accessibilityRole="button" style={styles.row} onPress={() => navigation.push('Detail', { id: habit.id })}>
      <Text>{habit.name}</Text>
    </Pressable>
  ));
}

export function DetailScreen({ route }) {
  // Forgot the case of an id that matches no habit.
  const habit = habits.find((item) => item.id === route.params.id);
  return (
    <View style={styles.column}>
      <Text testID="detail-name" style={styles.title}>
        {habit.name}
      </Text>
      <Text>
        %%doneDays%% {habit.completions.length}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: 8 },
  row: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, borderBottomWidth: 1, borderColor: '#d4d4d4' },
  title: { fontSize: 20, fontWeight: '600' },
});
