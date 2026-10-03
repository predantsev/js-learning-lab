// The same expense screen in two SIMULATED frames: portrait and landscape (browser preview, react-native-web).
import { createRoot } from 'react-dom/client';
import { View } from 'react-native';
import { DeviceFrame } from './DeviceFrame.jsx';
import { ExpenseScreen } from './ExpenseScreen.jsx';

createRoot(document.getElementById('root')).render(
  <View style={{ gap: 16, padding: 8, alignItems: 'flex-start' }}>
    <DeviceFrame orientation="portrait"><ExpenseScreen /></DeviceFrame>
    <DeviceFrame orientation="landscape"><ExpenseScreen /></DeviceFrame>
  </View>,
);
