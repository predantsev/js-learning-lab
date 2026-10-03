// deviceSim.js: a stand-in for one phone, for this preview only. Do not edit.
// `files` plays the app's ordinary storage: the text is kept exactly as it was saved.
// `keychain` plays the platform's secure storage: values are kept, but the inspector
// shows only their keys, as a copy of the app's files would not reveal them.
// `deviceLog` plays the system log a phone keeps for the app's console output.
const files = new Map();
const keychain = new Map();
const deviceLog = [];

export const ordinaryStorage = {
  async getItem(key) {
    return files.has(key) ? files.get(key) : null;
  },
  async setItem(key, value) {
    files.set(key, String(value));
  },
};

export const secureStorage = {
  async getSecret(key) {
    return keychain.has(key) ? keychain.get(key) : null;
  },
  async setSecret(key, value) {
    keychain.set(key, String(value));
  },
};

// Stands in for console.log on a phone: the line is kept in the device's log.
export function deviceLogLine(...parts) {
  deviceLog.push(parts.map(String).join(' '));
}

// What someone with a copy of the app's files and the device log could read.
export function inspect() {
  return {
    files: [...files].map(([key, value]) => ({ key, value })),
    keychainKeys: [...keychain.keys()],
    log: [...deviceLog],
  };
}
