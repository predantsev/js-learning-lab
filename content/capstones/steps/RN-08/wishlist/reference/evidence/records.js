// records.js: the CP-RN evidence of the wish enhancement — one record per check. Nothing was performed on
// a native target where this reference was prepared, so every check is a skip record: what was not done,
// on which target, why, and what it takes to come back. A skip never carries a result.
import { declaredTarget, otherPlatform } from './build.js';

const reason = 'no emulator, simulator or phone, and no Android SDK, on the computer where this reference was prepared';
const revisit = 'install the RN-11 release build on the declared target, perform the check as RN-08 describes it and replace this record with procedure, observed, outcome and provenance learner-authored';

export const records = [
  { check: 'restart', target: declaredTarget, provenance: 'skipped', reason: reason, revisit: revisit },
  { check: 'offline', target: declaredTarget, provenance: 'skipped', reason: reason, revisit: revisit },
  { check: 'lifecycle', target: declaredTarget, provenance: 'skipped', reason: reason, revisit: revisit },
  { check: 'security', target: declaredTarget, provenance: 'skipped', reason: reason, revisit: revisit },
  { check: 'a11y', target: declaredTarget, provenance: 'skipped', reason: reason, revisit: revisit },
  { check: 'performance', target: declaredTarget, provenance: 'skipped', reason: reason, revisit: revisit },
  { check: 'a11y', target: otherPlatform, provenance: 'skipped', reason: 'the other platform needs Xcode on macOS', revisit: 'build for the iOS simulator and repeat the screen-reader check with VoiceOver' },
];
