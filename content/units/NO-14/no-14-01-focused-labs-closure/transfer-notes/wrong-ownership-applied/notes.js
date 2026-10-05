// Your transfer note, one entry per lab. See the task for what goes where.
export const notes = {
  sql: {
    applied: ['versioned-migrations'],
    stayed: [
      { skill: 'parameterized-queries', because: 'file-storage' },
      { skill: 'joins-aggregates', because: 'file-storage' },
      { skill: 'index-query-plan', because: 'file-storage' },
    ],
    predicted: [1, 1, 0],
    observed: [1, 1, 0],
    paragraph: `%%paraSql%%`,
  },
  auth: {
    applied: ['secrets-from-config', 'size-time-limits', 'ownership-checks'],
    stayed: [
      { skill: 'password-hashing', because: 'single-user' },
      { skill: 'session-expiry', because: 'single-user' },
    ],
    predicted: [200, 200, 401],
    observed: [200, 200, 200],
    paragraph: `%%paraAuth%%`,
  },
  ssr: {
    applied: ['server-render', 'html-safe-initial-data', 'hydration-from-page-data'],
    stayed: [{ skill: 'server-components', because: 'no-rsc-setup' }],
    predicted: false,
    observed: false,
    paragraph: `%%paraSsr%%`,
  },
};
