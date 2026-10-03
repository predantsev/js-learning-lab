import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { summarizeItems } from './domain/items.js';

// Misconception: text may sit straight inside a View, as inside a div.
export function WishSummary({ items, labels }) {
  const [showAcquired, setShowAcquired] = useState(false);
  const summary = summarizeItems(items);
  const visible = showAcquired ? items : items.filter((item) => !item.acquired);
  return (
    <View>
      <Text role="heading">{labels.title}</Text>
      {labels.total}: {summary.wantedTotal}
      <Pressable role="button" onPress={() => setShowAcquired(!showAcquired)}>
        <Text>{labels.toggle}</Text>
      </Pressable>
      <View>
        {visible.map((item) => (
          <Text key={item.id}>{item.name}</Text>
        ))}
      </View>
    </View>
  );
}
