// capability.ts: the camera capability as state, and the UI mode each state needs.

// What the Expo permission API reports (status + canAskAgain).
export type PermissionSnapshot = { status: 'undetermined' | 'granted' | 'denied'; canAskAgain: boolean };

export type CapabilityState = {
  hasCamera: boolean | null; // null: not checked yet
  permission: PermissionSnapshot | null; // null: not read yet
  requesting: boolean; // a system dialog is open right now
};

export type CapabilityEvent =
  | { type: 'capability-checked'; hasCamera: boolean }
  | { type: 'permission-read'; permission: PermissionSnapshot } // read on mount and on every return to the foreground
  | { type: 'request-started' } // the person pressed the button that asks
  | { type: 'request-finished'; permission: PermissionSnapshot };

export type UiMode = 'checking' | 'fallback' | 'request' | 'rationale' | 'open-settings' | 'waiting' | 'ready';

export const initialCapabilityState: CapabilityState = { hasCamera: null, permission: null, requesting: false };

export function uiModeOf(state: CapabilityState): UiMode {
  return 'checking'; // TODO
}

export function capabilityReducer(state: CapabilityState, event: CapabilityEvent): CapabilityState {
  return state; // TODO
}
