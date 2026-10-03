// Read-only: the planner on a SIMULATED native stack in the browser preview (see navSim.jsx).
import { createRoot } from 'react-dom/client';
import { SimStack, createStack } from './navSim.jsx';
import { DetailScreen, EditScreen, ListScreen } from './screens.tsx';

export const stack = createStack('List');

createRoot(document.getElementById('root')).render(
  <SimStack stack={stack} screens={{ List: ListScreen, Detail: DetailScreen, Edit: EditScreen }} />,
);
