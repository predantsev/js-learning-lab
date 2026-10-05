// osSim.js: a simulated operating system for this preview only. Do not edit.
// It imitates the camera permission as the Expo permission API reports it — { status, granted, canAskAgain } —
// with the documented platform rules: on Android 11+ a second "Don't allow" stops the dialog from appearing;
// on iOS the dialog appears only once. The system dialog is drawn by the OS panel under the app.
export function createOs({ platform, hasCamera }) {
  let status = 'undetermined';
  let canAskAgain = true;
  let denials = 0;
  let dialogsShown = 0;
  let pendingDialog = null; // the resolve function of an open dialog
  let appState = 'active';
  const appStateListeners = new Set();
  const panelListeners = new Set();

  const snapshot = () => ({ status, granted: status === 'granted', canAskAgain });
  const notifyPanel = () => panelListeners.forEach((listener) => listener());

  return {
    platform,
    async hasCamera() {
      return hasCamera;
    },
    async getPermission() {
      return snapshot();
    },
    // Shows the system dialog when the platform still allows it; otherwise answers at once, with no dialog.
    requestPermission() {
      if (status === 'granted' || !canAskAgain || !hasCamera) return Promise.resolve(snapshot());
      dialogsShown += 1;
      return new Promise((resolve) => {
        pendingDialog = (allow) => {
          pendingDialog = null;
          if (allow) status = 'granted';
          else {
            status = 'denied';
            denials += 1;
            canAskAgain = platform === 'android' ? denials < 2 : false;
          }
          notifyPanel();
          resolve(snapshot());
        };
        notifyPanel();
      });
    },
    appState: {
      addEventListener(type, listener) {
        appStateListeners.add(listener);
        return { remove: () => appStateListeners.delete(listener) };
      },
    },
    // What the OS panel can do.
    panel: {
      info: () => ({ ...snapshot(), dialogsShown, dialogOpen: pendingDialog !== null, appState, hasCamera, platform }),
      answerDialog: (allow) => pendingDialog?.(allow),
      settingsAllow() {
        status = 'granted';
        notifyPanel();
      },
      // The lab's own choice: a revoke reads as blocked (canAskAgain: false). The cited documentation does not say
      // what canAskAgain a real device reports after a revoke; check it on your target.
      settingsRevoke() {
        status = 'denied';
        canAskAgain = false;
        notifyPanel();
      },
      leaveAndReturn() {
        for (const next of ['background', 'active']) {
          appState = next;
          appStateListeners.forEach((listener) => listener(next));
        }
        notifyPanel();
      },
      subscribe(listener) {
        panelListeners.add(listener);
        return () => panelListeners.delete(listener);
      },
    },
  };
}
