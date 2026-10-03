// deriveSaveLabel(record, context) → which save state a record row shows.
//
// record.save:      'saving' | 'saved' | 'failed'  — the last write to the device store
// record.uploaded:  true when a server confirmed it has this version (only possible with a server)
// context:          { serverConfigured: boolean, online: boolean }
//
// Returns one of: 'saving' | 'saved-on-device' | 'not-saved' | 'pending-upload' | 'synced'
// Mistake: a successful save while online is shown as synced.
export function deriveSaveLabel(record, context) {
  if (record.save === 'saving') return 'saving';
  if (record.save === 'failed') return 'not-saved';
  return context.online ? 'synced' : 'saved-on-device';
}
