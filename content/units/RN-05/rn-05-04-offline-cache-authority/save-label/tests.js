import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { deriveSaveLabel } from './saveLabel.js';
import { ExpenseRow } from './ExpenseRow.jsx';

const expense = (save, extra = {}) => ({ id: 'e-06', label: L.lunch, amountMinor: 21050, date: '2026-03-02', category: 'food', save, ...extra });
const noServer = [{ serverConfigured: false, online: true }, { serverConfigured: false, online: false }];
const withServer = [{ serverConfigured: true, online: true }, { serverConfigured: true, online: false }];
const fn = () => expect(typeof deriveSaveLabel, 'type of deriveSaveLabel').toBe('function');
const show = (context) => JSON.stringify(context);

test('without a server a saved record is saved on this device, online or not', () => {
  fn();
  for (const context of noServer) {
    expect(deriveSaveLabel(expense('saved'), context), `saved record, ${show(context)}`).toBe('saved-on-device');
  }
});

test('without a server an uploaded flag never makes a record synced', () => {
  fn();
  for (const context of noServer) {
    expect(deriveSaveLabel(expense('saved', { uploaded: true }), context), `saved record with uploaded: true, ${show(context)}`).toBe('saved-on-device');
  }
});

test('a write in progress is saving and a failed write is not saved', () => {
  fn();
  for (const context of [...noServer, ...withServer]) {
    expect(deriveSaveLabel(expense('saving'), context), `save: 'saving', ${show(context)}`).toBe('saving');
    expect(deriveSaveLabel(expense('failed', { uploaded: true }), context), `save: 'failed', ${show(context)}`).toBe('not-saved');
  }
});

test('with a server only a confirmed upload is synced', () => {
  fn();
  for (const context of withServer) {
    expect(deriveSaveLabel(expense('saved', { uploaded: true }), context), `uploaded record, ${show(context)}`).toBe('synced');
    expect(deriveSaveLabel(expense('saved'), context), `record not uploaded yet, ${show(context)}`).toBe('pending-upload');
  }
});

test('the row shows saved on this device, not synced, while online without a server', () => {
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  const labels = { saving: L.saving, 'saved-on-device': L.savedOnDevice, 'not-saved': L.notSaved, 'pending-upload': L.pendingUpload, synced: L.synced };
  flushSync(() => root.render(createElement(ExpenseRow, { expense: expense('saved', { uploaded: true }), context: noServer[0], labels })));
  const text = box.querySelector('[data-testid="save-label"]')?.textContent;
  root.unmount();
  box.remove();
  expect(text, 'the row label').toBe(L.savedOnDevice);
});
