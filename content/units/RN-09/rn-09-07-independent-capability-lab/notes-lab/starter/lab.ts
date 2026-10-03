// lab.ts: the notes-with-photo lab. Implement every export.
import type { SecretStore } from './secretDouble.ts';

export type Session = {
  signIn(token: string): Promise<'signed-in' | 'storage-failed'>;
  authHeader(): Promise<string | null>;
  signOut(): Promise<void>;
};

export function createSession(secrets: SecretStore): Session {
  return {
    async signIn(token) {
      return 'storage-failed';
    },
    async authHeader() {
      return null;
    },
    async signOut() {},
  };
}

export type CapturedNote = {
  id: string;
  text: string;
  createdAt: string; // 'YYYY-MM-DDTHH:mm:ss', local time of the phone
  photo: { id: string; uri: string; exif: Record<string, string | number> } | null;
  deviceName: string;
  draftHistory: string[];
};

export function toUploadPayload(note: CapturedNote) {
  return {};
}

export type NoteLinkResult =
  | { ok: true; route: { screen: 'note'; id: string } }
  | { ok: false; reason: 'malformed-url' | 'unknown-origin' | 'credential-param' | 'unknown-route' | 'invalid-id' };

export function parseNoteLink(url: string): NoteLinkResult {
  return { ok: false, reason: 'unknown-route' };
}
