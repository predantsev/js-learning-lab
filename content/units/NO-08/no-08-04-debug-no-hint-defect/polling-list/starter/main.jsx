import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { installFakeServer } from './fakeServer.js';

installFakeServer();
createRoot(document.getElementById('root')).render(<App />);
