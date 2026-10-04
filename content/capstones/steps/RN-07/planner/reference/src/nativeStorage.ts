// The device storage: AsyncStorage keeps text by key on the device, so the records survive a restart of
// the app. It has exactly the three methods of StorageAdapter; the screens do not know which storage they
// got. It is unencrypted and meant for small data (Android limits the whole store to 6 MB): no secrets.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StorageAdapter } from './contracts.ts';

export const nativeStorage: StorageAdapter = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};
