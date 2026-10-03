// Shows the habit list in the browser preview (react-native-web).
import { createRoot } from 'react-dom/client';
import { HabitList } from './HabitList.jsx';
import { memoryStorage } from './storage.js';

const initialHabits = [
  { id: 'h-01', name: '%%exercise%%', frequency: 'daily', active: true, completions: ['2026-02-27', '2026-02-28', '2026-03-01'] },
  { id: 'h-03', name: '%%water%%', frequency: 'daily', active: true, completions: ['2026-03-01'] },
  { id: 'h-04', name: '%%tidy%%', frequency: 'weekly', active: true, completions: ['2026-02-22', '2026-03-01'] },
  { id: 'h-05', name: '%%words%%', frequency: 'daily', active: false, completions: ['2026-02-20'] },
];

createRoot(document.getElementById('root')).render(
  <HabitList initialHabits={initialHabits} storage={memoryStorage} />,
);
