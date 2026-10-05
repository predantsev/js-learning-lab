// deriveSaveLabel(record, context) → which save state a record row shows.
//
// record.save:      'saving' | 'saved' | 'failed'  — the last write to the device store
// record.uploaded:  true when a server confirmed it has this version (only possible with a server)
// context:          { serverConfigured: boolean, online: boolean }
//
// Returns one of: 'saving' | 'saved-on-device' | 'not-saved' | 'pending-upload' | 'synced'
// Mistake: trusts an `uploaded` flag even though no server is configured.
export function deriveSaveLabel(record, context) {
  if (record.save === 'saving') return 'saving';
  if (record.save === 'failed') return 'not-saved';
  if (record.uploaded) return 'synced';
  return context.serverConfigured ? 'pending-upload' : 'saved-on-device';
}
