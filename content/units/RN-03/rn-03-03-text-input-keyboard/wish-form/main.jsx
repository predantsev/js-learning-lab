// Shows the wish form in the browser preview and logs where focus goes.
import { createRoot } from 'react-dom/client';
import { WishForm } from './WishForm.jsx';

document.addEventListener('focusin', (event) => {
  console.log(`focus → ${event.target.getAttribute('aria-label') ?? event.target.tagName}`);
});

createRoot(document.getElementById('root')).render(
  <WishForm onSave={(draft) => console.log(`save ${JSON.stringify(draft)}`)} />,
);
