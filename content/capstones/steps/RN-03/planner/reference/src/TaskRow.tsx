// One task in the list: the title, the due date through the date-formatting adapter, the priority in
// words and the done state, then its actions. A delete asks first, inside the row. A screen reader
// hears the text part as one sentence: the shared formatter formatTaskLabel and the done state.
import { StyleSheet, Text, View } from 'react-native';
import { formatTaskLabel, priorityText } from '../domain/tasks.ts';
import type { Task } from '../domain/tasks.ts';
import type { DateFormat } from './contracts.ts';
import { ActionButton } from './ActionButton.tsx';

type TaskRowProps = {
  task: Task;
  format: DateFormat;
  confirming: boolean; // the delete question is open
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
};

export function TaskRow({ task, format, confirming, onToggle, onEdit, onDelete, onConfirmDelete, onCancelDelete }: TaskRowProps) {
  const state = task.done ? '%%doneMark%%' : '%%pendingMark%%';
  return (
    <View style={styles.row}>
      <View style={styles.line} accessible={true} accessibilityLabel={formatTaskLabel(task) + ', ' + state}>
        <View style={styles.text}>
          <Text style={styles.title}>{task.title}</Text>
          <Text style={styles.meta}>{format.day(task.dueDate) + ' · ' + priorityText(task.priority)}</Text>
        </View>
        <Text style={task.done ? styles.done : styles.pending}>{state}</Text>
      </View>
      {confirming ? (
        <View style={styles.actions}>
          <Text style={styles.question}>%%confirmQuestion%%</Text>
          <ActionButton text="%%confirmDeleteLabel%%" kind="danger" onPress={onConfirmDelete} />
          <ActionButton text="%%cancelLabel%%" onPress={onCancelDelete} />
        </View>
      ) : (
        <View style={styles.actions}>
          <ActionButton text={task.done ? '%%markPendingLabel%%' : '%%markDoneLabel%%'} onPress={onToggle} />
          <ActionButton text="%%editLabel%%" onPress={onEdit} />
          <ActionButton text="%%deleteLabel%%" kind="danger" onPress={onDelete} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderColor: '#d4d4d4' },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  text: { flexShrink: 1, flexGrow: 1, gap: 2 },
  title: { fontSize: 16, color: '#1a1a1a' },
  meta: { fontSize: 14, color: '#4a4a4a' },
  done: { fontSize: 14, color: '#2f6b2f' },
  pending: { fontSize: 14, color: '#4a4a4a' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  question: { fontSize: 15, color: '#1a1a1a', flexBasis: '100%' },
});
