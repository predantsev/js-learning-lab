// The wishlist screen: a header whose background reaches the top edge while its text stays below the
// notch, the list of wishes and the form. The insets come from react-native-safe-area-context; the
// keyboard pushes the scrolling content up instead of covering the form.
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Wish } from '../domain/wishes.ts';
import { ItemForm } from './ItemForm.tsx';
import { ItemRow } from './ItemRow.tsx';

export function ItemsScreen({ items, loadFailed }: { items: Wish[]; loadFailed: boolean }) {
  const insets = useSafeAreaInsets();
  const sides = { paddingLeft: insets.left + 16, paddingRight: insets.right + 16 };
  return (
    <View style={styles.screen}>
      <View style={[styles.header, sides, { paddingTop: insets.top + 12 }]}>
        <Text role="heading" style={styles.title}>%%projectTitle%%</Text>
      </View>
      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={[styles.content, sides, { paddingBottom: insets.bottom + 24 }]}>
          <Text role="heading" style={styles.heading}>%%listTitle%%</Text>
          {loadFailed ? <Text style={styles.error}>%%loadDataError%%</Text> : null}
          {items.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
          <ItemForm />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  header: { paddingBottom: 12, backgroundColor: '#e8eef7' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  body: { flex: 1 },
  content: { paddingTop: 16, gap: 8 },
  heading: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  error: { fontSize: 15, color: '#b91c1c' },
});
