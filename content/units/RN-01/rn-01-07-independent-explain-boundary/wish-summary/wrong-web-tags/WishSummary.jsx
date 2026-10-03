import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { summarizeItems } from './domain/items.js';

// Misconception: the list can stay as <ul>/<li> because the preview shows it.
export function WishSummary({ items, labels }) {
  const [showAcquired, setShowAcquired] = useState(false);
  const summary = summarizeItems(items);
  const visible = showAcquired ? items : items.filter((item) => !item.acquired);
  return (
    <View>
      <Text role="heading">{labels.title}</Text>
      <Text>{labels.total}: {summary.wantedTotal}</Text>
      <Pressable role="button" onPress={() => setShowAcquired(!showAcquired)}>
        <Text>{labels.toggle}</Text>
      </Pressable>
      <ul>
        {visible.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </View>
  );
}
