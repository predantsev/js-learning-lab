import { useState } from 'react';
import { Text, View } from 'react-native';
import { summarizeItems } from './domain/items.js';

// Ported from the web client in a hurry. It looks right in the preview.
export function WishSummary({ items, labels }) {
  const [showAcquired, setShowAcquired] = useState(false);
  const summary = summarizeItems(items);
  const visible = showAcquired ? items : items.filter((item) => !item.acquired);
  return (
    <View className="summary">
      <Text role="heading">{labels.title}</Text>
      {labels.total}: {summary.wantedTotal}
      <View onClick={() => setShowAcquired(!showAcquired)}>
        <Text>{labels.toggle}</Text>
      </View>
      <ul>
        {visible.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </View>
  );
}
