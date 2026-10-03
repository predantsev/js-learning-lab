// MessageList.jsx: the inbox. Make its rows dismissible (see the task).
import { FlatList, StyleSheet, Text, View } from 'react-native';

export function dismissActionProps(label, onDismiss) {
  return {};
}

function MessageRow({ message }) {
  return (
    <View testID={`row-${message.id}`} style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.from}>{message.from}</Text>
        <Text>{message.text}</Text>
      </View>
    </View>
  );
}

export function MessageList({ messages, pixelRatio, onDismissed }) {
  return (
    <FlatList
      data={messages}
      keyExtractor={(message) => message.id}
      renderItem={({ item }) => <MessageRow message={item} />}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 12, borderBottomWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#ffffff' },
  text: { flex: 1 },
  from: { fontWeight: '600' },
});
