// main.jsx (read-only): shows the badge for 2026-03-02 and runs the tests from overdue.test.jsx.
import { createRoot } from 'react-dom/client';
import { View } from 'react-native';
import './overdue.test.jsx';
import { OverdueBadge } from './OverdueBadge.jsx';
import { tasks } from './tasks.js';
import { run } from './testing.js';

createRoot(document.getElementById('root')).render(
  <View style={{ padding: 16 }}>
    <OverdueBadge tasks={tasks.map((task) => ({ ...task }))} day="2026-03-02" />
  </View>,
);

await run();
