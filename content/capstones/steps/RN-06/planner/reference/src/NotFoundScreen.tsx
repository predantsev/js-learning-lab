// Where a broken deep link leads: a link of an unknown form or with an id that cannot be a record's id.
import { ScrollView, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionButton } from './ActionButton.tsx';
import type { RootStackParamList } from './navigation.ts';

type NotFoundScreenProps = NativeStackScreenProps<RootStackParamList, 'NotFound'>;

export function NotFoundScreen({ navigation }: NotFoundScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text role="heading" style={styles.heading}>%%notFoundTitle%%</Text>
      <ActionButton text="%%backToListLabel%%" onPress={() => navigation.navigate('List')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  heading: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
});
