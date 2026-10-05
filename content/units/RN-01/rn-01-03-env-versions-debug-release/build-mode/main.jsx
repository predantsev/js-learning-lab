// Preview plumbing: the simulated build mode first, then the screen.
import './build-mode.js';
import { createRoot } from 'react-dom/client';
import { HabitScreen } from './HabitScreen.jsx';

const habit = { id: 'h-01', name: '%%habitName%%', frequency: 'daily', active: true, completions: ['2026-02-27', '2026-02-28', '2026-03-01'] };
const labels = { done: '%%done%%', debug: '%%debug%%', release: '%%release%%' };

createRoot(document.getElementById('root')).render(<HabitScreen habit={habit} labels={labels} />);
