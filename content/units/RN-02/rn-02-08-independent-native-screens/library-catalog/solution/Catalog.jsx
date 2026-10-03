import { useEffect, useRef, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { moveAccessibilityFocus } from './a11yFocus.js';
import { books as initialBooks, MESSAGES, validateBook } from './catalog.js';
import { useSimulatedInsets } from './DeviceFrame.jsx';
import { ScaledText as Text, ScaledTextInput as TextInput } from './Scaled.jsx';

// Pictures do not load in the preview; give the cover a size and a background.
const COVER = { uri: 'https://example.com/cover.png' };

// The object you pass to Platform.select for your one platform difference.
// Justification: a card shadow is drawn by different props on each platform (shadow* on iOS, elevation on Android).
export const platformSpec = {
  ios: { shadowColor: '#000000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  android: { elevation: 3 },
  default: { borderWidth: 1, borderColor: '#767676' },
};
const cardShadow = Platform.select(platformSpec);

function BookCard({ book }) {
  const status = book.available ? "%%available%%" : "%%onLoan%%";
  return (
    <View testID="book" accessible={true} accessibilityLabel={`${book.title}, ${book.author}, ${status}`} style={[styles.card, cardShadow]}>
      <Image testID="cover" source={COVER} style={styles.cover} />
      <View style={styles.cardText}>
        <Text style={styles.bookTitle}>{book.title}</Text>
        <Text style={styles.meta}>{book.author}</Text>
        <Text style={styles.meta}>{status}</Text>
      </View>
    </View>
  );
}

function Field({ label, value, onChangeText, error }) {
  const errorRef = useRef(null);
  useEffect(() => {
    if (error) moveAccessibilityFocus(errorRef);
  }, [error]);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} style={styles.input} />
      {error ? <Text ref={errorRef} accessible={true} style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function Catalog() {
  const insets = useSimulatedInsets(); // on a device: useSafeAreaInsets()
  const [books, setBooks] = useState(initialBooks);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [errors, setErrors] = useState({});
  const sides = { paddingLeft: 16 + insets.left, paddingRight: 16 + insets.right };

  function save() {
    const result = validateBook({ title, author });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setBooks([...books, { id: `b-${books.length + 1}`, ...result.value }]);
    setTitle('');
    setAuthor('');
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, sides, { paddingTop: 12 + insets.top }]}>
        <Text testID="heading" accessibilityRole="header" style={styles.heading}>%%heading%%</Text>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={[styles.content, sides, { paddingBottom: 16 + insets.bottom }]}>
        {books.map((book) => <BookCard key={book.id} book={book} />)}
        <Field label="%%titleLabel%%" value={title} onChangeText={setTitle} error={errors.title ? MESSAGES[errors.title] : null} />
        <Field label="%%authorLabel%%" value={author} onChangeText={setAuthor} error={errors.author ? MESSAGES[errors.author] : null} />
        <Pressable accessibilityRole="button" onPress={save} style={styles.save}>
          <Text style={styles.saveText}>%%save%%</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingVertical: 12, backgroundColor: '#e8eef7' },
  heading: { fontSize: 18, fontWeight: '600' },
  body: { flex: 1 },
  content: { paddingTop: 12, gap: 12 },
  card: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 8, backgroundColor: '#ffffff' },
  cover: { width: 48, height: 64, backgroundColor: '#d4d4d4' },
  cardText: { flexShrink: 1, gap: 2 },
  bookTitle: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 14, color: '#4b4b4b' },
  field: { gap: 4 },
  label: { fontSize: 14 },
  input: { minHeight: 44, paddingHorizontal: 10, paddingVertical: 8, fontSize: 16, borderWidth: 1, borderColor: '#767676', borderRadius: 6 },
  error: { fontSize: 14, color: '#b91c1c' },
  save: { minHeight: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1d4ed8', borderRadius: 8 },
  saveText: { fontSize: 16, color: '#ffffff' },
});
