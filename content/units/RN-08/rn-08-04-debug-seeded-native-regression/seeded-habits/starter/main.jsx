// main.jsx (read-only): the seeded habit tracker 2.0.0 in the preview.
// SIMULATED here: the device store (native-store.js, like AsyncStorage) and the native stack
// (navSim.jsx, like React Navigation 7). The "device disk" starts with a snapshot written by app 1.x.
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DetailScreen, ListScreen } from './HabitScreens.jsx';
import { RepoContext, createHabitRepo } from './habitRepo.js';
import { createSimulatedStore } from './native-store.js';
import { SimStack, createStack } from './navSim.jsx';
import { WeekScreen } from './WeekSummary.jsx';

const screens = { List: ListScreen, Week: WeekScreen, Detail: DetailScreen };

export const store = createSimulatedStore({
  entries: {
    'jsll.habits.v1': JSON.stringify({
      schemaVersion: 1,
      records: [
        { id: 'h-01', name: '%%exercise%%', active: true, completions: ['2026-02-27', '2026-02-28', '2026-03-01'] },
        { id: 'h-02', name: '%%reading%%', active: true, completions: ['2026-02-26', '2026-02-28', '2026-03-01'] },
        { id: 'h-03', name: '%%water%%', active: true, completions: ['2026-03-01'] },
      ],
    }),
  },
});

// One launch of the app: a fresh repo and a fresh stack. Only the store survives a restart.
export const app = { repo: null, stack: null };
function launch() {
  app.repo = createHabitRepo(store);
  app.stack = createStack('List');
  app.repo.load();
}
launch();

function Simulator() {
  const [launchNumber, setLaunchNumber] = useState(1);
  useEffect(() => {
    app.restart = () => {
      console.log('--- %%killed%% ---');
      launch();
      setLaunchNumber((n) => n + 1);
    };
  }, []);
  return (
    <View style={styles.page}>
      <RepoContext.Provider key={launchNumber} value={app.repo}>
        <SimStack stack={app.stack} screens={screens} />
      </RepoContext.Provider>
      <Pressable accessibilityRole="button" style={styles.button} onPress={() => app.restart()}>
        <Text>%%kill%%</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 8 },
  button: { alignSelf: 'flex-start', marginHorizontal: 12, minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#767676', borderRadius: 8 },
});

createRoot(document.getElementById('root')).render(<Simulator />);
