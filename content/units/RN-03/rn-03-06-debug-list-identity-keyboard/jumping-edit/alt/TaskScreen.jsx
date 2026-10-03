// A variant: no keyExtractor at all — FlatList takes item.id by default.
import { useReducer, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { tasksReducer } from './tasksReducer.js';

function TaskRow({ task, onRename, onRemove }) {
  const [draft, setDraft] = useState(task.title);
  return (
    <View style={styles.row}>
      <TextInput
        accessibilityLabel={`%%rename%%: ${task.title}`}
        style={styles.input}
        value={draft}
        onChangeText={setDraft}
        returnKeyType="done"
        onSubmitEditing={() => onRename(draft)}
      />
      <Pressable accessibilityRole="button" accessibilityLabel={`%%remove%%: ${task.title}`} style={styles.remove} onPress={onRemove}>
        <Text>✕</Text>
      </Pressable>
    </View>
  );
}

export function TaskScreen({ initialTasks }) {
  const [tasks, dispatch] = useReducer(tasksReducer, initialTasks);
  return (
    <FlatList
      data={tasks}
      renderItem={({ item }) => (
        <TaskRow
          task={item}
          onRename={(title) => dispatch({ type: 'rename', id: item.id, title })}
          onRemove={() => dispatch({ type: 'remove', id: item.id })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 },
  input: { flex: 1, minHeight: 48, borderWidth: 1, borderColor: '#4b5563', borderRadius: 6, paddingHorizontal: 8 },
  remove: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
