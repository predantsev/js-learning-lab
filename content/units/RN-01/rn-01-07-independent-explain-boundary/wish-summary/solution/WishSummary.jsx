import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { summarizeItems } from './domain/items.js';

export function WishSummary({ items, labels }) {
  const [showAcquired, setShowAcquired] = useState(false);
  const summary = summarizeItems(items);
  const visible = showAcquired ? items : items.filter((item) => !item.acquired);
  return (
    <View style={styles.summary}>
      <Text role="heading">{labels.title}</Text>
      <Text>{labels.total}: {summary.wantedTotal}</Text>
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

const styles = StyleSheet.create({
  summary: { padding: 16, gap: 8 },
});
