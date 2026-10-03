// secretStore.ts: "secret" values go to the browser's localStorage — ordinary storage with a secure name.
import { MAX_SECRET_LENGTH, type SecretResult, type SecretStore } from './contracts.ts';

export function createMemorySecretStore({ available = true }: { available?: boolean } = {}): SecretStore {
  const prefix = `secret.${Math.random().toString(36).slice(2)}.`;
  function refuse(key: string): SecretResult<never> | null {
    if (!available) return { ok: false, error: 'unavailable' };
    if (!/^[A-Za-z0-9._-]+$/.test(key)) return { ok: false, error: 'invalid-key' };
    return null;
  }
  return {
    async getSecret(key): Promise<SecretResult<string | null>> {
      return refuse(key) ?? { ok: true, value: localStorage.getItem(prefix + key) };
    },
    async setSecret(key, value): Promise<SecretResult<null>> {
      const refused = refuse(key);
      if (refused) return refused;
      if (value.length > MAX_SECRET_LENGTH) return { ok: false, error: 'too-large' };
      localStorage.setItem(prefix + key, value);
      return { ok: true, value: null };
    },
    async deleteSecret(key): Promise<SecretResult<null>> {
      const refused = refuse(key);
      if (refused) return refused;
      localStorage.removeItem(prefix + key);
      return { ok: true, value: null };
    },
  };
}
