// Shows the planner screen in the browser preview. Do not edit.
import { createRoot } from 'react-dom/client';
import { TaskScreen } from './TaskScreen.jsx';

const initialTasks = [
  { id: 't-01', title: '%%water%%', dueDate: '2026-03-02', done: false, priority: 'normal' },
  { id: 't-02', title: '%%library%%', dueDate: '2026-03-01', done: false, priority: 'high' },
  { id: 't-03', title: '%%grandma%%', dueDate: null, done: false, priority: 'low' },
  { id: 't-05', title: '%%dentist%%', dueDate: '2026-03-10', done: false, priority: 'normal' },
];

createRoot(document.getElementById('root')).render(<TaskScreen initialTasks={initialTasks} />);
