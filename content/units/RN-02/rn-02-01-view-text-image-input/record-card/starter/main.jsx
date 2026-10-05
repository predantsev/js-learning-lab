// Shows two wishes in the browser preview (react-native-web).
import { createRoot } from 'react-dom/client';
import { View } from 'react-native';
import { RecordCard } from './RecordCard.jsx';

const wishes = [
  { id: 'w-02', name: '%%lamp%%', price: 45, acquired: false },
  { id: 'w-05', name: '%%tickets%%', price: null, acquired: false },
];

createRoot(document.getElementById('root')).render(
  <View style={{ gap: 12, padding: 12 }}>
    {wishes.map((wish) => <RecordCard key={wish.id} item={wish} />)}
  </View>,
);
