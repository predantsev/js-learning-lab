// Shows the native task list in the browser preview (react-native-web).
import { createRoot } from 'react-dom/client';
import { TaskList } from './TaskList.jsx';

const initialTasks = [
  { id: 't-01', title: '%%water%%', dueDate: '2026-03-02', done: false, priority: 'normal' },
  { id: 't-02', title: '%%library%%', dueDate: '2026-03-01', done: false, priority: 'high' },
  { id: 't-03', title: '%%grandma%%', dueDate: null, done: false, priority: 'low' },
  { id: 't-04', title: '%%internet%%', dueDate: '2026-02-27', done: true, priority: 'high' },
];

// A stand-in storage: it only reports what it was asked to save.
const loggingStorage = {
  save(tasks) {
    console.log(`saved ${tasks.length} tasks`);
  },
};

createRoot(document.getElementById('root')).render(
  <TaskList initialTasks={initialTasks} storage={loggingStorage} />,
);
