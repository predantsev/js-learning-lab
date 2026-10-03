// payload.ts: keeps the exact saving time "in case we need it later".
import type { CapturedExpense } from './captured.ts';

export interface BackupPayload {
  id: string;
  label: string;
  amountMinor: number;
  date: string;
  category: string;
  receipt: { id: string } | null;
}

export function toBackupPayload(expense: CapturedExpense): BackupPayload {
  return {
    id: expense.id,
    label: expense.label,
    amountMinor: expense.amountMinor,
    date: expense.date,
    category: expense.category,
    savedAt: expense.savedAt,
    receipt: expense.receipt === null ? null : { id: expense.receipt.id },
  };
}

// One entry per payload field: why the backup needs it, and how long the server keeps it.
export const FIELD_NOTES: Record<string, { purpose: string; retention: string }> = {
  id: { purpose: 'Matches the backup to the record on the phone.', retention: 'Until the person deletes the expense.' },
  label: { purpose: 'Shows the expense when it is restored.', retention: 'Until the person deletes the expense.' },
  amountMinor: { purpose: 'The amount itself, needed for the totals.', retention: 'Until the person deletes the expense.' },
  date: { purpose: 'Places the expense on its day in the totals.', retention: 'Until the person deletes the expense.' },
  category: { purpose: 'Needed for the per-category totals.', retention: 'Until the person deletes the expense.' },
  receipt: { purpose: 'Links the separately uploaded, stripped photo.', retention: 'Until the person deletes the expense or the photo.' },
};
