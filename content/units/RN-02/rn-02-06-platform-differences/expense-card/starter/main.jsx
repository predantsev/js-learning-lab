// One expense card in the browser preview (react-native-web), where Platform.OS is 'web'.
import { createRoot } from 'react-dom/client';
import { View } from 'react-native';
import { ExpenseCard } from './ExpenseCard.jsx';

const expense = { id: 'e-03', label: '%%coffee%%', amount: '180,00 ₴' };

createRoot(document.getElementById('root')).render(
  <View style={{ padding: 16 }}>
    <ExpenseCard expense={expense} />
  </View>,
);
