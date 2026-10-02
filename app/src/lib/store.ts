// Minimal external store for React (useSyncExternalStore). No dependencies.
import { useSyncExternalStore } from 'react';

export class Store<T> {
  private listeners = new Set<() => void>();
  constructor(private value: T) {}
  get = (): T => this.value;
  set = (next: T | ((current: T) => T)): void => {
    const value = typeof next === 'function' ? (next as (current: T) => T)(this.value) : next;
    if (Object.is(value, this.value)) return;
    this.value = value;
    for (const listener of [...this.listeners]) listener();
  };
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
}

export function useStore<T>(store: Store<T>): T;
export function useStore<T, S>(store: Store<T>, selector: (value: T) => S): S;
export function useStore<T, S>(store: Store<T>, selector?: (value: T) => S): T | S {
  return useSyncExternalStore(store.subscribe, () => (selector ? selector(store.get()) : store.get()));
}
