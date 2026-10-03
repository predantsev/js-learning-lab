// lab.ts: the same lab with a session class, destructuring and one route pattern.
import type { SecretStore } from './secretDouble.ts';

export type Session = {
  signIn(token: string): Promise<'signed-in' | 'storage-failed'>;
  authHeader(): Promise<string | null>;
  signOut(): Promise<void>;
};

class SecretBackedSession implements Session {
  static KEY = 'session.token';
  #secrets: SecretStore;
  constructor(secrets: SecretStore) {
    this.#secrets = secrets;
  }
  async signIn(token: string) {
    const { ok } = await this.#secrets.setSecret(SecretBackedSession.KEY, token);
    return ok ? ('signed-in' as const) : ('storage-failed' as const);
  }
  async authHeader() {
    const result = await this.#secrets.getSecret(SecretBackedSession.KEY);
    if (!result.ok || !result.value) return null;
    return `Bearer ${result.value}`;
  }
  async signOut() {
    await this.#secrets.deleteSecret(SecretBackedSession.KEY);
  }
}

export function createSession(secrets: SecretStore): Session {
  return new SecretBackedSession(secrets);
}

export type CapturedNote = {
  id: string;
  text: string;
  createdAt: string;
  photo: { id: string; uri: string; exif: Record<string, string | number> } | null;
  deviceName: string;
  draftHistory: string[];
};

export function toUploadPayload({ id, text, createdAt, photo }: CapturedNote) {
  const [createdOn] = createdAt.split('T');
  return { id, text, createdOn, photo: photo ? { id: photo.id } : null };
}

export type NoteLinkResult =
  | { ok: true; route: { screen: 'note'; id: string } }
  | { ok: false; reason: 'malformed-url' | 'unknown-origin' | 'credential-param' | 'unknown-route' | 'invalid-id' };

const looksLikeCredential = (name: string) => /token|password|secret|session|key|code/i.test(name);

export function parseNoteLink(url: string): NoteLinkResult {
  if (!URL.canParse(url)) return { ok: false, reason: 'malformed-url' };
  const link = new URL(url);
  const path =
    link.protocol === 'jsll-notes:' ? `/${link.host}${link.pathname}` : link.origin === 'https://notes.jsll.example' ? link.pathname : null;
  if (path === null) return { ok: false, reason: 'unknown-origin' };
  if ([...link.searchParams.keys()].some(looksLikeCredential)) return { ok: false, reason: 'credential-param' };
  const match = /^\/notes\/([^/]+)$/.exec(path);
  if (!match) return { ok: false, reason: 'unknown-route' };
  try {
    const id = decodeURIComponent(match[1]);
    return /^n-\d{3}$/.test(id) ? { ok: true, route: { screen: 'note', id } } : { ok: false, reason: 'invalid-id' };
  } catch {
    return { ok: false, reason: 'invalid-id' };
  }
}
