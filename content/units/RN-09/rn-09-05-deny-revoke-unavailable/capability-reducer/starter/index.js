// index.js: plays one story through your reducer and prints the UI mode after each event. Do not edit.
import { capabilityReducer, initialCapabilityState, uiModeOf } from './capability.ts';

const story = [
  { type: 'capability-checked', hasCamera: true },
  { type: 'permission-read', permission: { status: 'undetermined', canAskAgain: true } },
  { type: 'request-started' },
  { type: 'request-finished', permission: { status: 'denied', canAskAgain: true } },
  { type: 'request-started' },
  { type: 'request-finished', permission: { status: 'denied', canAskAgain: false } },
  { type: 'request-started' },
  { type: 'permission-read', permission: { status: 'granted', canAskAgain: true } },
  { type: 'permission-read', permission: { status: 'denied', canAskAgain: false } },
];

let state = initialCapabilityState;
console.log('start →', uiModeOf(state));
for (const event of story) {
  try {
    state = capabilityReducer(state, event);
    const detail = event.permission ? ` ${event.permission.status}/${event.permission.canAskAgain}` : '';
    console.log(`${event.type}${detail} →`, uiModeOf(state));
  } catch (error) {
    console.log(`${event.type} → threw`, error.message);
  }
}
