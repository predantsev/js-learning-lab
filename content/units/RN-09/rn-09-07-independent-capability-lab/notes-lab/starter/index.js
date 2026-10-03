// index.js: a short run of the lab. Do not edit.
import { config } from './config.ts';
import { createSession, parseNoteLink, toUploadPayload } from './lab.ts';
import { createSecretDouble } from './secretDouble.ts';

try {
  const session = createSession(createSecretDouble());
  console.log('sign in:', await session.signIn('tok_demo_31aa'));
  console.log('header present:', (await session.authHeader()) !== null);
  console.log('broken store header:', await createSession(createSecretDouble({ failReads: true })).authHeader());

  const note = {
    id: 'n-004',
    text: '%%noteText%%',
    createdAt: '2026-03-02T07:41:09',
    photo: { id: 'p-004', uri: 'file:///data/lab/photos/p-004.jpg', exif: { GPSLatitude: 46.4825, GPSLongitude: 30.7233, Model: 'LP-7' } },
    deviceName: 'LabPhone LP-7',
    draftHistory: ['%%draftText%%'],
  };
  console.log('upload:', JSON.stringify(toUploadPayload(note)));

  for (const url of ['jsll-notes://notes/n-004', 'jsll-notes://notes/n-004?token=tok_x']) {
    console.log(url, '→', JSON.stringify(parseNoteLink(url)));
  }
  console.log('config keys:', Object.keys(config).join(', '));
} catch (error) {
  console.log('demo stopped:', error.message);
}
