import { useState } from 'react';

// Returns { state, request }.
// state: 'unavailable' | 'ask' | 'granted' | 'denied' | 'blocked' (and anything you like while checking).
// adapter: { isAvailable(), getPermission(), requestPermission() } — each returns a promise.
// subscribeForeground(listener) calls listener when the app returns to the foreground and returns an unsubscribe function.
export function usePermissionGate(adapter, subscribeForeground) {
  const [state, setState] = useState('checking');
  // TODO: check on mount and on every return to the foreground; ask only in request().
  async function request() {}
  return { state, request };
}
