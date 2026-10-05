// Preview plumbing (read-only): a release build of the lab app.
import './simulated-build.js';
import { createRoot } from 'react-dom/client';
import { ExpenseScreen } from './ExpenseScreen.jsx';

const labels = { title: '%%title%%', loading: '%%loading%%', count: '%%count%%', currency: '%%currency%%' };

createRoot(document.getElementById('root')).render(<ExpenseScreen labels={labels} />);
