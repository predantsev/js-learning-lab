// Read-only: the planner's shared state. Every screen reads tasks through tasks.useRecords().
import { createRecordStore } from './recordStore.js';

export const tasks = createRecordStore([
  { id: 't-01', title: '%%plants%%', dueDate: '2026-03-02' },
  { id: 't-02', title: '%%books%%', dueDate: '2026-03-01' },
  { id: 't-05', title: '%%dentist%%', dueDate: '2026-03-10' },
]);
