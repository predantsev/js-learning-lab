// Expense records as the repository stores them (read-only). receiptPath and internalNote are for the
// server only; the page needs id, label, amountMinor, date and category.
export const expenses = [
  { id: 'e-01', label: '%%groceries%%', amountMinor: 84550, date: '2026-03-01', category: 'food', receiptPath: 'data/receipts/e-01.txt', internalNote: '%%note%%' },
  { id: 'e-07', label: '</script><script>alert(1)</script>', amountMinor: 1200, date: '2026-03-02', category: 'fun', receiptPath: 'data/receipts/e-07.txt', internalNote: '' },
];
