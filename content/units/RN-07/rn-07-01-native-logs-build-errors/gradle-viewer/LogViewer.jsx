import { ScrollView, StyleSheet, Text, View } from 'react-native';

// Applies the filter to the log and shows the remaining lines with their line numbers.
export function applyFilter(lines, { startAt, hide }) {
  const numbered = lines.map((text, index) => ({ number: index + 1, text }));
  const first = startAt ? numbered.findIndex((line) => startAt.test(line.text)) : 0;
  const fromStart = first === -1 ? [] : numbered.slice(first);
  return fromStart.filter((line) => !hide.some((pattern) => pattern.test(line.text)));
}

export function LogViewer({ lines, filter, labels }) {
  const shown = applyFilter(lines, filter);
  return (
    <View style={styles.box}>
      <Text style={styles.count}>{labels.shown.replace('{shown}', shown.length).replace('{total}', lines.length)}</Text>
      <ScrollView style={styles.scroll}>
        {shown.map((line) => (
          <Text key={line.number} style={[styles.line, /^e: |FAILED|^FAILURE/.test(line.text) && styles.error]}>
            {String(line.number).padStart(3, ' ')}  {line.text}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: 8, gap: 6 },
  count: { fontWeight: '600' },
  scroll: { maxHeight: 360, borderWidth: 1, borderColor: '#6b7280', padding: 4 },
  line: { fontFamily: 'monospace', fontSize: 12 },
  error: { color: '#b91c1c', fontWeight: '600' },
});
