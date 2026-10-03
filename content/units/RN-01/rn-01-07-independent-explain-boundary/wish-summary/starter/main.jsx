// Preview plumbing (read-only): shows WishSummary with the six sample wishes.
import { createRoot } from 'react-dom/client';
import { WishSummary } from './WishSummary.jsx';

const items = [
  { id: 'w-01', name: '%%w01%%', price: 80, acquired: false },
  { id: 'w-02', name: '%%w02%%', price: 45, acquired: false },
  { id: 'w-03', name: '%%w03%%', price: 240, acquired: false },
  { id: 'w-04', name: '%%w04%%', price: 25, acquired: true },
  { id: 'w-05', name: '%%w05%%', price: null, acquired: false },
  { id: 'w-06', name: '%%w06%%', price: 18, acquired: true },
];
const labels = { title: '%%title%%', total: '%%total%%', toggle: '%%toggle%%' };

createRoot(document.getElementById('root')).render(<WishSummary items={items} labels={labels} />);
