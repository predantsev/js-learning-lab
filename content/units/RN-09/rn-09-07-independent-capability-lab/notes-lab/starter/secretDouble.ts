// secretDouble.ts: an in-memory SecretStore (the contract from lesson 1) with switchable failures. Do not edit.
export type SecretResult<T> = { ok: true; value: T } | { ok: false; error: 'invalid-key' | 'too-large' | 'unavailable' | 'read-failed' };

export interface SecretStore {
  getSecret(key: string): Promise<SecretResult<string | null>>;
  setSecret(key: string, value: string): Promise<SecretResult<null>>;
  deleteSecret(key: string): Promise<SecretResult<null>>;
}

// available: false — every call fails with "unavailable"; failReads: true — getSecret fails with "read-failed".
export function createSecretDouble({ available = true, failReads = false } = {}): SecretStore & { peek(key: string): string | null } {
  const values = new Map<string, string>();
  const keyOk = (key: string) => /^[A-Za-z0-9._-]+$/.test(key);
  return {
    async getSecret(key) {
      if (!available) return { ok: false, error: 'unavailable' };
      if (!keyOk(key)) return { ok: false, error: 'invalid-key' };
      if (failReads) return { ok: false, error: 'read-failed' };
      return { ok: true, value: values.has(key) ? values.get(key)! : null };
    },
    async setSecret(key, value) {
      if (!available) return { ok: false, error: 'unavailable' };
      if (!keyOk(key)) return { ok: false, error: 'invalid-key' };
      if (value.length > 2048) return { ok: false, error: 'too-large' };
      values.set(key, value);
      return { ok: true, value: null };
    },
    async deleteSecret(key) {
      if (!available) return { ok: false, error: 'unavailable' };
      if (!keyOk(key)) return { ok: false, error: 'invalid-key' };
      values.delete(key);
      return { ok: true, value: null };
    },
    // For checks only: what the store holds under a key.
    peek: (key) => (values.has(key) ? values.get(key)! : null),
  };
}
