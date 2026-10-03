// server.js: stands in for the mock service's token endpoint. It runs on a computer, never in the app,
// so nothing in this file is part of either package.
export const serverEnv = {
  // The photo service's secret belongs here, in the environment of the server process.
};

// POST /token: checks who is asking (in the lab: a signed-in session) and answers with a token
// that works for 15 minutes. The secret itself never leaves the server.
export function issueToken(session) {
  if (!session.signedIn) return { status: 401 };
  return { status: 200, body: { accessToken: `tok_${session.userId}_${Date.now().toString(36)}`, expiresIn: 900 } };
}
