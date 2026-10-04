// What the category screen shows, without loading anything: a labeled filter and the groups. Every
// group is one element for a screen reader, its label the whole line of numbers.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Wish } from '../domain/wishes.ts';
import { ChoiceField } from './ChoiceField.tsx';
import type { PriceFormat } from './contracts.ts';
import { categoryGroups } from './summary.ts';

const ALL = 'all';
const NONE = 'none';

export function SummaryView({ items, format, locale }: { items: Wish[]; format: PriceFormat; locale: string }) {
  const [filter, setFilter] = useState(ALL);
  const groups = categoryGroups(items, locale);
  const options = [{ value: ALL, text: '%%filterAll%%' }, ...groups.map((group) => ({ value: group.category ?? NONE, text: group.category ?? '%%noCategoryLabel%%' }))];
  const shown = groups.filter((group) => filter === ALL || (group.category ?? NONE) === filter);
  return (
    <View style={styles.view}>
      <ChoiceField label="%%filterLabel%%" options={options} value={filter} onChange={setFilter} error="" />
      {shown.map((group) => {
        const title = (group.category ?? '%%noCategoryLabel%%') + ' · ' + group.count;
        const total = '%%summaryWantedTotal%%: ' + format.price(group.wantedTotal);
        const noPrice = '%%summaryNoPrice%%: ' + group.wantedWithoutPrice;
        return (
          <View key={group.category ?? NONE} style={styles.group} accessible={true} accessibilityLabel={title + ', ' + total + ', ' + noPrice}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.line}>{total}</Text>
            <Text style={styles.line}>{noPrice}</Text>
            {filter === ALL ? null : group.items.map((item) => <Text key={item.id} style={styles.item}>{item.name}</Text>)}
          </View>
        );
      })}
      <Text style={styles.note}>%%savedOnDeviceNote%%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  view: { gap: 12 },
  group: { gap: 2, paddingVertical: 8, borderBottomWidth: 1, borderColor: '#d4d4d4' },
  title: { fontSize: 17, fontWeight: '600', color: '#1a1a1a' },
  line: { fontSize: 15, color: '#1a1a1a' },
  item: { fontSize: 15, color: '#4a4a4a', paddingLeft: 8 },
  note: { fontSize: 14, color: '#4a4a4a' },
});
