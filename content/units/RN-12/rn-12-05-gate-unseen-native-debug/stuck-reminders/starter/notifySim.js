// notifySim.js (read-only): a SIMULATED notification module with the shape of the expo-notifications
// calls the real app uses (Expo SDK 57): getPermissionsAsync, requestPermissionsAsync,
// cancelAllScheduledNotificationsAsync and scheduleNotificationAsync. openSettings stands for
// React Native's Linking.openSettings().
//
// Where it differs from the real module: the permission is one value that revoke()/allow() change
// (on a device the person changes it in the system settings, and on Android the system may end
// the app's process when a permission is revoked); requestPermissionsAsync never shows a dialog —
// it answers with the `answer` given to createNotifications; nothing is ever shown as a
// notification, and scheduleNotificationAsync rejects without the permission, or always when
// failScheduling is true.
export function createNotifications({ granted = true, answer = 'deny', failScheduling = false } = {}) {
  let status = granted ? 'granted' : 'undetermined';
  const scheduled = [];
  let settingsOpened = 0;
  const permission = () => ({ granted: status === 'granted', status, canAskAgain: status === 'undetermined' });

  return {
    async getPermissionsAsync() {
      return permission();
    },
    async requestPermissionsAsync() {
      if (status === 'undetermined') status = answer === 'allow' ? 'granted' : 'denied';
      return permission();
    },
    async cancelAllScheduledNotificationsAsync() {
      scheduled.length = 0;
    },
    async scheduleNotificationAsync(request) {
      if (failScheduling) throw new Error('Scheduling failed');
      if (status !== 'granted') throw new Error('Notifications are not allowed');
      scheduled.push(request);
      return `n-${scheduled.length}`;
    },
    openSettings() {
      settingsOpened += 1;
    },
    // The system settings, as the person would use them.
    revoke() {
      status = 'denied';
    },
    allow() {
      status = 'granted';
    },
    // For checks.
    scheduledCount: () => scheduled.length,
    settingsOpened: () => settingsOpened,
  };
}
