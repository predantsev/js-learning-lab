// payload.ts: the same payload built by naming what to leave out, without touching the input.
import type { CapturedExpense } from './captured.ts';

export type BackupPayload = Omit<CapturedExpense, 'receipt' | 'deviceName' | 'savedAt'> & { receipt: { id: string } | null };

export function toBackupPayload({ receipt, deviceName, savedAt, ...record }: CapturedExpense): BackupPayload {
  return { ...record, receipt: receipt ? { id: receipt.id } : null };
}

const untilDeleted = 'Kept until the person deletes the expense.';
export const FIELD_NOTES: Record<string, { purpose: string; retention: string }> = {
  id: { purpose: 'Identifies the record across phone and backup.', retention: untilDeleted },
  label: { purpose: 'The text the person sees after a restore.', retention: untilDeleted },
  amountMinor: { purpose: 'The amount, used by every total.', retention: untilDeleted },
  date: { purpose: 'The calendar day of the expense, used by totals.', retention: untilDeleted },
  category: { purpose: 'Used by the per-category totals.', retention: untilDeleted },
  receipt: { purpose: 'Reference to the stripped receipt photo.', retention: untilDeleted },
};
