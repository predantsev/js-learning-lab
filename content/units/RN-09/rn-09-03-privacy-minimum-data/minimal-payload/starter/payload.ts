// payload.ts: what the backup feature sends to the mock service, and why each field is there.
import type { CapturedExpense } from './captured.ts';

export interface BackupPayload {
  // TODO: only the fields the backup needs
}

export function toBackupPayload(expense: CapturedExpense): BackupPayload {
  return { ...expense }; // TODO: sends everything the form holds
}

// One entry per payload field: why the backup needs it, and how long the server keeps it.
export const FIELD_NOTES: Record<string, { purpose: string; retention: string }> = {
  // TODO
};
