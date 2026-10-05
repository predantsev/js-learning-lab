// triage on synthetic lockfiles: one rule per check.
import { triage } from './triage.js';

const lockWith = (packages) => ({ lockfileVersion: 3, packages: { '': {}, ...packages } });
const decide = (advisory, packages, usedExports = {}) => {
  expect(typeof triage, 'type of triage').toBe('function');
  return triage(advisory, { lock: lockWith(packages), usedExports });
};
const advisory = (extra) => ({ package: 'money-fmt', vulnerableBelow: '2.4.0', fixedIn: '2.4.0', affects: 'format', ...extra });
const used = { 'money-fmt': ['format'] };

test('a version outside the vulnerable range, or a package that is not installed, is kept', () => {
  expect(decide(advisory(), { 'node_modules/money-fmt': { version: '2.4.0' } }, used), 'installed 2.4.0, vulnerable below 2.4.0').toEqual({ action: 'keep', urgent: false });
  expect(decide(advisory(), { 'node_modules/money-fmt': { version: '3.0.1' } }, used), 'installed 3.0.1').toEqual({ action: 'keep', urgent: false });
  expect(decide(advisory(), { 'node_modules/other': { version: '1.0.0' } }, used), 'money-fmt not in the lockfile').toEqual({ action: 'keep', urgent: false });
});

test('versions are compared as numbers, not as text', () => {
  expect(decide(advisory({ vulnerableBelow: '2.9.0', fixedIn: '2.9.0' }), { 'node_modules/money-fmt': { version: '2.10.0' } }, used), 'installed 2.10.0, vulnerable below 2.9.0')
    .toEqual({ action: 'keep', urgent: false });
});

test('a production package whose affected function the server calls is an urgent upgrade', () => {
  expect(decide(advisory(), { 'node_modules/money-fmt': { version: '2.3.0' } }, used), 'installed 2.3.0, format is called').toEqual({ action: 'upgrade', urgent: true });
});

test('with no fixed version the action is replace', () => {
  expect(decide(advisory({ fixedIn: null }), { 'node_modules/money-fmt': { version: '2.3.0' } }, used), 'no fix published, format is called').toEqual({ action: 'replace', urgent: true });
});

test('a development-only package is not urgent', () => {
  expect(decide(advisory(), { 'node_modules/money-fmt': { version: '2.3.0', dev: true } }, used), 'dev-only, format is called by the tests').toEqual({ action: 'upgrade', urgent: false });
});

test('a package whose affected function the server never calls is not urgent', () => {
  expect(decide(advisory({ affects: 'parseCurrency' }), { 'node_modules/money-fmt': { version: '2.3.0' } }, used), 'parseCurrency is never called').toEqual({ action: 'upgrade', urgent: false });
  expect(decide(advisory(), { 'node_modules/money-fmt': { version: '2.3.0' } }, {}), 'nothing of money-fmt is called').toEqual({ action: 'upgrade', urgent: false });
});
