// Preview plumbing, not React Native: a real app registers its root component
// (Expo: registerRootComponent(App)); here react-dom puts it into the browser page.
import { createRoot } from 'react-dom/client';
import { WishCard } from './WishCard.jsx';
import { logCommittedDom } from './show-dom.js';

const wish = { id: 'w-01', name: '%%wishName%%', price: 80, acquired: false };
const labels = {
  noPrice: '%%noPrice%%',
  currency: '%%currency%%',
  wanted: '%%wanted%%',
  acquired: '%%acquired%%',
  toggle: '%%toggle%%',
};

const container = document.getElementById('root');
createRoot(container).render(<WishCard wish={wish} labels={labels} />);
logCommittedDom(container);
