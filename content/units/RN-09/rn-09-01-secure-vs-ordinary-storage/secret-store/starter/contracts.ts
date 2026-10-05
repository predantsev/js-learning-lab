// contracts.ts: the secure-storage contract of the lab. Do not edit.
// The sandbox removes the types and checks nothing; `tsc` in your project does the checking.

export type SecretError = 'invalid-key' | 'too-large' | 'unavailable';

// Every method resolves with a result; a failure is a value, never a rejected promise.
export type SecretResult<T> = { ok: true; value: T } | { ok: false; error: SecretError };

export interface SecretStore {
  getSecret(key: string): Promise<SecretResult<string | null>>;
  setSecret(key: string, value: string): Promise<SecretResult<null>>;
  deleteSecret(key: string): Promise<SecretResult<null>>;
}

// Rules of the contract (the same for the native implementation and every test double):
// - a key is 1 or more of: letters A–Z a–z, digits, ".", "-", "_"; any other key gives "invalid-key";
// - a value longer than 2048 characters gives "too-large" and the old value stays (the lab's cautious limit:
//   Expo warns that large values may be rejected; some iOS versions refused more than about 2048 bytes);
// - a store that is not available gives "unavailable" for every call;
// - a key that was never set gives { ok: true, value: null }.
export const MAX_SECRET_LENGTH = 2048;

// The records storage of RN-05 stays a different contract with different keys.
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
