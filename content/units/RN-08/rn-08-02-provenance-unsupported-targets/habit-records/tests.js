import { build, declaredTarget, iosSimulator } from './build.js';
import { judge } from './evidence.js';
import { iosSkip, lifecycleRecord } from './records.js';

const verdict = (record) => judge(record, { declaredTarget, build });

test('the lifecycle record is accepted as passed', () => {
  expect(verdict(lifecycleRecord), 'judge(lifecycleRecord)').toEqual({ status: 'passed' });
});

test('the lifecycle record names the lifecycle check', () => {
  expect(lifecycleRecord?.check, 'lifecycleRecord.check').toBe('lifecycle');
});

test('the iOS record is accepted as a skip', () => {
  expect(verdict(iosSkip), 'judge(iosSkip)').toEqual({ status: 'skipped' });
});

test('the iOS record is about the offline check on the iOS simulator', () => {
  expect(iosSkip?.check, 'iosSkip.check').toBe('offline');
  expect(iosSkip?.target, 'iosSkip.target').toEqual(iosSimulator);
});
