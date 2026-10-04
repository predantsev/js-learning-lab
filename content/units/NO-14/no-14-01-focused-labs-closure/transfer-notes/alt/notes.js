// Your transfer note, one entry per lab. See the task for what goes where.
// (Another valid note: other order, and two predictions that turned out wrong — still recorded honestly.)
export const notes = {
  ssr: {
    stayed: [{ because: 'no-rsc-setup', skill: 'server-components' }],
    applied: ['hydration-from-page-data', 'server-render', 'html-safe-initial-data'],
    predicted: true,
    observed: false,
    paragraph: `%%altSsr%%`,
  },
  auth: {
    stayed: [
      { skill: 'ownership-checks', because: 'single-user' },
      { skill: 'password-hashing', because: 'single-user' },
      { skill: 'session-expiry', because: 'single-user' },
    ],
    applied: ['size-time-limits', 'secrets-from-config'],
    predicted: [200, 200, 200],
    observed: [200, 200, 200],
    paragraph: `%%altAuth%%`,
  },
  sql: {
    stayed: [
      { skill: 'index-query-plan', because: 'file-storage' },
      { skill: 'parameterized-queries', because: 'file-storage' },
      { skill: 'joins-aggregates', because: 'file-storage' },
    ],
    applied: ['versioned-migrations'],
    predicted: [2, 1, 0],
    observed: [1, 1, 0],
    paragraph: `%%altSql%%`,
  },
};
