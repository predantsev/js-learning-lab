// deriveSaveLabel(record, context) → which save state a record row shows.
//
// record.save:      'saving' | 'saved' | 'failed'  — the last write to the device store
// record.uploaded:  true when a server confirmed it has this version (only possible with a server)
// context:          { serverConfigured: boolean, online: boolean }
//
// Returns one of: 'saving' | 'saved-on-device' | 'not-saved' | 'pending-upload' | 'synced'
// Mistake: promises an upload while offline even though there is no server to upload to.
export function deriveSaveLabel(record, context) {
  if (record.save === 'saving') return 'saving';
  if (record.save === 'failed') return 'not-saved';
  if (!context.online) return 'pending-upload';
  if (!context.serverConfigured) return 'saved-on-device';
  return record.uploaded === true ? 'synced' : 'pending-upload';
}
