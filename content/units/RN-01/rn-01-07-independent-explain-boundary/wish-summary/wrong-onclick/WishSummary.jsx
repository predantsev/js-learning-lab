import { useState } from 'react';
import { Text, View } from 'react-native';
import { summarizeItems } from './domain/items.js';

// Misconception: onClick on a View handles a tap, as on the web; a finger tap on a phone does not call it.
export function WishSummary({ items, labels }) {
  const [showAcquired, setShowAcquired] = useState(false);
  const summary = summarizeItems(items);
  const visible = showAcquired ? items : items.filter((item) => !item.acquired);
  return (
    <View>
      <Text role="heading">{labels.title}</Text>
      <Text>{labels.total}: {summary.wantedTotal}</Text>
      <View onClick={() => setShowAcquired(!showAcquired)}>
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
