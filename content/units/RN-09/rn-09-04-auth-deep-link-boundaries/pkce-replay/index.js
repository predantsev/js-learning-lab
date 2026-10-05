// index.js: replays one sign-in in which a look-alike app receives the redirect first.
import { authorize, redeem, sha256base64url } from './authServer.js';

const USE_PKCE = true;

// 1. Your app: a fresh random verifier for this sign-in; only its hash leaves the app.
const codeVerifier = crypto.randomUUID() + crypto.randomUUID();
const codeChallenge = USE_PKCE ? await sha256base64url(codeVerifier) : undefined;
console.log('app → browser: open /authorize', USE_PKCE ? 'with code_challenge' : 'without code_challenge');

// 2. The person signs in in the system browser; the server redirects back with a one-time code.
const redirect = authorize({ codeChallenge });
const code = new URL(redirect).searchParams.get('code');
console.log('server → redirect:', redirect);

// 3. A look-alike app that registered the same scheme receives the redirect and redeems the code at once.
const stolen = await redeem({ code });
console.log('look-alike app redeems the code:', stolen.error ?? `got ${stolen.accessToken}`);

// 4. Your app redeems the same code with its verifier.
const yours = await redeem({ code, codeVerifier: USE_PKCE ? codeVerifier : undefined });
console.log('your app redeems the code:', yours.error ?? `got ${yours.accessToken}`);
