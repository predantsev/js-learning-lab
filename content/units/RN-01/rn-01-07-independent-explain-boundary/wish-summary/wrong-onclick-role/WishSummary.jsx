import { useState } from 'react';
import { Text, View } from 'react-native';
import { summarizeItems } from './domain/items.js';

// Misconception: a View with a button role and onClick is a button; a finger tap on a phone does not call onClick.
export function WishSummary({ items, labels }) {
  const [showAcquired, setShowAcquired] = useState(false);
  const summary = summarizeItems(items);
  const visible = showAcquired ? items : items.filter((item) => !item.acquired);
  return (
    <View>
      <Text role="heading">{labels.title}</Text>
      <Text>{labels.total}: {summary.wantedTotal}</Text>
      <View role="button" onClick={() => setShowAcquired(!showAcquired)}>
        <Text>{labels.toggle}</Text>
      </View>
      <View>
        {visible.map((item) => (
          <Text key={item.id}>{item.name}</Text>
        ))}
      </View>
    </View>
  );
}
