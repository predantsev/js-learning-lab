import { config } from './config.ts';
import { createSession, parseNoteLink, toUploadPayload } from './lab.ts';
import { createSecretDouble } from './secretDouble.ts';

const TOKEN = 'tok_check_5e7d';
const guardSession = () => expect(typeof createSession, 'type of createSession').toBe('function');

const note = () => ({
  id: 'n-012',
  text: L.noteText,
  createdAt: '2026-03-03T21:15:40',
  photo: { id: 'p-012', uri: 'file:///data/lab/photos/p-012.jpg', exif: { GPSLatitude: 48.9226, GPSLongitude: 24.7111, Model: 'LP-7' } },
  deviceName: 'LabPhone LP-7',
  draftHistory: [L.draftText],
});

const link = (url) => {
  try {
    return parseNoteLink(url);
  } catch (error) {
    return { threw: error?.name ?? String(error) };
  }
};

test('sign-in keeps the token in the secret store and builds the header from it', async () => {
  guardSession();
  const store = createSecretDouble();
  const session = createSession(store);
  expect(await session.signIn(TOKEN), 'signIn result').toBe('signed-in');
  expect(store.peek('session.token'), 'the secret store under session.token').toBe(TOKEN);
  expect(await session.authHeader(), 'authHeader()').toBe(`Bearer ${TOKEN}`);
  expect(await createSession(store).authHeader(), 'authHeader() of a second session on the same store').toBe(`Bearer ${TOKEN}`);
});

test('the session keeps no copy of the token outside the store', async () => {
  guardSession();
  storage.clear();
  const store = createSecretDouble();
  const session = createSession(store);
  await session.signIn(TOKEN);
  await store.deleteSecret('session.token');
  expect(await session.authHeader(), 'authHeader() after the store lost the token').toBeNull();
  expect(storage.length, 'keys in localStorage').toBe(0);
  expect(logs().some((line) => line.includes(TOKEN)), 'a console line contains the token').toBe(false);
});

test('a failed read means signed out, not a crash', async () => {
  guardSession();
  const session = createSession(createSecretDouble({ failReads: true }));
  expect(await session.authHeader(), 'authHeader() when the read fails').toBeNull();
});

test('an unavailable store makes sign-in fail honestly', async () => {
  guardSession();
  const session = createSession(createSecretDouble({ available: false }));
  expect(await session.signIn(TOKEN), 'signIn result on an unavailable store').toBe('storage-failed');
  expect(await session.authHeader(), 'authHeader() on an unavailable store').toBeNull();
});

test('sign-out removes the token', async () => {
  guardSession();
  const store = createSecretDouble();
  const session = createSession(store);
  await session.signIn(TOKEN);
  await session.signOut();
  expect(store.peek('session.token'), 'the secret store after signOut').toBeNull();
  expect(await session.authHeader(), 'authHeader() after signOut').toBeNull();
});

test('the upload payload holds only id, text, the day and a photo reference', () => {
  expect(typeof toUploadPayload, 'type of toUploadPayload').toBe('function');
  expect(toUploadPayload(note()), 'payload of a note with a photo').toEqual({ id: 'n-012', text: L.noteText, createdOn: '2026-03-03', photo: { id: 'p-012' } });
  expect(toUploadPayload({ ...note(), photo: null }), 'payload of a note without a photo').toEqual({ id: 'n-012', text: L.noteText, createdOn: '2026-03-03', photo: null });
  const input = note();
  toUploadPayload(input);
  expect(input, 'the note after toUploadPayload').toEqual(note());
});

test('note links become routes on both link forms', () => {
  expect(typeof parseNoteLink, 'type of parseNoteLink').toBe('function');
  expect(link('jsll-notes://notes/n-012'), 'jsll-notes://notes/n-012').toEqual({ ok: true, route: { screen: 'note', id: 'n-012' } });
  expect(link('https://notes.jsll.example/notes/n-007?ref=mail'), 'https://notes.jsll.example/notes/n-007?ref=mail').toEqual({ ok: true, route: { screen: 'note', id: 'n-007' } });
});

test('unsafe or broken note links are refused with their reason', () => {
  expect(typeof parseNoteLink, 'type of parseNoteLink').toBe('function');
  const cases = [
    ['jsll-notes://notes/n-012?access_token=tok_x', 'credential-param'],
    ['https://notes.jsll.example/notes/n-012?SessionKey=1', 'credential-param'],
    ['https://notes.jsll.example.attacker.example/notes/n-012', 'unknown-origin'],
    ['jsll-lab://notes/n-012', 'unknown-origin'],
    ['jsll-notes://settings/n-012', 'unknown-route'],
    ['jsll-notes://notes/n-012/share', 'unknown-route'],
    ['jsll-notes://notes/n-12', 'invalid-id'],
    ['jsll-notes://notes/%E0%A4%A', 'invalid-id'],
    ['notes/n-012', 'malformed-url'],
    ['jsll-notes://notes/n-12?token=tok_x', 'credential-param'],
    ['https://attacker.example/notes/n-012?token=tok_x', 'unknown-origin'],
  ];
  for (const [url, reason] of cases) expect(link(url), url).toEqual({ ok: false, reason });
});

test('the shipped config holds no secret', () => {
  const text = JSON.stringify(config ?? {});
  expect(/sk_/.test(text), 'the config contains a value starting with sk_').toBe(false);
  expect(Object.keys(config ?? {}).some((name) => /secret/i.test(name)), 'the config has a key named like a secret').toBe(false);
  expect(config?.EXPO_PUBLIC_NOTES_API, 'EXPO_PUBLIC_NOTES_API').toBe('https://notes.jsll.example/api');
  expect(config?.EXPO_PUBLIC_CLIENT_ID, 'EXPO_PUBLIC_CLIENT_ID').toBe('jsll-notes-lab');
});
