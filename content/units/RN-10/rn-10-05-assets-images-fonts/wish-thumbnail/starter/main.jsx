// Shows two wishes with 64-point thumbnails on a SIMULATED 3× screen; the font arrives after 2 s. Do not edit.
import { createRoot } from 'react-dom/client';
import { StyleSheet, View } from 'react-native';
import { useSimulatedFonts, variantsFor } from './assets.js';
import { WishThumbnail } from './WishThumbnail.jsx';

export const PIXEL_RATIO = 3; // a simulated phone screen: 3 pixels per point

const wishes = [
  { id: 'w-01', name: '%%headphones%%', variants: variantsFor('#0f766e') },
  { id: 'w-02', name: '%%lamp%%', variants: variantsFor('#b45309') },
];

function App() {
  const [fontsLoaded] = useSimulatedFonts(2000);
  return (
    <View style={styles.screen}>
      {wishes.map((wish) => (
        <View key={wish.id} testID={`wish-${wish.id}`}>
          <WishThumbnail wish={wish} size={64} pixelRatio={PIXEL_RATIO} fontsLoaded={fontsLoaded} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ screen: { padding: 12, gap: 12 } });

createRoot(document.getElementById('root')).render(<App />);
