// Question 2: a habits screen with a mount effect and a focus effect (simulated stack: navSim.jsx).
import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from './navSim.jsx';

export function TodayScreen({ navigation, route }) {
  useEffect(() => {
    console.log('Today: mounted');
    return () => console.log('Today: unmounted');
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('Today: listening');
      return () => console.log('Today: stopped');
    }, []),
  );

  return route.params.habits.map((habit) => (
    <Pressable key={habit.id} accessibilityRole="button" style={styles.row} onPress={() => navigation.push('Detail', { name: habit.name })}>
      <Text>{habit.name}</Text>
    </Pressable>
  ));
}

export function DetailScreen({ route }) {
  return <Text style={styles.title}>{route.params.name}</Text>;
}

const styles = StyleSheet.create({
  row: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, borderBottomWidth: 1, borderColor: '#d4d4d4' },
  title: { fontSize: 20, fontWeight: '600' },
});
