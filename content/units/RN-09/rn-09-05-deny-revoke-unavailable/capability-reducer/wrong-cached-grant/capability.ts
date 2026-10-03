// capability.ts: once granted, it keeps the grant and ignores later reads — a revoke in Settings goes unnoticed.

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
  if (state.hasCamera === false) return 'fallback';
  if (state.hasCamera === null || state.permission === null) return 'checking';
  if (state.requesting) return 'waiting';
  if (state.permission.status === 'granted') return 'ready';
  if (state.permission.status === 'undetermined') return 'request';
  return state.permission.canAskAgain ? 'rationale' : 'open-settings';
}

export function capabilityReducer(state: CapabilityState, event: CapabilityEvent): CapabilityState {
  switch (event.type) {
    case 'capability-checked':
      return { ...state, hasCamera: event.hasCamera };
    case 'permission-read':
      if (state.permission?.status === 'granted') return state;
      return { ...state, permission: event.permission };
    case 'request-started': {
      const mode = uiModeOf(state);
      // Only a screen that offers the button may ask; anything else is ignored — no request loop.
      if (mode !== 'request' && mode !== 'rationale') return state;
      return { ...state, requesting: true };
    }
    case 'request-finished':
      return { ...state, permission: event.permission, requesting: false };
    default:
      return state;
  }
}
