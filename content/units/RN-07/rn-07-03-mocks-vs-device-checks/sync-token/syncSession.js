// Wishlist sharing (a synthetic lab feature): the sync token lives in secure storage.
// `store` is the secure-storage module: in the app, expo-secure-store; in tests, a mock.
export const SYNC_KEY = 'wishlist.sync';

export async function loadSyncSession(store) {
  const saved = await store.getItemAsync(SYNC_KEY);
  return { status: 'on', token: JSON.parse(saved).token };
}
