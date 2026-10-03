// Read-only: expenses on a SIMULATED stack (see navSim.jsx) with a simulated Alert (see alertSim.jsx).
import { createRoot } from 'react-dom/client';
import { Pressable, Text } from 'react-native';
import { SimAlertHost } from './alertSim.jsx';
import { EditScreen } from './ExpenseEdit.jsx';
import { expenses } from './expenses.js';
import { SimStack, createStack } from './navSim.jsx';

function ListScreen({ navigation }) {
  return expenses.useRecords().map((expense) => (
    <Pressable
      key={expense.id}
      accessibilityRole="button"
      style={{ minHeight: 44, justifyContent: 'center' }}
      onPress={() => navigation.push('Edit', { id: expense.id })}
    >
      <Text>{expense.label}</Text>
    </Pressable>
  ));
}

export const stack = createStack('List');

createRoot(document.getElementById('root')).render(
  <>
    <SimStack stack={stack} platform="both" screens={{ List: ListScreen, Edit: EditScreen }} />
    <SimAlertHost />
  </>,
);
