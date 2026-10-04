// The wishes of the course's mock service, read only: the device's own list stays the one you edit.
// Every focus starts one request with its own AbortController; losing the focus aborts it, so an answer
// for a screen nobody looks at never arrives. The wanted total is computed only from data that actually
// loaded — from the service or, when offline, from the bundled starting wishes — and never for "no data".
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { formatItemLabel, summarizeItems } from '../domain/wishes.ts';
import { ActionButton } from './ActionButton.tsx';
import { REHEARSAL, TARGET, mockBaseUrl } from './devConfig.ts';
import { loadFromService } from './recordsSource.ts';
import type { LoadOutcome } from './recordsSource.ts';
import { useServices } from './services.tsx';

type State = { phase: 'loading' } | { phase: 'done'; outcome: LoadOutcome };

function bannerText(outcome: LoadOutcome): string {
  if (outcome.source === 'service') {
    return '%%serviceLoadedMessage%%';
  }
  if (outcome.source === 'bundled') {
    return outcome.failure === 'offline' ? '%%offlineBundledMessage%%' : '%%invalidBundledMessage%%';
  }
  return outcome.failure === 'timeout' ? '%%timeoutMessage%%' : '%%serverErrorMessage%% (%%responseStatusLabel%% ' + outcome.status + ')';
}

export function ServiceScreen() {
  const { format, starting } = useServices();
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [attempt, setAttempt] = useState(0); // a new value asks again

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      setState({ phase: 'loading' });
      loadFromService({ baseUrl: mockBaseUrl(TARGET), lang: '%%htmlLang%%', rehearsal: REHEARSAL, fetchFn: (url, init) => fetch(url, init), signal: controller.signal }, starting).then(
        (outcome) => setState({ phase: 'done', outcome: outcome }),
        () => {
          // Only an abort ends here: the screen lost the focus, and nobody waits for the answer.
        },
      );
      return () => controller.abort();
    }, [starting, attempt]),
  );

  if (state.phase === 'loading') {
    return <Text style={styles.note} accessibilityRole="alert">%%serviceLoadingMessage%%</Text>;
  }
  const outcome = state.outcome;
  const records = outcome.source === 'none' ? null : outcome.records;
  return (
    <FlatList
      data={records ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.top}>
          <Text style={outcome.source === 'service' ? styles.ok : styles.warning} accessibilityRole="alert">
            {bannerText(outcome)}
          </Text>
          {records === null ? <ActionButton text="%%retryLoadLabel%%" kind="primary" onPress={() => setAttempt(attempt + 1)} /> : <Text style={styles.total}>{'%%summaryWantedTotal%%: ' + format.price(summarizeItems(records).wantedTotal)}</Text>}
        </View>
      }
      renderItem={({ item }) => <Text style={styles.row}>{formatItemLabel(item)}</Text>}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  top: { gap: 8, paddingBottom: 8 },
  ok: { fontSize: 15, color: '#2f6b2f' },
  warning: { fontSize: 15, color: '#b91c1c' },
  total: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  row: { fontSize: 16, color: '#1a1a1a', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#d4d4d4' },
  note: { fontSize: 15, color: '#1a1a1a', padding: 16 },
});
