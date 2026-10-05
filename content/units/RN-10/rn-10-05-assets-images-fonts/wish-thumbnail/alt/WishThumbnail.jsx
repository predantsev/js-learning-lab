// WishThumbnail.jsx: a helper picks the variant; one placeholder covers the whole row until it is ready.
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

function pickVariant(variants, pixels) {
  let best = variants[0];
  for (const variant of variants) {
    best = variant;
    if (variant.px >= pixels) break;
  }
  return best;
}

export function WishThumbnail({ wish, size, pixelRatio, fontsLoaded }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const source = pickVariant(wish.variants, Math.ceil(size * pixelRatio));
  const imageStyle = { width: size, height: size };

  return (
    <View style={styles.row}>
      <Image
        source={{ uri: source.uri }}
        style={imageStyle}
        accessibilityLabel={wish.name}
        accessible={true}
        onLoad={() => setImageLoaded(true)}
      />
      {imageLoaded && fontsLoaded ? <Text style={styles.name}>{wish.name}</Text> : null}
      {imageLoaded && fontsLoaded ? null : <View testID="placeholder" style={[StyleSheet.absoluteFill, styles.placeholder]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64 },
  name: { fontFamily: 'Inter-Bold', fontSize: 16 },
  placeholder: { backgroundColor: '#d4d4d4', borderRadius: 4 },
});
