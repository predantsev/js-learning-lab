// The edit screen. While the draft differs from the saved wish, every way of leaving that removes the
// screen — the header's back button, Android's Back button, the iOS swipe — first asks through
// usePreventRemove; "leave" continues the very action that was stopped. A save turns the guard off
// and then goes back.
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { indexById } from '../domain/wishes.ts';
import type { Wish } from '../domain/wishes.ts';
import { hasUnsavedChanges } from './draft.ts';
import type { Draft } from './draft.ts';
import { ItemForm } from './ItemForm.tsx';
import type { RootStackParamList } from './navigation.ts';
import { useServices } from './services.tsx';

type EditScreenProps = NativeStackScreenProps<RootStackParamList, 'Edit'>;

export function EditScreen({ route, navigation }: EditScreenProps) {
  const { id } = route.params;
  const { repository } = useServices();
  const [item, setItem] = useState<Wish | null | undefined>(undefined); // undefined while reading
  const [draft, setDraft] = useState<Draft | null>(null); // null until the first typed change
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    void repository.readAll().then((list) => {
      if (active) {
        setItem(indexById(list).get(id) ?? null);
      }
    });
    return () => {
      active = false;
    };
  }, [repository, id]);

  const dirty = !saved && item != null && draft !== null && hasUnsavedChanges(draft, item);
  usePreventRemove(dirty, ({ data }) => {
    Alert.alert('%%unsavedQuestion%%', undefined, [
      { text: '%%stayLabel%%', style: 'cancel' },
      { text: '%%leaveLabel%%', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });

  useEffect(() => {
    if (saved) {
      navigation.goBack();
    }
  }, [saved, navigation]);

  if (item === undefined) {
    return <Text style={styles.note}>%%loadingListMessage%%</Text>;
  }
  if (item === null) {
    return <Text style={styles.note}>%%notFoundTitle%%</Text>;
  }
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ItemForm
          item={item}
          onDraftChange={setDraft}
          onSave={(fields) => {
            void repository.apply({ type: 'updated', id: item.id, fields: fields }).then(() => setSaved(true));
          }}
          onCancel={() => navigation.goBack()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  note: { fontSize: 15, color: '#1a1a1a', padding: 16 },
});
