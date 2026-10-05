// Preview plumbing (read-only): the simulated device first, then the screen.
import './simulated-device.js';
import { createRoot } from 'react-dom/client';
import { SettingsScreen } from './SettingsScreen.jsx';

const expenses = [
  { id: 'e-01', label: '%%groceries%%', amountMinor: 84550, date: '2026-03-01', category: 'food' },
  { id: 'e-02', label: '%%transit%%', amountMinor: 52000, date: '2026-03-01', category: 'transport' },
  { id: 'e-03', label: '%%coffee%%', amountMinor: 18000, date: '2026-02-28', category: 'fun' },
];
const labels = { title: '%%title%%', server: '%%server%%', total: '%%total%%', currency: '%%currency%%' };

createRoot(document.getElementById('root')).render(<SettingsScreen expenses={expenses} labels={labels} />);
