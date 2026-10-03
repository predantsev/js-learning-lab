import { Text, View } from 'react-native';
import { formatLabel } from './domain/format.js';

// Misconception: "a View with a button role and onClick is a button" — on a phone a tap does not call onClick.
export function TaskCard({ task, labels, onToggle }) {
  return (
    <View>
      <Text role="heading">{formatLabel(task, labels)}</Text>
      <View role="button" onClick={onToggle}>
        <Text>{labels.toggle}</Text>
      </View>
    </View>
  );
}
