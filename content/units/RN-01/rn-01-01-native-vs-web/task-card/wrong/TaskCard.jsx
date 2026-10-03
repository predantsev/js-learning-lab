import { Pressable, Text } from 'react-native';
import { formatLabel } from './domain/format.js';

// Misconception: "the outer <div> is fine, React Native wraps my web page anyway".
export function TaskCard({ task, labels, onToggle }) {
  return (
    <div className="card">
      <Text role="heading">{formatLabel(task, labels)}</Text>
      <Pressable role="button" onPress={onToggle}>
        <Text>{labels.toggle}</Text>
      </Pressable>
    </div>
  );
}
