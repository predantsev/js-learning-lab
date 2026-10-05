import { FIELD_NOTES, toBackupPayload } from './payload.ts';

// Fresh copies of the captured.ts data for every check: the demo in index.js may already have changed the module's objects.
const withReceipt = {
  id: 'e-08', label: L.lunch, amountMinor: 21050, date: '2026-03-02', category: 'food',
  receipt: {
    id: 'r-08',
    uri: 'file:///data/lab/receipts/r-08.jpg',
    exif: { GPSLatitude: 49.8397, GPSLongitude: 24.0297, Make: 'LabPhone', Model: 'LP-7', DateTimeOriginal: '2026:03:02 13:41:07' },
  },
  deviceName: 'LabPhone LP-7',
  savedAt: '2026-03-02T13:42:55',
};
const withoutReceipt = {
  id: 'e-09', label: L.transit, amountMinor: 52000, date: '2026-03-01', category: 'transport',
  receipt: null, deviceName: 'LabPhone LP-7', savedAt: '2026-03-01T08:05:12',
};

const FIELDS = ['amountMinor', 'category', 'date', 'id', 'label', 'receipt'];
const copy = (value) => JSON.parse(JSON.stringify(value));

test('the payload has exactly the fields the backup needs', () => {
  expect(typeof toBackupPayload, 'type of toBackupPayload').toBe('function');
  expect(Object.keys(toBackupPayload(copy(withReceipt))).sort(), 'fields of the payload').toEqual(FIELDS);
  expect(Object.keys(toBackupPayload(copy(withoutReceipt))).sort(), 'fields of the payload without a receipt').toEqual(FIELDS);
});

test('the record fields are copied unchanged', () => {
  expect(typeof toBackupPayload, 'type of toBackupPayload').toBe('function');
  const payload = toBackupPayload(copy(withReceipt));
  for (const field of ['id', 'label', 'amountMinor', 'date', 'category']) {
    expect(payload[field], `payload.${field}`).toBe(withReceipt[field]);
  }
});

test('the receipt becomes a bare reference, or null without a receipt', () => {
  expect(typeof toBackupPayload, 'type of toBackupPayload').toBe('function');
  expect(toBackupPayload(copy(withReceipt)).receipt, 'payload.receipt with a receipt').toEqual({ id: 'r-08' });
  expect(toBackupPayload(copy(withoutReceipt)).receipt, 'payload.receipt without a receipt').toBeNull();
});

test('no location, camera, device or time of day anywhere in the payload', () => {
  expect(typeof toBackupPayload, 'type of toBackupPayload').toBe('function');
  const text = JSON.stringify(toBackupPayload(copy(withReceipt)));
  for (const leak of ['49.8397', '24.0297', 'LabPhone', 'LP-7', '13:41', '13:42', 'file:///']) {
    expect(text.includes(leak), `the payload text contains "${leak}"`).toBe(false);
  }
});

test('the captured expense itself is not changed', () => {
  expect(typeof toBackupPayload, 'type of toBackupPayload').toBe('function');
  const input = copy(withReceipt);
  toBackupPayload(input);
  expect(input, 'the expense after toBackupPayload').toEqual(copy(withReceipt));
});

test('every payload field has a purpose and a retention', () => {
  expect(Object.keys(FIELD_NOTES ?? {}).sort(), 'fields in FIELD_NOTES').toEqual(FIELDS);
  for (const field of FIELDS) {
    const note = FIELD_NOTES?.[field];
    expect(typeof note?.purpose === 'string' && note.purpose.trim().length >= 10, `FIELD_NOTES.${field}.purpose has at least 10 characters`).toBe(true);
    expect(typeof note?.retention === 'string' && note.retention.trim().length >= 10, `FIELD_NOTES.${field}.retention has at least 10 characters`).toBe(true);
  }
});
