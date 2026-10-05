// The project card and the skill list (read-only). The card describes the project as the course plans
// it; your own project may differ — your note may then differ too, but the checks use this card.
export const projectCard = [
  `%%cardUser%%`,
  `%%cardFile%%`,
  `%%cardLoopback%%`,
  `%%cardLimit%%`,
  `%%cardConfig%%`,
  `%%cardMigrations%%`,
  `%%cardRender%%`,
];

// Why a lab skill can stay in its lab: each id names a property of the card.
export const reasons = {
  'single-user': `%%reasonUser%%`,
  'file-storage': `%%reasonFile%%`,
  'no-rsc-setup': `%%reasonRsc%%`,
};

export const skills = {
  sql: {
    'parameterized-queries': `%%skillParams%%`,
    'joins-aggregates': `%%skillJoins%%`,
    'index-query-plan': `%%skillIndex%%`,
    'versioned-migrations': `%%skillMigrations%%`,
  },
  auth: {
    'password-hashing': `%%skillHashing%%`,
    'session-expiry': `%%skillSessions%%`,
    'ownership-checks': `%%skillOwnership%%`,
    'secrets-from-config': `%%skillSecrets%%`,
    'size-time-limits': `%%skillLimits%%`,
  },
  ssr: {
    'server-render': `%%skillRender%%`,
    'html-safe-initial-data': `%%skillSafeJson%%`,
    'hydration-from-page-data': `%%skillHydration%%`,
    'server-components': `%%skillRsc%%`,
  },
};
