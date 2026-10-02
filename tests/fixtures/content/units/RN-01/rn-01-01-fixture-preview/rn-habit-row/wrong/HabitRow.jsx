import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

// Misconception: setting the state to a fixed value instead of increasing it.
export function HabitRow({ name }) {
  const [count, setCount] = useState(0);
  return (
    <View>
      <Text role="heading">{name}</Text>
      {/* Each press should add one to count. */}
      <Pressable role="button" onPress={() => setCount(1)}>
        <Text>%%done%%: {count}</Text>
      </Pressable>
    </View>
  );
}
