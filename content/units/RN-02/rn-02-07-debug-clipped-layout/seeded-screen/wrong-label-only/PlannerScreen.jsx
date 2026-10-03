import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSimulatedInsets } from './DeviceFrame.jsx';
import { ScaledText as Text, ScaledTextInput as TextInput } from './Scaled.jsx';

export function PlannerScreen({ tasks, onDelete }) {
  const insets = useSimulatedInsets(); // on a device: useSafeAreaInsets()
  const [draft, setDraft] = useState('%%draft%%');
  return (
    <View style={styles.screen}>
      <View testID="header" style={[styles.header, { paddingTop: 12 + insets.top }]}>
        <Text testID="title" style={styles.heading}>%%heading%%</Text>
      </View>
      {tasks.map((task) => (
        <View key={task.id} testID="task" style={styles.row}>
          <Text style={styles.rowText}>{task.title}</Text>
          {/* Mistake: a label without a role — the reader says the words but not that it is a button. */}
          <Pressable testID="delete" accessibilityLabel={`%%remove%% ${task.title}`} onPress={() => onDelete(task.id)} style={styles.delete}>
            <Text style={styles.icon}>✕</Text>
          </Pressable>
        </View>
      ))}
      <View style={styles.form}>
        <Text style={styles.label}>%%newTask%%</Text>
        <TextInput testID="title-input" accessibilityLabel="%%newTask%%" value={draft} onChangeText={setDraft} style={styles.input} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#e8eef7' },
  heading: { fontSize: 18, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 16, borderBottomWidth: 1, borderColor: '#d4d4d4' },
  rowText: { fontSize: 14, flexShrink: 1 },
  delete: { padding: 12 },
  icon: { fontSize: 12, color: '#b91c1c' },
  form: { padding: 16, gap: 4 },
  label: { fontSize: 14 },
  // No fixed height: padding and the scaled text give the field its height.
  input: { minHeight: 44, paddingHorizontal: 10, paddingVertical: 10, fontSize: 16, borderWidth: 1, borderColor: '#767676', borderRadius: 6 },
});
