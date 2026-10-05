// secretStore.ts: the same contract as a class with a private object for the values.
import { MAX_SECRET_LENGTH, type SecretResult, type SecretStore } from './contracts.ts';

class MemorySecretStore implements SecretStore {
  #values: Record<string, string> = {};
  #available: boolean;

  constructor(available: boolean) {
    this.#available = available;
  }

  #check(key: string): SecretResult<never> | null {
    if (!this.#available) return { ok: false, error: 'unavailable' };
    if (!/^[\w.-]+$/.test(key)) return { ok: false, error: 'invalid-key' };
    return null;
  }

  async getSecret(key: string): Promise<SecretResult<string | null>> {
    return this.#check(key) ?? { ok: true, value: Object.hasOwn(this.#values, key) ? this.#values[key] : null };
  }

  async setSecret(key: string, value: string): Promise<SecretResult<null>> {
    const refused = this.#check(key);
    if (refused) return refused;
    if (value.length > MAX_SECRET_LENGTH) return { ok: false, error: 'too-large' };
    this.#values[key] = value;
    return { ok: true, value: null };
  }

  async deleteSecret(key: string): Promise<SecretResult<null>> {
    const refused = this.#check(key);
    if (refused) return refused;
    delete this.#values[key];
    return { ok: true, value: null };
  }
}

export function createMemorySecretStore({ available = true }: { available?: boolean } = {}): SecretStore {
  return new MemorySecretStore(available);
}
