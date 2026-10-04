// The detail screen: it receives only the id (from the list or from a deep link) and finds the wish in
// the stored list on every focus, so it shows the saved state after an edit. An id that no wish has
// gets its own not-found state instead of a crash.
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { indexById } from '../domain/wishes.ts';
import type { Wish } from '../domain/wishes.ts';
import { ActionButton } from './ActionButton.tsx';
import type { RootStackParamList } from './navigation.ts';
import { useServices } from './services.tsx';

type DetailScreenProps = NativeStackScreenProps<RootStackParamList, 'Detail'>;

export function DetailScreen({ route, navigation }: DetailScreenProps) {
  const { id } = route.params;
  const { repository, format } = useServices();
  const [item, setItem] = useState<Wish | null | undefined>(undefined); // undefined while reading

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void repository.readAll().then((list) => {
        if (active) {
          setItem(indexById(list).get(id) ?? null);
        }
      });
      return () => {
        active = false;
      };
    }, [repository, id]),
  );

  if (item === undefined) {
    return <Text style={styles.note}>%%loadingListMessage%%</Text>;
  }
  if (item === null) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Text role="heading" style={styles.heading}>%%notFoundTitle%%</Text>
        <ActionButton text="%%backToListLabel%%" onPress={() => navigation.navigate('List')} />
      </ScrollView>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text role="heading" style={styles.heading}>{item.name}</Text>
      <Text style={styles.line}>{'%%valueLabel%%: ' + format.price(item.price)}</Text>
      <Text style={styles.line}>{'%%categoryFieldLabel%%: ' + (item.category ?? '%%noCategoryLabel%%')}</Text>
      <Text style={styles.line}>{item.acquired ? '%%acquiredMark%%' : '%%wantedMark%%'}</Text>
      <ActionButton text="%%editLabel%%" kind="primary" onPress={() => navigation.navigate('Edit', { id: item.id })} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  heading: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  line: { fontSize: 16, color: '#1a1a1a' },
  note: { fontSize: 15, color: '#1a1a1a', padding: 16 },
});
