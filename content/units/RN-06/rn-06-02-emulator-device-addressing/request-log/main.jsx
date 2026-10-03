// One request to the mock service, sent from a simulated target, in the browser preview (react-native-web).
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { fetchFrom } from './targetSim.js';

// The target the app runs on: 'android-emulator', 'ios-simulator', 'android-usb' or 'phone-wifi'.
const SIMULATED_TARGET = 'ios-simulator';
// The address every request uses. One constant for every target — is that enough?
const BASE_URL = 'http://localhost:7310';

const expenses = [
  { id: 'e-01', label: '%%groceries%%' },
  { id: 'e-02', label: '%%pass%%' },
];

function RequestLog() {
  const [line, setLine] = useState('…');
  useEffect(() => {
    const url = `${BASE_URL}/records/expenses`;
    const fetchHere = fetchFrom(SIMULATED_TARGET, { records: expenses });
    fetchHere(url).then(
      async (response) => setLine(`${url} → ${response.status}, ${(await response.json()).length} %%records%%`),
      (error) => setLine(`${url} → ${error.name}: ${error.message}`),
    );
  }, []);
  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>{`%%target%%: ${SIMULATED_TARGET}`}</Text>
      <Text style={styles.line}>{line}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 8 },
  heading: { fontSize: 18, fontWeight: '600' },
  line: { fontFamily: 'monospace', fontSize: 14 },
});

createRoot(document.getElementById('root')).render(<RequestLog />);
