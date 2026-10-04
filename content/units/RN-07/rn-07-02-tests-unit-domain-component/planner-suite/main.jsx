// Runs the four tests from planner.test.jsx (one console line per test), then shows the screen.
import { createRoot } from 'react-dom/client';
import './planner.test.jsx';
import { run } from './testing.js';
import { TaskScreen } from './TaskScreen.jsx';
import { createMockService, createTaskAdapter } from './mockService.js';
import { tasks } from './fixtures.js';

await run();
createRoot(document.getElementById('root')).render(<TaskScreen adapter={createTaskAdapter(createMockService(tasks))} />);
