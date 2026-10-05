// request.js (read-only): three capability requests for the habit tracker, what was found for each,
// the project and the migration note of the library chosen for steps. Libraries are invented.
export const project = {
  reactNative: '0.86.3', // "react-native" in package.json
  targets: ['android'], // the declared target: an Android emulator; this computer cannot run iOS
};

export const requests = {
  shareSummary: `%%reqShare%%`,
  stepCount: `%%reqSteps%%`,
  ringPulse: `%%reqRing%%`,
};

// Routes: 'built-in' — an API React Native itself has; 'library' — an existing library provides it;
// 'custom-module' — nothing exists, the team writes its own native module.
export const ROUTES = ['built-in', 'library', 'custom-module'];

// What a spike result can reject the library for.
export const REJECT_CODES = {
  'build-fails': `%%rejBuild%%`,
  'crash-on-target': `%%rejCrash%%`,
  'feature-missing': `%%rejFeature%%`,
  'slow-on-device': `%%rejSlow%%`,
  'ios-unchecked': `%%rejIos%%`,
};

// The migration note of step-sensor-legacy@1.9.0 on React Native 0.86: one line per piece.
export const migrationNote = [
  { id: 'a', text: `%%noteA%%` },
  { id: 'b', text: `%%noteB%%` },
  { id: 'c', text: `%%noteC%%` },
  { id: 'd', text: `%%noteD%%` },
  { id: 'e', text: `%%noteE%%` },
];
