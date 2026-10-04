// OverdueBadge.jsx: the overdue badge of the "today" screen.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { overdueOn } from './overdue.js';

export function OverdueBadge({ tasks, day }) {
  const [open, setOpen] = useState(false);
  const overdue = overdueOn(tasks, day);

  return (
    <View style={styles.badge}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`%%overdueLabel%%: ${overdue.length}`}
        style={styles.button}
        onPress={() => setOpen((value) => !value)}
      >
        <Text>
          %%overdue%%: {overdue.length}
        </Text>
      </Pressable>
      {open ? overdue.map((task) => <Text key={task.id}>{task.title}</Text>) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { gap: 6 },
  button: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, borderWidth: 1, borderColor: '#8a3b00', borderRadius: 8 },
});
