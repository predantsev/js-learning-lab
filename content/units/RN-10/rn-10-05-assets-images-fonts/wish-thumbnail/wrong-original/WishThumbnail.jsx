// WishThumbnail.jsx: always the original photo — it looks the same at 64 points, but decodes 4000 × 4000 pixels.
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

// wish.variants: [{ px, uri }] — square pictures the server offers, smallest first.
export function WishThumbnail({ wish, size, pixelRatio, fontsLoaded }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const needed = size * pixelRatio; // pixels the screen really draws
  const source = wish.variants[wish.variants.length - 1];
  const ready = imageLoaded && fontsLoaded;

  return (
    <View style={styles.row}>
      <View style={{ width: size, height: size }}>
        <Image
          source={{ uri: source.uri }}
          style={{ width: size, height: size }}
          accessible
          accessibilityLabel={wish.name}
          onLoad={() => setImageLoaded(true)}
        />
        {!ready && <View testID="placeholder" style={[StyleSheet.absoluteFill, styles.placeholder]} />}
      </View>
      {ready ? (
        <Text style={styles.name}>{wish.name}</Text>
      ) : (
        <View testID="placeholder" style={[styles.placeholder, { width: 120, height: 16 }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontFamily: 'Inter-Bold', fontSize: 16 },
  placeholder: { backgroundColor: '#d4d4d4', borderRadius: 4 },
});
