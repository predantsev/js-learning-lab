import { build, declaredTarget, iosSimulator } from './build.js';
import { iosReaderSkip, readmeLabels, restartRecord, routes, spikeFirst, trace, whyNative } from './brief.js';
import { judge } from './evidence.js';

const verdict = (record) => judge(record, { declaredTarget, build });

test('the trace names the cheaper variant', () => {
  expect(trace?.cheaper, 'trace.cheaper').toBe('B');
});

test('the trace names how many times less boundary time it spends', () => {
  expect(trace?.times, 'trace.times').toBe(16);
});

test('the old-architecture README lines are labelled legacy', () => {
  for (const id of ['b', 'c', 'f']) expect(readmeLabels?.[id], `readmeLabels.${id}`).toBe('legacy');
});

test('the New Architecture README lines are labelled new', () => {
  for (const id of ['a', 'd', 'e']) expect(readmeLabels?.[id], `readmeLabels.${id}`).toBe('new');
});

test('each request gets the right route', () => {
  expect(routes?.monthTotal, 'routes.monthTotal').toBe('javascript');
  expect(routes?.shareSummary, 'routes.shareSummary').toBe('built-in');
  expect(routes?.scanReceipt, 'routes.scanReceipt').toBe('library');
});

test('a spike comes first only where native code is added', () => {
  expect(spikeFirst?.monthTotal, 'spikeFirst.monthTotal').toBe(false);
  expect(spikeFirst?.shareSummary, 'spikeFirst.shareSummary').toBe(false);
  expect(spikeFirst?.scanReceipt, 'spikeFirst.scanReceipt').toBe(true);
});

test('the restart record is accepted as passed', () => {
  expect(verdict(restartRecord), 'judge(restartRecord)').toEqual({ status: 'passed' });
  expect(restartRecord?.check, 'restartRecord.check').toBe('restart');
});

test('the iOS screen-reader record is accepted as a skip', () => {
  expect(verdict(iosReaderSkip), 'judge(iosReaderSkip)').toEqual({ status: 'skipped' });
  expect(iosReaderSkip?.check, 'iosReaderSkip.check').toBe('a11y');
  expect(iosReaderSkip?.target, 'iosReaderSkip.target').toEqual(iosSimulator);
});

test('the explanation of the native decision has at least 60 characters', () => {
  const text = typeof whyNative === 'string' ? whyNative.trim() : '';
  expect(text.length, 'length of whyNative').toBeGreaterThanOrEqual(60);
});
