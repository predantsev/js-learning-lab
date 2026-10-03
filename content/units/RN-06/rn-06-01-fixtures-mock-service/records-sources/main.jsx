// A wishlist screen that loads its records from a data source, in the browser preview (react-native-web).
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { bundledSource, simulatedMockSource } from './sources.js';

// Which source the screen gets. Try 'mock' — and change the delay and the status.
const SOURCE = 'bundled';
const source = SOURCE === 'mock' ? simulatedMockSource({ delayMs: 800, status: 200 }) : bundledSource;

function WishlistScreen({ source }) {
  const [state, setState] = useState({ status: 'loading', wishes: [] });

  useEffect(() => {
    const controller = new AbortController();
    const startedAt = Date.now();
    source.list(controller.signal).then(
      (wishes) => setState({ status: 'ready', wishes, ms: Date.now() - startedAt }),
      (error) => {
        if (error.name !== 'AbortError') setState({ status: 'error', wishes: [], message: error.message });
      },
    );
    return () => controller.abort();
  }, [source]);

  return (
    <View style={styles.screen}>
      <Text style={styles.heading} accessibilityRole="header">%%heading%%</Text>
      <Text style={styles.meta}>{`source: ${SOURCE}`}</Text>
      {state.status === 'loading' && <Text>%%loading%%</Text>}
      {state.status === 'error' && <Text style={styles.error}>{`%%failed%% (${state.message})`}</Text>}
      {state.status === 'ready' && (
        <>
          {state.wishes.map((wish) => (
            <Text key={wish.id} style={styles.row}>{`${wish.name} — ${wish.price} ₴`}</Text>
          ))}
          <Text style={styles.meta}>{`%%loadedIn%% ${state.ms} ms`}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 8 },
  heading: { fontSize: 20, fontWeight: '600' },
  row: { fontSize: 16, paddingVertical: 4 },
  meta: { fontSize: 13, color: '#4b4b4b' },
  error: { color: '#b91c1c' },
});

createRoot(document.getElementById('root')).render(<WishlistScreen source={source} />);
