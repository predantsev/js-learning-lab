// One wish in the list: the name, the price or the no-price label, and the acquired mark. A screen
// reader hears the whole row as one sentence, the text of the shared formatter formatItemLabel.
import { StyleSheet, Text, View } from 'react-native';
import { formatItemLabel } from '../domain/wishes.ts';
import type { Wish } from '../domain/wishes.ts';

export function ItemRow({ item }: { item: Wish }) {
  return (
    <View style={styles.row} accessible={true} accessibilityLabel={formatItemLabel(item)}>
      <View style={styles.text}>
        <Text style={styles.name}>{item.name}</Text>
        {item.acquired ? <Text style={styles.mark}>%%acquiredMark%%</Text> : null}
      </View>
      <Text style={styles.price}>{item.price === null ? '%%noPrice%%' : item.price}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#d4d4d4',
  },
  text: { flexShrink: 1, flexGrow: 1, gap: 2 },
  name: { fontSize: 16, color: '#1a1a1a' },
  mark: { fontSize: 14, color: '#2f6b2f' },
  price: { fontSize: 16, color: '#1a1a1a' },
});
