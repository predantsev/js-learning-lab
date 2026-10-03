// Demo (read-only): saves two tasks into a simulated device store and reads them back.
import { createDeviceStore } from './device-store.js';
import { loadSnapshot, saveSnapshot } from './snapshot.ts';

const tasks = [
  { id: 't-01', title: '%%plants%%', dueDate: '2026-03-02', done: false, priority: 'normal' },
  { id: 't-02', title: '%%books%%', dueDate: '2026-03-01', done: false, priority: 'high' },
];

const store = createDeviceStore({ log: true });
console.log('loadSnapshot →', await loadSnapshot(store));
console.log('saveSnapshot →', await saveSnapshot(store, tasks));
const back = await loadSnapshot(store);
console.log('loadSnapshot →', back?.records?.map((task) => task.title) ?? back);
