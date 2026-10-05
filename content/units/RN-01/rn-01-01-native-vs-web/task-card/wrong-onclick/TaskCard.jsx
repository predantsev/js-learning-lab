import { Text, View } from 'react-native';
import { formatLabel } from './domain/format.js';

// Misconception: onClick moves over from the web; on a phone a finger tap does not call a View's onClick.
export function TaskCard({ task, labels, onToggle }) {
  return (
    <View>
      <Text role="heading">{formatLabel(task, labels)}</Text>
      <View onClick={onToggle}>
        <Text>{labels.toggle}</Text>
      </View>
    </View>
  );
}
