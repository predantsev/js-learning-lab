// RecordCards.jsx (read-only): shows each record with the status judge() gives it.
import { StyleSheet, Text, View } from 'react-native';
import { build, declaredTarget } from './build.js';
import { judge } from './evidence.js';

const STATUS = {
  passed: '%%statusPassed%%',
  assisted: '%%statusAssisted%%',
  failed: '%%statusFailed%%',
  supplied: '%%statusSupplied%%',
  skipped: '%%statusSkipped%%',
  rejected: '%%statusRejected%%',
};
const REASON = {
  'unknown-check': '%%reasonUnknownCheck%%',
  'unknown-provenance': '%%reasonUnknownProvenance%%',
  'skip-without-reason': '%%reasonSkipWithoutReason%%',
  'skip-claims-result': '%%reasonSkipClaimsResult%%',
  'not-native-evidence': '%%reasonNotNative%%',
  'screenshot-only': '%%reasonScreenshotOnly%%',
  incomplete: '%%reasonIncomplete%%',
  'wrong-build': '%%reasonWrongBuild%%',
  'wrong-target': '%%reasonWrongTarget%%',
};

export function RecordCards({ records }) {
  return (
    <View style={styles.list}>
      {records.map((record, index) => {
        const verdict = judge(record, { declaredTarget, build });
        return (
          <View key={index} style={[styles.card, verdict.status === 'rejected' && styles.rejected]}>
            <Text style={styles.check}>
              {record?.check ?? '?'} · {record?.target?.name ?? '?'} ({record?.target?.kind ?? '?'})
            </Text>
            <Text style={styles.status}>
              {STATUS[verdict.status]}
              {verdict.reason ? `: ${REASON[verdict.reason]}` : ''}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8, padding: 8, maxWidth: 420 },
  card: { padding: 10, gap: 4, borderWidth: 1, borderColor: '#767676', borderRadius: 8, backgroundColor: '#ffffff' },
  rejected: { borderWidth: 2, borderColor: '#a11d1d', borderStyle: 'dashed' },
  check: { fontSize: 15, fontWeight: '600' },
  status: { fontSize: 15 },
});
