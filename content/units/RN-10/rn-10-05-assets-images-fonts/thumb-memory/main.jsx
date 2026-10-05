// A 64-point wish thumbnail on a SIMULATED 3× screen: which picture is decoded, and how much memory it takes.
import { createRoot } from 'react-dom/client';
import { Image, StyleSheet, Text, View } from 'react-native';
import { decodedBytes, useSimulatedFonts, variantsFor } from './assets.js';

const SIZE = 64;          // points on screen
const PIXEL_RATIO = 3;    // pixels per point on the simulated phone
const USE_ORIGINAL = true; // true: ship the 4000-pixel original; false: pick the variant that fits
const FONT_DELAY_MS = 800; // when the simulated custom font arrives

const variants = variantsFor('#0f766e');
const needed = SIZE * PIXEL_RATIO;
const source = USE_ORIGINAL ? variants.at(-1) : variants.find((v) => v.px >= needed) ?? variants.at(-1);
const mib = (bytes) => (bytes / 1024 / 1024).toFixed(2);

console.log(`screen draws ${needed} × ${needed} pixels`);
console.log(`decoded picture: ${source.px} × ${source.px} px = ${mib(decodedBytes(source.px))} MiB`);

function App() {
  const [fontsLoaded] = useSimulatedFonts(FONT_DELAY_MS);
  return (
    <View style={styles.screen}>
      <View style={styles.row}>
        <Image source={{ uri: source.uri }} style={{ width: SIZE, height: SIZE }} accessible accessibilityLabel="%%headphones%%" />
        {/* Simulated custom font: a serif stands in for it once "loaded"; before that, the system font. */}
        <Text style={[styles.name, fontsLoaded && styles.customFont]}>%%headphones%%</Text>
      </View>
      <Text>{fontsLoaded ? '%%fontReady%%' : '%%fontFallback%%'}</Text>
      <Text>%%decoded%%: {source.px} × {source.px} px ≈ {mib(decodedBytes(source.px))} MiB</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 12, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: 18 },
  customFont: { fontFamily: 'Georgia, serif', fontWeight: '700' },
});

createRoot(document.getElementById('root')).render(<App />);
