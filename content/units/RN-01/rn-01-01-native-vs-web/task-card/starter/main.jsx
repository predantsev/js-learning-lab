// Preview plumbing (read-only): keeps the task in state and shows one TaskCard.
// A real app would register its root component instead of calling createRoot.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { TaskCard } from './TaskCard.jsx';

const labels = { noDueDate: '%%noDueDate%%', toggle: '%%toggle%%' };

function Preview() {
  const [task, setTask] = useState({ id: 't-01', title: '%%taskTitle%%', dueDate: '2026-03-02', done: false, priority: 'normal' });
  return <TaskCard task={task} labels={labels} onToggle={() => setTask({ ...task, done: !task.done })} />;
}

createRoot(document.getElementById('root')).render(<Preview />);
