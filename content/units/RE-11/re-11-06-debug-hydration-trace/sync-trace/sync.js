// Talks to the sync service directly, with a token. The token is made up.
const SYNC_TOKEN = "demo-SYNC-not-a-real-token";

export async function syncNow() {
  // A pretend call to the sync service, which checks the token.
  return `synced (token ${SYNC_TOKEN.slice(0, 4)}…)`;
}
