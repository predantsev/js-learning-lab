// Wrong: native primitives, but the screen keeps its own copy of the habits in useState,
// so the shared reducer never runs and nothing reaches the storage.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useHabits } from './useHabits.js';

export function HabitList({ initialHabits, storage }) {
  const [sharedHabits] = useHabits(initialHabits, storage);
  const [habits, setHabits] = useState(sharedHabits);

  return (
    <View>
      {habits.map((habit) => (
        <View key={habit.id}>
          <Text>{habit.name}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setHabits(habits.map((h) => (h.id === habit.id ? { ...h, active: !h.active } : h)))}
          >
            <Text>{habit.active ? '%%pause%%' : '%%resume%%'}</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}
