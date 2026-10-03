// WishThumbnail.jsx: a wish with its picture as a square thumbnail of `size` points.
import { Image, StyleSheet, Text, View } from 'react-native';

// wish.variants: [{ px, uri }] — square pictures the server offers, smallest first.
export function WishThumbnail({ wish, size, pixelRatio, fontsLoaded }) {
  const source = wish.variants[wish.variants.length - 1]; // TODO: the right variant for this screen

  return (
    <View style={styles.row}>
      <Image source={{ uri: source.uri }} />
      <Text style={styles.name}>{wish.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontFamily: 'Inter-Bold', fontSize: 16 },
  placeholder: { backgroundColor: '#d4d4d4', borderRadius: 4 },
});
