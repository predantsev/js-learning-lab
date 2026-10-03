// lab.ts: the lab code is right, but the secret only got a new name in config.ts.
import type { SecretStore } from './secretDouble.ts';

const TOKEN_KEY = 'session.token';

export type Session = {
  signIn(token: string): Promise<'signed-in' | 'storage-failed'>;
  authHeader(): Promise<string | null>;
  signOut(): Promise<void>;
};

// The token has exactly one home: the secret store. The session keeps no copy of its own.
export function createSession(secrets: SecretStore): Session {
  return {
    async signIn(token) {
      const saved = await secrets.setSecret(TOKEN_KEY, token);
      return saved.ok ? 'signed-in' : 'storage-failed';
    },
    async authHeader() {
      const read = await secrets.getSecret(TOKEN_KEY);
      return read.ok && read.value !== null ? `Bearer ${read.value}` : null;
    },
    async signOut() {
      await secrets.deleteSecret(TOKEN_KEY);
    },
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
  return {
    id: note.id,
    text: note.text,
    createdOn: note.createdAt.slice(0, 10),
    photo: note.photo === null ? null : { id: note.photo.id },
  };
}

export type NoteLinkResult =
  | { ok: true; route: { screen: 'note'; id: string } }
  | { ok: false; reason: 'malformed-url' | 'unknown-origin' | 'credential-param' | 'unknown-route' | 'invalid-id' };

const CREDENTIAL_WORDS = ['token', 'password', 'secret', 'session', 'key', 'code'];

export function parseNoteLink(url: string): NoteLinkResult {
  let link: URL;
  try {
    link = new URL(url);
  } catch {
    return { ok: false, reason: 'malformed-url' };
  }

  let segments: string[];
  if (link.protocol === 'jsll-notes:') segments = [link.host, ...link.pathname.split('/').slice(1)];
  else if (link.origin === 'https://notes.jsll.example') segments = link.pathname.split('/').slice(1);
  else return { ok: false, reason: 'unknown-origin' };

  for (const name of link.searchParams.keys()) {
    const lower = name.toLowerCase();
    if (CREDENTIAL_WORDS.some((word) => lower.includes(word))) return { ok: false, reason: 'credential-param' };
  }

  if (segments.length !== 2 || segments[0] !== 'notes') return { ok: false, reason: 'unknown-route' };

  let id: string;
  try {
    id = decodeURIComponent(segments[1]);
  } catch {
    return { ok: false, reason: 'invalid-id' };
  }
  if (!/^n-\d{3}$/.test(id)) return { ok: false, reason: 'invalid-id' };
  return { ok: true, route: { screen: 'note', id } };
}
