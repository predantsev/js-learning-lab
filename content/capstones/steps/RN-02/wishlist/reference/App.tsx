// The native wishlist: the starting wishes of data/wishes.json, checked by the shared contract
// parseItemList (data/model.ts), on one screen with the list and the form. SafeAreaProvider measures
// the notch and the system bars once, for every screen below it.
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { parseItemList } from './data/model.ts';
import fixtures from './data/wishes.json';
import { ItemsScreen } from './src/ItemsScreen.tsx';

const parsed = parseItemList(fixtures.records);

export default function App() {
  return (
    <SafeAreaProvider>
      <ItemsScreen items={parsed.ok ? parsed.value : []} loadFailed={!parsed.ok} />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
