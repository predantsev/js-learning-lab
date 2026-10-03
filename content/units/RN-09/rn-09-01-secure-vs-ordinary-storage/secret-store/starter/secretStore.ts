// secretStore.ts: an in-memory test double of the SecretStore contract.
import { MAX_SECRET_LENGTH, type SecretResult, type SecretStore } from './contracts.ts';

export function createMemorySecretStore({ available = true }: { available?: boolean } = {}): SecretStore {
  return {
    async getSecret(key): Promise<SecretResult<string | null>> {
      return { ok: true, value: null }; // TODO
    },
    async setSecret(key, value): Promise<SecretResult<null>> {
      return { ok: true, value: null }; // TODO
    },
    async deleteSecret(key): Promise<SecretResult<null>> {
      return { ok: true, value: null }; // TODO
    },
  };
}
