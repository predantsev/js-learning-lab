// captured.js: what the form holds after the person typed an expense and took a photo of the receipt.
// The photo's metadata (EXIF) came from the camera, not from the person. All values are synthetic.
export const captured = {
  id: 'e-07',
  label: '%%label%%',
  amountMinor: 12500,
  date: '2026-03-02',
  category: 'food',
  receipt: {
    id: 'r-07',
    uri: 'file:///data/lab/receipts/r-07.jpg',
    exif: { GPSLatitude: 50.4501, GPSLongitude: 30.5234, Make: 'LabPhone', Model: 'LP-7', DateTimeOriginal: '2026:03:02 13:41:07' },
  },
};

export const LOCATION_MARK = '50.4501';
