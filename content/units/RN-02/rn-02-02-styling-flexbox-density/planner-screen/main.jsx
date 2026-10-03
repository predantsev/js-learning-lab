// A planner screen inside a phone-sized frame (300 × 420 units) in the browser preview.
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, View } from 'react-native';
import { ScaledText as Text } from './ScaledText.jsx';

const tasks = [
  { id: 't-01', title: '%%water%%' },
  { id: 't-02', title: '%%books%%' },
  { id: 't-05', title: '%%dentist%%' },
];

function PlannerScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.heading}>%%today%%</Text>
      </View>
      <View style={styles.list}>
        {tasks.map((task) => (
          <View key={task.id} style={styles.row}>
            <Text style={styles.rowText}>{task.title}</Text>
          </View>
        ))}
      </View>
      <View style={styles.bar}>
        <Pressable role="button" style={styles.button}>
          <Text style={styles.buttonText}>%%add%%</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // The frame stands in for a phone screen. No flexDirection: React Native's default is 'column'.
  screen: { width: 300, height: 420, borderWidth: 1, borderColor: '#767676' },
  header: { padding: 12, backgroundColor: '#e8eef7' },
  heading: { fontSize: 20, fontWeight: '600' },
  list: { backgroundColor: '#ffffff' },
  // A fixed height that does not grow with the text; overflow: 'hidden' cuts off what does not fit.
  row: { height: 40, paddingHorizontal: 12, justifyContent: 'center', overflow: 'hidden', borderBottomWidth: 1, borderColor: '#d4d4d4' },
  rowText: { fontSize: 16 },
  bar: { padding: 12, backgroundColor: '#e8eef7' },
  button: { minHeight: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1d4ed8', borderRadius: 8 },
  buttonText: { fontSize: 16, color: '#ffffff' },
});

createRoot(document.getElementById('root')).render(<PlannerScreen />);
