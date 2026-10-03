// Read-only: the expense tracker's shared state.
import { createRecordStore } from './recordStore.js';

export const categories = [
  { id: 'food', name: '%%food%%' },
  { id: 'transport', name: '%%transport%%' },
  { id: 'fun', name: '%%fun%%' },
];

export const expenses = createRecordStore([
  { id: 'e-01', label: '%%groceries%%', category: 'food' },
  { id: 'e-02', label: '%%transit%%', category: 'transport' },
]);
