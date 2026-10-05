import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { summarizeItems } from './domain/items.js';

function WishName({ name }) {
  return <Text>{name}</Text>;
}

export function WishSummary({ items, labels }) {
  const [showAcquired, setShowAcquired] = useState(false);
  const { wantedTotal } = summarizeItems(items);
  const visible = items.filter((item) => showAcquired || !item.acquired);
  return (
    <View>
      <Text accessibilityRole="header">{labels.title}</Text>
      <Text>{`${labels.total}: ${wantedTotal}`}</Text>
      <Pressable accessibilityRole="button" onPress={() => setShowAcquired((shown) => !shown)}>
        <Text>{labels.toggle}</Text>
      </Pressable>
      {visible.map((item) => (
        <WishName key={item.id} name={item.name} />
      ))}
    </View>
  );
}
