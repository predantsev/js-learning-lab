import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ScreenProps } from './routes.ts';
import { tasks } from './tasks.js';

export function ListScreen({ navigation }: ScreenProps<'List'>) {
  const all = tasks.useRecords();
  return all.map((task) => (
    <Pressable key={task.id} accessibilityRole="button" style={styles.row} onPress={() => navigation.push('Detail', { id: task.id })}>
      <Text>{task.title}</Text>
    </Pressable>
  ));
}

export function DetailScreen({ navigation, route }: ScreenProps<'Detail'>) {
  const all = tasks.useRecords();
  // Forgot the case of an id that matches no task.
  const task = all.find((item) => item.id === route.params.id);
  return (
    <View style={styles.column}>
      <Text testID="detail-title" style={styles.title}>
        {task.title}
      </Text>
      <Text>
        %%dueLabel%% {task.dueDate}
      </Text>
      <Pressable accessibilityRole="button" style={styles.row} onPress={() => navigation.push('Edit', { id: task.id })}>
        <Text>%%edit%%</Text>
      </Pressable>
    </View>
  );
}

// Ready-made: the edit screen looks its task up by id and saves through the shared state.
export function EditScreen({ navigation, route }: ScreenProps<'Edit'>) {
  const task = tasks.useRecords().find((item) => item.id === route.params.id);
  const [title, setTitle] = useState(task?.title ?? '');
  if (!task) return <Text>%%notFound%%</Text>;
  return (
    <View style={styles.column}>
      <TextInput accessibilityLabel="%%titleLabel%%" value={title} onChangeText={setTitle} style={styles.input} />
      <Pressable
        accessibilityRole="button"
        style={styles.row}
        onPress={() => {
          tasks.update(task.id, { title });
          navigation.goBack();
        }}
      >
        <Text>%%save%%</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: 8 },
  row: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, borderBottomWidth: 1, borderColor: '#d4d4d4' },
  title: { fontSize: 20, fontWeight: '600' },
  input: { minHeight: 44, paddingHorizontal: 10, borderWidth: 1, borderColor: '#767676', borderRadius: 6 },
});
