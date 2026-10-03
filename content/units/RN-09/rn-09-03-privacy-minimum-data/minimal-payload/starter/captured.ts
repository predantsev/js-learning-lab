// captured.ts: what the expense form holds when the person presses "Back up". Do not edit.
// The receipt photo is uploaded separately, after its metadata is stripped; the payload refers to it by id.
export interface CapturedExpense {
  id: string;
  label: string;
  amountMinor: number;
  date: string; // 'YYYY-MM-DD'
  category: string;
  receipt: {
    id: string;
    uri: string; // a file on this phone
    exif: { GPSLatitude: number; GPSLongitude: number; Make: string; Model: string; DateTimeOriginal: string };
  } | null;
  deviceName: string; // filled in by the form from the phone's settings
  savedAt: string; // the exact moment of saving, to the second
}

export const withReceipt: CapturedExpense = {
  id: 'e-08',
  label: '%%lunch%%',
  amountMinor: 21050,
  date: '2026-03-02',
  category: 'food',
  receipt: {
    id: 'r-08',
    uri: 'file:///data/lab/receipts/r-08.jpg',
    exif: { GPSLatitude: 49.8397, GPSLongitude: 24.0297, Make: 'LabPhone', Model: 'LP-7', DateTimeOriginal: '2026:03:02 13:41:07' },
  },
  deviceName: 'LabPhone LP-7',
  savedAt: '2026-03-02T13:42:55',
};

export const withoutReceipt: CapturedExpense = {
  id: 'e-09',
  label: '%%transit%%',
  amountMinor: 52000,
  date: '2026-03-01',
  category: 'transport',
  receipt: null,
  deviceName: 'LabPhone LP-7',
  savedAt: '2026-03-01T08:05:12',
};
