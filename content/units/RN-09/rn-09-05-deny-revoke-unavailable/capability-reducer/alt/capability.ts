// capability.ts: the same rules, with the permission part as a lookup table.

export type PermissionSnapshot = { status: 'undetermined' | 'granted' | 'denied'; canAskAgain: boolean };
export type CapabilityState = { hasCamera: boolean | null; permission: PermissionSnapshot | null; requesting: boolean };
export type CapabilityEvent =
  | { type: 'capability-checked'; hasCamera: boolean }
  | { type: 'permission-read'; permission: PermissionSnapshot }
  | { type: 'request-started' }
  | { type: 'request-finished'; permission: PermissionSnapshot };
export type UiMode = 'checking' | 'fallback' | 'request' | 'rationale' | 'open-settings' | 'waiting' | 'ready';

export const initialCapabilityState: CapabilityState = { hasCamera: null, permission: null, requesting: false };

const MODE_BY_ANSWER: Record<string, UiMode> = {
  'granted/true': 'ready',
  'granted/false': 'ready',
  'undetermined/true': 'request',
  'undetermined/false': 'request',
  'denied/true': 'rationale',
  'denied/false': 'open-settings',
};

export function uiModeOf({ hasCamera, permission, requesting }: CapabilityState): UiMode {
  if (hasCamera === false) return 'fallback';
  if (hasCamera === null || permission === null) return 'checking';
  if (requesting) return 'waiting';
  return MODE_BY_ANSWER[`${permission.status}/${permission.canAskAgain}`];
}

const CAN_ASK: UiMode[] = ['request', 'rationale'];

export function capabilityReducer(state: CapabilityState, event: CapabilityEvent): CapabilityState {
  if (event.type === 'capability-checked') return { ...state, hasCamera: event.hasCamera };
  if (event.type === 'permission-read') return { ...state, permission: { ...event.permission } };
  if (event.type === 'request-finished') return { ...state, permission: { ...event.permission }, requesting: false };
  if (event.type === 'request-started' && CAN_ASK.includes(uiModeOf(state))) return { ...state, requesting: true };
  return state;
}
