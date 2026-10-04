// Opens an expense file as an EventEmitter (read-only).
// Events: 'record' (one expense object), then 'end'; or 'error' if the file cannot be read or parsed.
// Every source opened is also kept in openedSources, so the checks can look at its listeners.
import { EventEmitter } from 'node:events';
import { readFile } from 'node:fs';

export const openedSources = [];

export function openExpenses(file) {
  const source = new EventEmitter();
  openedSources.push(source);
  readFile(file, 'utf8', (error, text) => {
    if (error) {
      source.emit('error', error);
      return;
    }
    let expenses;
    try {
      expenses = JSON.parse(text);
    } catch (parseError) {
      source.emit('error', parseError);
      return;
    }
    for (const expense of expenses) source.emit('record', expense);
    source.emit('end');
  });
  return source;
}
