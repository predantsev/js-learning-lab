// Reads the token signing key from the environment and refuses to start with a weak one.
// The VALUE of a secret never appears in a message, a log line or a response.
const PLACEHOLDERS = ['changeme', 'secret', 'password'];

export function loadSecrets(env) {
  const current = env.SESSION_SECRET;
  if (current === undefined || current === '') throw new Error('SESSION_SECRET is not set');
  if (PLACEHOLDERS.includes(current.toLowerCase())) throw new Error('SESSION_SECRET is a placeholder value');
  if (current.length < 32) throw new Error(`SESSION_SECRET is too short (${current.length} characters, at least 32 needed)`);
  return { current };
}
