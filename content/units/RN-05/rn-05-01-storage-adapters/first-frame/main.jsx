// Preview plumbing: fills the simulated device store, then starts the app.
// A real Expo app registers its root component instead (registerRootComponent(App)).
import { createRoot } from 'react-dom/client';
import { device, nativeStore } from './native-store.js';
import { WishlistScreen } from './WishlistScreen.jsx';

const READ_DELAY_MS = 0; // how long the simulated store takes to answer a read

device.configure({ readDelayMs: READ_DELAY_MS });
device.seed({
  'jsll.wishlist.v1': JSON.stringify({
    schemaVersion: 1,
    records: [
      { id: 'w-01', name: '%%headphones%%', price: 80, acquired: false, category: null },
      { id: 'w-02', name: '%%lamp%%', price: 45, acquired: false, category: null },
      { id: 'w-05', name: '%%tickets%%', price: null, acquired: false, category: null },
    ],
  }),
});

const labels = {
  title: '%%title%%',
  loading: '%%loading%%',
  empty: '%%empty%%',
  frame: '%%frame%%',
  wishes: '%%wishes%%',
};

createRoot(document.getElementById('root')).render(<WishlistScreen storage={nativeStore} labels={labels} />);
