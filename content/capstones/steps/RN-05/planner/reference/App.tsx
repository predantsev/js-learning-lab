// The native planner: a stack of four screens over one repository. The platform adapters are chosen
// here and only here: the device storage (AsyncStorage, src/nativeStorage.ts), the date format of the project's language and the
// device's clock. Deep links open a task by its id: the one that started the app (getInitialURL, once
// the navigator is ready) and every one that arrives while it runs (a 'url' listener, removed in the
// cleanup).
import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { parseTaskList } from './data/model.ts';
import fixtures from './data/tasks.json';
import { createDateFormat, createSystemClock } from './src/adapters.ts';
import { DetailScreen } from './src/DetailScreen.tsx';
import { EditScreen } from './src/EditScreen.tsx';
import { parseRecordLink } from './src/links.ts';
import type { RootStackParamList } from './src/navigation.ts';
import { nativeStorage } from './src/nativeStorage.ts';
import { NotFoundScreen } from './src/NotFoundScreen.tsx';
import { createRepository } from './src/repository.ts';
import { SEED, applySeed } from './src/seed.ts';
import { ServicesContext } from './src/services.tsx';
import type { Services } from './src/services.tsx';
import { TasksScreen } from './src/TasksScreen.tsx';

const parsed = parseTaskList(fixtures.records);
const services: Services = {
  repository: createRepository(nativeStorage, parsed.ok ? parsed.value : []),
  format: createDateFormat('%%formatLocale%%', '%%noDueDate%%'),
  clock: createSystemClock(),
  startingFailed: !parsed.ok,
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

// An address without a record path (Expo Go opening the app) changes nothing.
function openFromLink(url: string | null) {
  if (url === null || !navigationRef.isReady()) {
    return;
  }
  const link = parseRecordLink(url);
  if (link === null) {
    return;
  }
  if (link.screen === 'Detail') {
    navigationRef.navigate('Detail', link.params);
  } else {
    navigationRef.navigate('NotFound');
  }
}

export default function App() {
  // A rehearsal seed (src/seed.ts) is written before the first read; without one the app starts at once.
  const [ready, setReady] = useState(!__DEV__ || SEED === 'none');
  useEffect(() => {
    if (!ready) {
      void applySeed(nativeStorage, SEED).then(() => setReady(true));
    }
  }, [ready]);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => openFromLink(url));
    return () => subscription.remove();
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ServicesContext.Provider value={services}>
        <NavigationContainer ref={navigationRef} onReady={() => void Linking.getInitialURL().then(openFromLink)}>
          <Stack.Navigator>
            <Stack.Screen name="List" component={TasksScreen} options={{ title: '%%projectTitle%%' }} />
            <Stack.Screen name="Detail" component={DetailScreen} options={{ title: '%%detailTitle%%' }} />
            <Stack.Screen name="Edit" component={EditScreen} options={{ title: '%%editTitle%%' }} />
            <Stack.Screen name="NotFound" component={NotFoundScreen} options={{ title: '%%notFoundTitle%%' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </ServicesContext.Provider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
