// index.js: prints what the backup would send. Do not edit.
import { withoutReceipt, withReceipt } from './captured.ts';
import { FIELD_NOTES, toBackupPayload } from './payload.ts';

try {
  console.log('with a receipt:', JSON.stringify(toBackupPayload(withReceipt)));
  console.log('without a receipt:', JSON.stringify(toBackupPayload(withoutReceipt)));
  console.log('field notes for:', Object.keys(FIELD_NOTES).join(', ') || '(none)');
} catch (error) {
  console.log('demo stopped:', error.message);
}
