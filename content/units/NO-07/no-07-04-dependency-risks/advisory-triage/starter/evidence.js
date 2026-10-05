// Synthetic evidence about the expenses server (read-only): its lockfile and which exported
// functions of each package its code actually calls (found by reading the imports and call sites).
export const lock = {
  lockfileVersion: 3,
  packages: {
    '': { dependencies: { 'money-fmt': '^2.0.0', 'csv-tidy': '~0.9.0' }, devDependencies: { 'test-kit': '^1.10.0' } },
    'node_modules/money-fmt': { version: '2.3.0' },
    'node_modules/csv-tidy': { version: '0.9.1' },
    'node_modules/test-kit': { version: '1.10.0', dev: true },
  },
};

export const usedExports = {
  'money-fmt': ['format'],
  'csv-tidy': ['formatRow'],
  'test-kit': ['run'],
};
