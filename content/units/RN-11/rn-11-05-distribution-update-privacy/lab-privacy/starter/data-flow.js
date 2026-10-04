// SUPPLIED (read-only): the data-flow diagram of the synthetic "note with photo" lab app from RN-09,
// after its minimum-data pass, written as a table. One row per piece of data.
// destination: 'removed' — dropped at capture; 'device' — stays on the phone;
//              'mock-service' — sent to the lab's own service; 'crash-library' — sent by a third-party
//              crash-reporting library to its own servers.
export const dataFlow = [
  { field: 'noteText', destination: 'mock-service', purpose: 'app-functionality', note: 'synced so the note is not lost' },
  { field: 'photo', destination: 'mock-service', purpose: 'app-functionality', note: 'synced with the note' },
  { field: 'photoLocation', destination: 'removed', purpose: null, note: 'location metadata stripped before saving' },
  { field: 'themePreference', destination: 'device', purpose: null, note: 'light or dark, kept in on-device storage' },
  { field: 'crashReport', destination: 'crash-library', purpose: 'analytics', note: 'stack trace and device model after a crash' },
];

export const PURPOSES = ['app-functionality', 'analytics', 'personalization', 'advertising'];
