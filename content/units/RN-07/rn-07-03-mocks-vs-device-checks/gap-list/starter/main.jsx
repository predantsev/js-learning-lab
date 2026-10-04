// Shows the claims and your mock-gap list as a table. Do not edit.
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { claims } from './claims.js';
import { gaps } from './gaps.js';

function GapTable() {
  const byClaim = new Map(gaps.map((gap) => [gap.claim, gap]));
  return (
    <View style={styles.screen}>
      {claims.map((claim) => {
        const gap = byClaim.get(claim.id);
        return (
          <View key={claim.id} style={[styles.row, gap && styles.gap]}>
            <Text style={styles.claim}>{claim.id} · {claim.text}</Text>
            <Text>{gap ? `%%device%%: ${gap.check} → ${gap.expected} (${gap.target})` : '%%mockOnly%%'}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 8, gap: 6 },
  row: { padding: 8, borderWidth: 1, borderColor: '#6b7280', borderRadius: 6, gap: 2 },
  gap: { borderColor: '#b45309', borderWidth: 2 },
  claim: { fontWeight: '600' },
});

createRoot(document.getElementById('root')).render(<GapTable />);
