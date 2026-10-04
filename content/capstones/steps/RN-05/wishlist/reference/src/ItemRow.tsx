// One wish in the list: the name, the price through the formatting adapter and the acquired mark —
// pressing them opens the wish — then its actions. A delete asks first, inside the row. A screen reader
// hears the text part as one sentence, the text of the shared formatter formatItemLabel.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatItemLabel } from '../domain/wishes.ts';
import type { Wish } from '../domain/wishes.ts';
import type { PriceFormat } from './contracts.ts';
import { ActionButton } from './ActionButton.tsx';

type ItemRowProps = {
  item: Wish;
  format: PriceFormat;
  confirming: boolean; // the delete question is open
  onOpen: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
};

export function ItemRow({ item, format, confirming, onOpen, onToggle, onDelete, onConfirmDelete, onCancelDelete }: ItemRowProps) {
  return (
    <View style={styles.row}>
      <Pressable role="button" accessibilityLabel={formatItemLabel(item)} onPress={onOpen} style={({ pressed }) => [styles.line, pressed ? styles.pressed : null]}>
        <View style={styles.text}>
          <Text style={styles.name}>{item.name}</Text>
          {item.acquired ? <Text style={styles.mark}>%%acquiredMark%%</Text> : null}
        </View>
        <Text style={styles.price}>{format.price(item.price)}</Text>
      </Pressable>
      {confirming ? (
        <View style={styles.actions}>
          <Text style={styles.question}>%%confirmQuestion%%</Text>
          <ActionButton text="%%confirmDeleteLabel%%" kind="danger" onPress={onConfirmDelete} />
          <ActionButton text="%%cancelLabel%%" onPress={onCancelDelete} />
        </View>
      ) : (
        <View style={styles.actions}>
          <ActionButton text={item.acquired ? '%%markWantedLabel%%' : '%%markAcquiredLabel%%'} onPress={onToggle} />
          <ActionButton text="%%deleteLabel%%" kind="danger" onPress={onDelete} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderColor: '#d4d4d4' },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  pressed: { opacity: 0.6 },
  text: { flexShrink: 1, flexGrow: 1, gap: 2 },
  name: { fontSize: 16, color: '#1a1a1a' },
  mark: { fontSize: 14, color: '#2f6b2f' },
  price: { fontSize: 16, color: '#1a1a1a' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  question: { fontSize: 15, color: '#1a1a1a', flexBasis: '100%' },
});
