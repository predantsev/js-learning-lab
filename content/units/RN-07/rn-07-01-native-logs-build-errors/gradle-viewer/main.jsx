// The labeled log viewer: a synthetic Gradle log, filtered by filter.js.
import { createRoot } from 'react-dom/client';
import { gradleLog } from './gradleLog.js';
import { filter } from './filter.js';
import { LogViewer, applyFilter } from './LogViewer.jsx';

const shown = applyFilter(gradleLog, filter);
console.log(`%%shownLog%%`.replace('{shown}', shown.length).replace('{total}', gradleLog.length));
console.log(`%%firstShown%% ${shown[0]?.number ?? '—'}: ${shown[0]?.text ?? ''}`);

createRoot(document.getElementById('root')).render(<LogViewer lines={gradleLog} filter={filter} labels={{ shown: '%%shownLog%%' }} />);
