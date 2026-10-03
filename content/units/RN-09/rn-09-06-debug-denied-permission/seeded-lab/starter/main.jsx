// main.jsx: the lab app with the simulated system dialog under it. Try hasCamera: false to reproduce the second defect.
import { createRoot } from 'react-dom/client';
import { View } from 'react-native';
import { DialogPanel } from './DialogPanel.jsx';
import { createLabDevice } from './labDevice.jsx';
import { ProgressPhoto } from './ProgressPhoto.jsx';

const device = createLabDevice({ hasCamera: true });

createRoot(document.getElementById('root')).render(
  <View>
    <ProgressPhoto device={device} />
    <DialogPanel device={device} />
  </View>,
);
