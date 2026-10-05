// The list screen of the stack (it also says when a damaged snapshot was set aside, and offers a new
// read when the storage could not be read): the new-wish form and the wishes in a FlatList keyed by id. The list is
// read again from the repository every time the screen gets the focus — the first time and after every
// return from the detail or the edit screen. The focus effect has no listener to remove: its cleanup
// only marks an answer that arrives after the screen lost the focus as too late.
import { useCallback, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Wish } from '../domain/wishes.ts';
import type { ItemsAction } from '../ui/itemsReducer.ts';
import { ItemForm } from './ItemForm.tsx';
import { ItemRow } from './ItemRow.tsx';
import { ActionButton } from './ActionButton.tsx';
import type { RootStackParamList } from './navigation.ts';
import { useServices } from './services.tsx';

type ItemsScreenProps = NativeStackScreenProps<RootStackParamList, 'List'>;

export function ItemsScreen({ navigation }: ItemsScreenProps) {
  const insets = useSafeAreaInsets();
  const { repository, format, startingFailed } = useServices();
  const [items, setItems] = useState<Wish[] | null>(null); // null until the first read answers
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false); // the storage could not be read
  const [recovered, setRecovered] = useState(false); // a damaged snapshot was set aside
  const [attempt, setAttempt] = useState(0); // a new value reads again

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void repository.readAll().then(
        (read) => {
          if (active) {
            setItems(read.records);
            setFailed(false);
            if (read.recovered) {
              setRecovered(true);
            }
          }
        },
        () => {
          if (active) {
            setFailed(true);
          }
        },
      );
      return () => {
        active = false;
      };
    }, [repository, attempt]),
  );

  function apply(action: ItemsAction) {
    void repository.apply(action).then(setItems, () => setFailed(true));
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <FlatList
        data={items ?? []}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingLeft: insets.left + 16, paddingRight: insets.right + 16, paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={
          <View style={styles.top}>
            {startingFailed ? <Text style={styles.error}>%%loadDataError%%</Text> : null}
            {recovered ? <Text style={styles.error}>%%loadErrorMessage%%</Text> : null}
            {failed ? (
              <View style={styles.failed}>
                <Text style={styles.error}>%%listLoadFailedMessage%%</Text>
                <ActionButton text="%%retryLoadLabel%%" onPress={() => setAttempt(attempt + 1)} />
              </View>
            ) : null}
            <ItemForm item={null} onSave={(fields) => apply({ type: 'added', fields: fields })} />
            <ActionButton text="%%serviceLinkLabel%%" onPress={() => navigation.navigate('Service')} />
            <Text role="heading" style={styles.heading}>%%listTitle%%</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>{items === null ? '%%loadingListMessage%%' : '%%emptyMessage%%'}</Text>}
        renderItem={({ item }) => (
          <ItemRow
            item={item}
            format={format}
            confirming={item.id === confirmingId}
            onOpen={() => navigation.navigate('Detail', { id: item.id })}
            onToggle={() => apply({ type: 'acquiredToggled', id: item.id })}
            onDelete={() => setConfirmingId(item.id)}
            onConfirmDelete={() => {
              apply({ type: 'removed', id: item.id });
              setConfirmingId(null);
            }}
            onCancelDelete={() => setConfirmingId(null)}
          />
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  top: { gap: 8, paddingTop: 8 },
  heading: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', paddingTop: 8 },
  error: { fontSize: 15, color: '#b91c1c' },
  failed: { gap: 8 },
  empty: { fontSize: 15, color: '#1a1a1a', paddingVertical: 12 },
});
