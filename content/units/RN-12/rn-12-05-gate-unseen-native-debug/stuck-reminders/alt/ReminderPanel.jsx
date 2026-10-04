// ReminderPanel.jsx: schedules a reminder for every task due today, when notifications are allowed.
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

async function scheduleDueReminders(notifications, due) {
  await notifications.cancelAllScheduledNotificationsAsync();
  for (const task of due) {
    await notifications.scheduleNotificationAsync({
      content: { title: '%%dueToday%%', body: task.title },
      trigger: { type: 'timeInterval', seconds: 60 * 60 },
    });
  }
}

export function ReminderPanel({ due, notifications, appState }) {
  const [status, setStatus] = useState('checking');

  const refresh = useCallback(
    async (ask) => {
      setStatus('checking');
      let next = 'off';
      try {
        let settings = await notifications.getPermissionsAsync();
        if (!settings.granted && ask && settings.canAskAgain) settings = await notifications.requestPermissionsAsync();
        if (settings.granted) {
          await scheduleDueReminders(notifications, due);
          next = 'on';
        }
      } catch (error) {
        console.warn(error.message);
      } finally {
        setStatus(next);
      }
    },
    [notifications, due],
  );

  useEffect(() => {
    refresh(true);
    const subscription = appState.addEventListener('change', (next) => {
      if (next === 'active') refresh(false);
    });
    return () => subscription.remove();
  }, [refresh, appState]);

  if (status === 'checking') {
    return (
      <View style={styles.row}>
        <ActivityIndicator />
        <Text>%%checking%%</Text>
      </View>
    );
  }
  if (status === 'off') {
    return (
      <View style={styles.box}>
        <Text>%%remindersOff%%</Text>
        <Pressable accessibilityRole="button" style={styles.button} onPress={() => notifications.openSettings()}>
          <Text>%%openSettings%%</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <Text>
      %%remindersOn%%: {due.length}
    </Text>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  box: { gap: 8 },
  button: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, borderWidth: 1, borderColor: '#767676', borderRadius: 8 },
});
