// Shows the amount field in the browser preview. Do not edit.
import { createRoot } from 'react-dom/client';
import { AmountField } from './AmountField.jsx';

createRoot(document.getElementById('root')).render(
  <AmountField onSave={(amountMinor) => console.log(`saved ${amountMinor}`)} />,
);
