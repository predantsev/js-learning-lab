// The planner screen in a SIMULATED portrait frame at a simulated 200 % text size (browser preview).
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DeviceFrame } from './DeviceFrame.jsx';
import { PlannerScreen } from './PlannerScreen.jsx';

const initialTasks = [
  { id: 't-03', title: '%%grandma%%' },
  { id: 't-05', title: '%%dentist%%' },
];

function App() {
  const [tasks, setTasks] = useState(initialTasks);
  return (
    <DeviceFrame orientation="portrait">
      <PlannerScreen tasks={tasks} onDelete={(id) => setTasks(tasks.filter((task) => task.id !== id))} />
    </DeviceFrame>
  );
}

createRoot(document.getElementById('root')).render(<App />);
