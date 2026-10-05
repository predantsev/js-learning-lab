// SUPPLIED (read-only): the data-flow diagram of the expense tracker's Backup feature from the RN-09 lab
// (an expense with a receipt photo), after its minimum-data pass, plus the crash-reporting library the
// release adds. Written as a table, one row per piece of data.
// destination: 'removed' — dropped at capture; 'device' — stays on the phone;
//              'mock-service' — sent to the lab's own service; 'crash-library' — sent by a third-party
//              crash-reporting library to its own servers.
export const dataFlow = [
  { field: 'expenseRecord', destination: 'mock-service', purpose: 'app-functionality', note: 'label, amountMinor, date and category, backed up so they can be restored on another phone' },
  { field: 'receiptPhoto', destination: 'mock-service', purpose: 'app-functionality', note: 'uploaded separately, already without metadata' },
  { field: 'photoLocation', destination: 'removed', purpose: null, note: 'EXIF coordinates stripped before the first copy' },
  { field: 'themePreference', destination: 'device', purpose: null, note: 'light or dark, kept in on-device storage' },
  { field: 'crashReport', destination: 'crash-library', purpose: 'analytics', note: 'stack trace and device model after a crash' },
];

export const PURPOSES = ['app-functionality', 'analytics', 'personalization', 'advertising'];
