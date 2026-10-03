// deriveSaveLabel(record, context) → which save state a record row shows.
//
// record.save:      'saving' | 'saved' | 'failed'  — the last write to the device store
// record.uploaded:  true when a server confirmed it has this version (only possible with a server)
// context:          { serverConfigured: boolean, online: boolean }
//
// Returns one of: 'saving' | 'saved-on-device' | 'not-saved' | 'pending-upload' | 'synced'
export function deriveSaveLabel(record, context) {
  // TODO
  return 'saving';
}
