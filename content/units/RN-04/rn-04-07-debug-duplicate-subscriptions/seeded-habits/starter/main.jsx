// Read-only: the habit tracker on a SIMULATED stack, AppState and Linking
// (see navSim.jsx, appStateSim.jsx and linkingSim.jsx). Links are checked here and carry only an id.
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AppStateControls } from './appStateSim.jsx';
import { DetailScreen, ListScreen } from './HabitScreens.jsx';
import { Linking, LinkControls } from './linkingSim.jsx';
import { SimStack, createStack } from './navSim.jsx';

export const stack = createStack('List');

function idFromLink(url) {
  const match = /^courselab:\/\/habit\/(h-\d{2})$/.exec(url);
  return match ? match[1] : null;
}

function App() {
  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      const id = idFromLink(url);
      if (id) stack.navigate('Detail', { id });
    });
    return () => subscription.remove();
  }, []);
  return (
    <>
      <SimStack stack={stack} screens={{ List: ListScreen, Detail: DetailScreen }} />
      <AppStateControls />
      <LinkControls links={[{ label: 'h-01', url: 'courselab://habit/h-01' }]} onColdStart={() => {}} />
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
