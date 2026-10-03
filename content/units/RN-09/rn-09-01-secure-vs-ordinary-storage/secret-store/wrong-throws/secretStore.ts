// secretStore.ts: refuses bad input by throwing — the caller now needs try/catch around every call,
// and a rejected promise that nobody awaits crashes the screen instead of showing a message.
import { MAX_SECRET_LENGTH, type SecretResult, type SecretStore } from './contracts.ts';

export function createMemorySecretStore({ available = true }: { available?: boolean } = {}): SecretStore {
  const secrets = new Map<string, string>();
  function check(key: string) {
    if (!available) throw new Error('unavailable');
    if (!/^[A-Za-z0-9._-]+$/.test(key)) throw new Error('invalid-key');
  }
  return {
    async getSecret(key): Promise<SecretResult<string | null>> {
      check(key);
      return { ok: true, value: secrets.has(key) ? secrets.get(key)! : null };
    },
    async setSecret(key, value): Promise<SecretResult<null>> {
      check(key);
      if (value.length > MAX_SECRET_LENGTH) throw new Error('too-large');
      secrets.set(key, value);
      return { ok: true, value: null };
    },
    async deleteSecret(key): Promise<SecretResult<null>> {
      check(key);
      secrets.delete(key);
      return { ok: true, value: null };
    },
  };
}
