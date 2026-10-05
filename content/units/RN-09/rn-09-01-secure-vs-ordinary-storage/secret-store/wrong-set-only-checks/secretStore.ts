// secretStore.ts: only setSecret checks the store and the key; get and delete answer "ok" to anything,
// and the length limit is forgotten.
import { type SecretResult, type SecretStore } from './contracts.ts';

export function createMemorySecretStore({ available = true }: { available?: boolean } = {}): SecretStore {
  const secrets = new Map<string, string>();
  return {
    async getSecret(key): Promise<SecretResult<string | null>> {
      return { ok: true, value: secrets.has(key) ? secrets.get(key)! : null };
    },
    async setSecret(key, value): Promise<SecretResult<null>> {
      if (!available) return { ok: false, error: 'unavailable' };
      if (!/^[A-Za-z0-9._-]+$/.test(key)) return { ok: false, error: 'invalid-key' };
      secrets.set(key, value);
      return { ok: true, value: null };
    },
    async deleteSecret(key): Promise<SecretResult<null>> {
      secrets.delete(key);
      return { ok: true, value: null };
    },
  };
}
