// Read-only helper: shared app state that every screen can read, outside any one screen.
// Any screen that calls useRecords() re-renders when a record changes.
import { useSyncExternalStore } from 'react';

export function createRecordStore(initialRecords) {
  let records = initialRecords;
  const subscribers = new Set();
  const store = {
    getAll: () => records,
    subscribe(notify) {
      subscribers.add(notify);
      return () => subscribers.delete(notify);
    },
    update(id, changes) {
      records = records.map((record) => (record.id === id ? { ...record, ...changes } : record));
      subscribers.forEach((notify) => notify());
    },
    useRecords: () => useSyncExternalStore(store.subscribe, store.getAll),
  };
  return store;
}
