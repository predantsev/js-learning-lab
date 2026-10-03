import { Pressable, Text, View } from 'react-native';
import { formatLabel } from './domain/format.js';

// A React Native card: the same props and the same formatLabel call,
// drawn with View, Text and Pressable.
export function TaskCard({ task, labels, onToggle }) {
  return (
    <View>
      <Text role="heading">{formatLabel(task, labels)}</Text>
      <Pressable role="button" onPress={onToggle}>
        <Text>{labels.toggle}</Text>
      </Pressable>
    </View>
  );
}
