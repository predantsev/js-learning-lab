// Another approach: a switch over the device save first, then the server part.
export function deriveSaveLabel(record, { serverConfigured }) {
  switch (record.save) {
    case 'saving':
      return 'saving';
    case 'failed':
      return 'not-saved';
    default:
      break;
  }
  if (serverConfigured && record.uploaded) return 'synced';
  if (serverConfigured) return 'pending-upload';
  return 'saved-on-device';
}
