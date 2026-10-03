// Two habit rows in a phone-wide frame (300 units) in the browser preview, at a simulated 200 % text size.
import { createRoot } from 'react-dom/client';
import { View } from 'react-native';
import { HabitRow } from './HabitRow.jsx';

const habits = [
  { id: 'h-05', name: '%%words%%', completions: ['2026-02-20'], details: '%%wordsDetails%%' },
  { id: 'h-03', name: '%%water%%', completions: ['2026-03-01'], details: '%%waterDetails%%' },
];

createRoot(document.getElementById('root')).render(
  <View style={{ width: 300, borderWidth: 1, borderColor: '#767676' }}>
    {habits.map((habit) => <HabitRow key={habit.id} habit={habit} />)}
  </View>,
);
