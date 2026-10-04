// The native wishlist: the starting wishes of data/wishes.json, checked by the shared contract
// parseItemList (data/model.ts). The platform adapters are chosen here and only here: a storage
// (in memory for now) and the price format of the project's language. SafeAreaProvider measures the
// notch and the system bars once, for every screen below it.
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { parseItemList } from './data/model.ts';
import fixtures from './data/wishes.json';
import { createMemoryStorage, createPriceFormat } from './src/adapters.ts';
import { ItemsScreen } from './src/ItemsScreen.tsx';

const parsed = parseItemList(fixtures.records);
const storage = createMemoryStorage();
const format = createPriceFormat('%%formatLocale%%', '%%noPrice%%');

export default function App() {
  return (
    <SafeAreaProvider>
      <ItemsScreen initialItems={parsed.ok ? parsed.value : []} loadFailed={!parsed.ok} storage={storage} format={format} />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
