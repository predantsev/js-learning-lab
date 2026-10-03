// main.jsx: the app on top, the simulated OS panel underneath.
import { createRoot } from 'react-dom/client';
import { View } from 'react-native';
import { createOs } from './osSim.js';
import { OsPanel } from './OsPanel.jsx';
import { PhotoGate } from './PhotoGate.jsx';

const os = createOs({ platform: 'android', hasCamera: true }); // try platform: 'ios', or hasCamera: false

createRoot(document.getElementById('root')).render(
  <View>
    <PhotoGate os={os} />
    <OsPanel os={os} />
  </View>,
);
