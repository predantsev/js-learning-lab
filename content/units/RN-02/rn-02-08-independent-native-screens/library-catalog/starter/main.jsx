// The catalog screen in two SIMULATED frames (portrait and landscape) at a simulated 200 % text size.
import { createRoot } from 'react-dom/client';
import { View } from 'react-native';
import { Catalog } from './Catalog.jsx';
import { DeviceFrame } from './DeviceFrame.jsx';

createRoot(document.getElementById('root')).render(
  <View style={{ gap: 16, padding: 8, alignItems: 'flex-start' }}>
    <DeviceFrame orientation="portrait"><Catalog /></DeviceFrame>
    <DeviceFrame orientation="landscape"><Catalog /></DeviceFrame>
  </View>,
);
