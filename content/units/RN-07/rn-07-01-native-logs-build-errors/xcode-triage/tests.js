import { triage } from './triage.js';

const text = (value) => (typeof value === 'string' ? value.trim() : '');

test('the first error line names the cause', () => {
  const line = text(triage?.firstErrorLine);
  expect(line.includes('expenseTotals.ts') && line.includes('Unexpected token'), `firstErrorLine is "${line}"`).toBe(true);
});

test('the file is the one that line names, with its line number', () => {
  const file = text(triage?.file);
  expect(file.includes('expenseTotals.ts'), `file is "${file}"`).toBe(true);
  expect(/\b13\b/.test(file), `file "${file}" has the line number 13`).toBe(true);
});

test('the error is classified as a code error', () => {
  expect(text(triage?.kind), 'kind').toBe('code');
});

test('the next command checks the code without a whole Xcode build', () => {
  const command = text(triage?.nextCommand);
  const ok = /expo export/.test(command) || /\btsc\b/.test(command);
  expect(ok, `nextCommand is "${command}"`).toBe(true);
});
