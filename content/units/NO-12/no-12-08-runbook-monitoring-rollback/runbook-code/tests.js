import { alertFires, rollbackPlan } from './runbook.js';

const guard = () => {
  expect(typeof alertFires, 'type of alertFires').toBe('function');
  expect(typeof rollbackPlan, 'type of rollbackPlan').toBe('function');
};
const w = (requests, errors) => ({ requests, errors });
const current = { version: '1.4.0', sha256: 'aa11' };
const previous = { version: '1.3.0', sha256: 'bb22', supportsSchema: 1 };
const backup = { file: 'backups/habits-before-1.4.0.json', schemaVersion: 1 };

test('the alert fires on the second bad window in a row', () => {
  guard();
  expect(alertFires([w(40, 0), w(40, 6), w(40, 6), w(40, 6)]), 'index for ok, bad, bad, bad').toBe(2);
});

test('one bad window alone does not fire', () => {
  guard();
  expect(alertFires([w(40, 6), w(40, 0), w(40, 6), w(40, 1)]), 'index for bad, ok, bad, ok').toBe(-1);
});

test('exactly 5 % is not above the threshold', () => {
  guard();
  expect(alertFires([w(40, 2), w(40, 2), w(40, 2)]), 'index for three windows of 2/40').toBe(-1);
});

test('a window with fewer than 20 requests does not count', () => {
  guard();
  expect(alertFires([w(10, 3), w(10, 3), w(10, 3)]), 'index for three windows of 3/10').toBe(-1);
  expect(alertFires([w(40, 6), w(10, 3), w(40, 6), w(40, 6)]), 'index for bad, small, bad, bad').toBe(3);
  expect(alertFires([w(20, 2), w(20, 2)]), 'index for two windows of 2/20 (exactly 20 requests count)').toBe(1);
});

test('the options change the threshold and the length', () => {
  guard();
  expect(alertFires([w(100, 2), w(100, 2), w(100, 2)], { rate: 0.01, forWindows: 3 }), 'index with rate 0.01 for 3 windows').toBe(2);
});

test('with compatible data the plan rolls back without a restore', () => {
  guard();
  expect(rollbackPlan({ current, previous, dataSchemaVersion: 1, backup, writesSinceUpgrade: 9 }), 'the plan').toEqual({
    action: 'rollback',
    steps: ['stop 1.4.0', 'verify sha256 bb22', 'start 1.3.0', 'check /readyz', 'check error rate'],
  });
});

test('newer data is restored from the backup before the start', () => {
  guard();
  expect(rollbackPlan({ current, previous, dataSchemaVersion: 2, backup, writesSinceUpgrade: 0 }), 'the plan').toEqual({
    action: 'rollback',
    steps: ['stop 1.4.0', 'verify sha256 bb22', 'restore backups/habits-before-1.4.0.json', 'start 1.3.0', 'check /readyz', 'check error rate'],
  });
});

test('newer data with writes since the upgrade means fix forward', () => {
  guard();
  expect(rollbackPlan({ current, previous, dataSchemaVersion: 2, backup, writesSinceUpgrade: 3 }).action, 'action with 3 writes since the upgrade').toBe('fix-forward');
});

test('newer data without a readable backup means fix forward', () => {
  guard();
  expect(rollbackPlan({ current, previous, dataSchemaVersion: 2, backup: null, writesSinceUpgrade: 0 }).action, 'action without a backup').toBe('fix-forward');
  expect(rollbackPlan({ current, previous, dataSchemaVersion: 2, backup: { ...backup, schemaVersion: 2 }, writesSinceUpgrade: 0 }).action, 'action with a backup of schema 2').toBe('fix-forward');
});

test('without a previous artifact there is nothing to roll back to', () => {
  guard();
  const plan = rollbackPlan({ current, previous: null, dataSchemaVersion: 1, backup, writesSinceUpgrade: 0 });
  expect(plan.action, 'action without a previous artifact').toBe('fix-forward');
  expect(typeof plan.reason, 'type of plan.reason').toBe('string');
});
