// Preview plumbing: the simulated build mode first, then the screen.
import './simulated-build.js';
import { createRoot } from 'react-dom/client';
import { WishScreen } from './WishScreen.jsx';

const labels = { title: '%%title%%', count: '%%count%%' };

createRoot(document.getElementById('root')).render(<WishScreen labels={labels} />);
