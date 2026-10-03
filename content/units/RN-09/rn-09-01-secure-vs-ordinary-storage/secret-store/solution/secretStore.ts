// secretStore.ts: an in-memory test double of the SecretStore contract.
import { MAX_SECRET_LENGTH, type SecretResult, type SecretStore } from './contracts.ts';

const KEY_PATTERN = /^[A-Za-z0-9._-]+$/;

export function createMemorySecretStore({ available = true }: { available?: boolean } = {}): SecretStore {
  const secrets = new Map<string, string>();

  // The checks every method shares: an unavailable store first, then the key.
  function refuse(key: string): SecretResult<never> | null {
    if (!available) return { ok: false, error: 'unavailable' };
    if (typeof key !== 'string' || !KEY_PATTERN.test(key)) return { ok: false, error: 'invalid-key' };
    return null;
  }

  return {
    async getSecret(key): Promise<SecretResult<string | null>> {
      const refused = refuse(key);
      if (refused) return refused;
      return { ok: true, value: secrets.has(key) ? secrets.get(key)! : null };
    },
    async setSecret(key, value): Promise<SecretResult<null>> {
      const refused = refuse(key);
      if (refused) return refused;
      if (value.length > MAX_SECRET_LENGTH) return { ok: false, error: 'too-large' };
      secrets.set(key, value);
      return { ok: true, value: null };
    },
    async deleteSecret(key): Promise<SecretResult<null>> {
      const refused = refuse(key);
      if (refused) return refused;
      secrets.delete(key);
      return { ok: true, value: null };
    },
  };
}
