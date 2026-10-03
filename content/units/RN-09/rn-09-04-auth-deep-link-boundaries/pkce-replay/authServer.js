// authServer.js: a synthetic sign-in server, for this lab only. Do not edit.
// It issues one-time codes and redeems each code at most once, as a real OAuth server does.
const pending = new Map(); // code → { challenge }

export async function sha256base64url(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

// GET /authorize — after the person signed in in the browser, the server answers with a redirect
// to the app's redirect address carrying a one-time code.
export function authorize({ codeChallenge }) {
  const code = `code_${Math.random().toString(36).slice(2, 8)}`;
  pending.set(code, { challenge: codeChallenge ?? null });
  return `jsll-lab://auth?code=${code}`;
}

// POST /token — trades a code for an access token. A public client has no secret, so the only
// proof that the redeemer started this sign-in is the code verifier, when PKCE was used.
export async function redeem({ code, codeVerifier }) {
  const entry = pending.get(code);
  if (!entry) return { error: 'invalid_grant: unknown or already used code' };
  if (entry.challenge !== null) {
    if (!codeVerifier || (await sha256base64url(codeVerifier)) !== entry.challenge) {
      return { error: 'invalid_grant: code_verifier does not match' };
    }
  }
  pending.delete(code); // a code works once
  return { accessToken: `tok_${Math.random().toString(36).slice(2, 8)}`, expiresIn: 900 };
}
