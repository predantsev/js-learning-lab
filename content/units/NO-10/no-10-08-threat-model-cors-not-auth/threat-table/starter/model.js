// The vocabulary of the threat model and the proofs you can cite (read-only).
// Every proof is a real check against the lab server: it answers true when the control holds.
import { loadSecrets, WEB_CLIENT } from './lab-server.js';

// Where a request or a change enters the system.
export const ENTRY_POINTS = ['login-form', 'note-url', 'browser-page', 'non-browser-client', 'config'];

// The controls the lab service has.
export const CONTROLS = ['rate-limit', 'body-limit', 'session-check', 'ownership-scope', 'origin-check', 'secret-from-env', 'cors-allowlist'];

const post = (base, path, headers, body) =>
  fetch(base + path, { method: 'POST', headers, body, signal: AbortSignal.timeout(2000) });
const login = async (base, user, password) =>
  post(base, '/login', { 'content-type': 'application/json' }, JSON.stringify({ user, password }));
const cookieOf = (response) => response.headers.getSetCookie()[0]?.split(';')[0] ?? '';

// name → { control, entryPoints, run(base) → Promise<boolean> }
export const PROOFS = {
  'brute-force-gets-429': {
    control: 'rate-limit',
    entryPoints: ['login-form'],
    async run(base) {
      let last;
      for (let i = 0; i < 6; i += 1) last = await login(base, 'u-02', `guess-${i}`);
      return last.status === 429;
    },
  },
  'oversized-login-gets-413': {
    control: 'body-limit',
    entryPoints: ['login-form'],
    async run(base) {
      const response = await post(base, '/login', { 'content-type': 'application/json' }, JSON.stringify({ user: 'u-01', password: 'x'.repeat(5000) }));
      return response.status === 413;
    },
  },
  'no-session-gets-401': {
    control: 'session-check',
    entryPoints: ['non-browser-client', 'browser-page'],
    async run(base) {
      const response = await fetch(`${base}/notes`, { signal: AbortSignal.timeout(2000) });
      return response.status === 401;
    },
  },
  'foreign-note-gets-404': {
    control: 'ownership-scope',
    entryPoints: ['note-url'],
    async run(base) {
      const cookie = cookieOf(await login(base, 'u-01', 'sunflower-42'));
      const response = await fetch(`${base}/notes/n-2`, { headers: { cookie }, signal: AbortSignal.timeout(2000) });
      return response.status === 404;
    },
  },
  'foreign-origin-post-gets-403': {
    control: 'origin-check',
    entryPoints: ['browser-page'],
    async run(base) {
      const cookie = cookieOf(await login(base, 'u-01', 'sunflower-42'));
      const response = await post(base, '/notes', { cookie, origin: 'http://127.0.0.1:5173' });
      return response.status === 403;
    },
  },
  'weak-secret-refuses-start': {
    control: 'secret-from-env',
    entryPoints: ['config'],
    async run() {
      try {
        loadSecrets({ SESSION_SECRET: 'changeme' });
        return false;
      } catch {
        return true;
      }
    },
  },
  'foreign-page-gets-no-cors-header': {
    control: 'cors-allowlist',
    entryPoints: ['browser-page'],
    async run(base) {
      const cookie = cookieOf(await login(base, 'u-01', 'sunflower-42'));
      const foreign = await fetch(`${base}/notes`, { headers: { cookie, origin: 'https://evil.example' }, signal: AbortSignal.timeout(2000) });
      const own = await fetch(`${base}/notes`, { headers: { cookie, origin: WEB_CLIENT }, signal: AbortSignal.timeout(2000) });
      return !foreign.headers.has('access-control-allow-origin') && own.headers.get('access-control-allow-origin') === WEB_CLIENT;
    },
  },
};
