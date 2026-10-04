import { useState } from 'react';
import { ExpenseList } from './ExpenseList.jsx';

const CATEGORIES = [
  { id: 'food', label: '%%food%%' },
  { id: 'fun', label: '%%fun%%' },
];

export default function App() {
  const [category, setCategory] = useState('food');
  const [open, setOpen] = useState(true);
  return (
    <main>
      <h1>%%title%%</h1>
      <p>
        {CATEGORIES.map((item) => (
          <button key={item.id} type="button" aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>
            {item.label}
          </button>
        ))}{' '}
        <button type="button" onClick={() => setOpen(!open)}>
          {open ? '%%close%%' : '%%open%%'}
        </button>
      </p>
      {open ? <ExpenseList category={category} /> : <p>%%closed%%</p>}
    </main>
  );
}
