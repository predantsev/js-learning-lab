// Expense totals that refresh when the app comes back, on a SIMULATED stack and AppState
// (see navSim.jsx and appStateSim.jsx).
import { useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppState, AppStateControls } from './appStateSim.jsx';
import { SimStack, createStack, useFocusEffect } from './navSim.jsx';

let refreshes = 0;

function TotalsScreen({ navigation }) {
  useFocusEffect(
    useCallback(() => {
      const subscription = AppState.addEventListener('change', (next) => {
        if (next === 'active') {
          refreshes += 1;
          console.log(`%%logRefresh%% ${refreshes}`);
        }
      });
      // No cleanup: the subscription stays after the screen loses focus.
    }, []),
  );

  return (
    <View style={styles.column}>
      <Text>%%food%%: 1 056,00 ₴</Text>
      <Text>%%transport%%: 520,00 ₴</Text>
      <Pressable accessibilityRole="button" style={styles.button} onPress={() => navigation.push('Detail')}>
        <Text>%%openDetail%%</Text>
      </Pressable>
    </View>
  );
}

function DetailScreen() {
  return <Text>%%detailText%%</Text>;
}

const styles = StyleSheet.create({
  column: { gap: 8 },
  button: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#767676', borderRadius: 8 },
});

const stack = createStack('Totals');
createRoot(document.getElementById('root')).render(
  <>
    <SimStack stack={stack} screens={{ Totals: TotalsScreen, Detail: DetailScreen }} />
    <AppStateControls />
  </>,
);
