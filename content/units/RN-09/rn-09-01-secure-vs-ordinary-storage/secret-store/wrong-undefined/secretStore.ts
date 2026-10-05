// secretStore.ts: a missing key gives `undefined` from Map.get, not the `null` the contract promises.
import { MAX_SECRET_LENGTH, type SecretResult, type SecretStore } from './contracts.ts';

export function createMemorySecretStore({ available = true }: { available?: boolean } = {}): SecretStore {
  const secrets = new Map<string, string>();
  function refuse(key: string): SecretResult<never> | null {
    if (!available) return { ok: false, error: 'unavailable' };
    if (!/^[A-Za-z0-9._-]+$/.test(key)) return { ok: false, error: 'invalid-key' };
    return null;
  }
  return {
    async getSecret(key): Promise<SecretResult<string | null>> {
      return refuse(key) ?? { ok: true, value: secrets.get(key) as string };
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
