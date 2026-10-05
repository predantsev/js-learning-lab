import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// One book in the reading log, with a toggle between "reading" and "finished" (read-only).
export function BookRow({ book }) {
  const [finished, setFinished] = useState(book.finished);
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{book.title}</Text>
      <Text>{finished ? '%%finished%%' : '%%reading%%'}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`%%markFinished%%: ${book.title}`}
        onPress={() => setFinished((value) => !value)}
        style={styles.toggle}
      >
        <Text>{finished ? '✓' : '○'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 },
  title: { flex: 1 },
  toggle: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#4b5563', borderRadius: 6 },
});
