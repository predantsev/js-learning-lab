// An expenses list that reloads from a simulated service, in the browser preview (react-native-web).
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { sim, simulatedFetch } from './simServer.js';

// Turns a request into records, or throws an error whose `kind` says what went wrong.
async function loadExpenses() {
  let response;
  try {
    response = await simulatedFetch('/records/expenses');
  } catch {
    throw Object.assign(new Error('network'), { kind: 'offline' });
  }
  if (!response.ok) throw Object.assign(new Error(`HTTP ${response.status}`), { kind: 'server' });
  const body = await response.json();
  if (!Array.isArray(body)) throw Object.assign(new Error('not a list'), { kind: 'invalid' });
  return body;
}

// The simulated situations: a working service, airplane mode, a 500 and a body of the wrong shape.
const MODES = [['ok', '%%modeOk%%'], ['airplane', '%%modeAirplane%%'], ['server-500', '%%modeServer%%'], ['invalid', '%%modeInvalid%%']];

function ExpensesScreen() {
  const [current, setCurrent] = useState(sim.mode);
  const [state, setState] = useState({ records: [], loadedAt: null, problem: null, busy: false });

  async function reload() {
    setState((s) => ({ ...s, busy: true }));
    try {
      const records = await loadExpenses();
      setState({ records, loadedAt: Date.now(), problem: null, busy: false });
    } catch (error) {
      // On any failure: clear the list. (Is that what the person needs?)
      setState({ records: [], loadedAt: null, problem: error.kind, busy: false });
    }
  }

  const age = state.loadedAt === null ? null : Math.round((Date.now() - state.loadedAt) / 1000);
  return (
    <View style={styles.screen}>
      <View style={styles.modes}>
        {MODES.map(([mode, label]) => (
          <Pressable
            key={mode}
            accessibilityRole="radio"
            accessibilityState={{ checked: mode === current }}
            onPress={() => { sim.mode = mode; setCurrent(mode); }}
            style={[styles.mode, mode === current && styles.modeOn]}
          >
            <Text>{label}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable accessibilityRole="button" onPress={reload} style={styles.reload}>
        <Text style={styles.reloadText}>{state.busy ? '%%loading%%' : '%%reload%%'}</Text>
      </Pressable>
      {state.problem && <Text style={styles.problem}>{`%%problem%%: ${state.problem}`}</Text>}
      {age !== null && <Text style={styles.meta}>{`%%updated%% ${age} %%secondsAgo%%`}</Text>}
      {state.records.map((expense) => (
        <Text key={expense.id}>{`${expense.label} — ${(expense.amountMinor / 100).toFixed(2)} ₴`}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 8 },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  mode: { paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#767676', borderRadius: 6 },
  modeOn: { borderWidth: 2, borderColor: '#1d4ed8', backgroundColor: '#e8eef7' },
  reload: { padding: 12, backgroundColor: '#1d4ed8', borderRadius: 6, alignItems: 'center' },
  reloadText: { color: '#ffffff', fontWeight: '600' },
  problem: { color: '#b91c1c' },
  meta: { color: '#4b4b4b', fontSize: 13 },
});

createRoot(document.getElementById('root')).render(<ExpensesScreen />);
