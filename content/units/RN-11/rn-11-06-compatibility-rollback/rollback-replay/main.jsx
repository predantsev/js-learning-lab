// Preview plumbing: one phone's release timeline.
import { createRoot } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';
import { replay } from './simulated-timeline.js';

const tasks = [
  { id: 't-01', title: '%%plants%%', dueDate: '2026-03-02', done: false },
  { id: 't-04', title: '%%internet%%', dueDate: '2026-02-27', done: true },
  { id: 't-06', title: '%%wardrobe%%', dueDate: '2026-03-05', done: true },
];

const label = { saved: '%%saved%%', migrated: '%%migrated%%', ok: '%%read%%', unreadable: '%%unreadable%%' };

function Timeline() {
  const events = replay(tasks);
  return (
    <View style={styles.screen}>
      <Text role="heading" style={styles.title}>%%title%%</Text>
      {events.map((event) => {
        const line = `build ${event.build} (versionCode ${event.versionCode}): ${event.text}, schema v${event.schema}` +
          (event.count === undefined ? '' : `, tasks ${event.count}, done ${event.done}`);
        console.log(line);
        return (
          <View key={event.build} style={styles.event}>
            <Text style={styles.build}>%%build%% {event.build} · versionCode {event.versionCode}</Text>
            <Text>{label[event.text]} · schema v{event.schema}</Text>
            {event.count !== undefined && <Text>%%tasks%%: {event.count}, %%done%%: {event.done}</Text>}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 8 },
  title: { fontSize: 20, fontWeight: '600' },
  event: { borderLeftWidth: 3, borderLeftColor: '#3d5a80', paddingLeft: 10, gap: 2 },
  build: { fontWeight: '600' },
});

createRoot(document.getElementById('root')).render(<Timeline />);
