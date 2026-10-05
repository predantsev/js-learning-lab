// linkRules.ts: the rules every incoming link must pass. Do not edit.
export type LinkRoute = { screen: 'record'; capstone: Capstone; id: string };
export type LinkRejection = 'malformed-url' | 'unknown-origin' | 'credential-param' | 'unknown-route' | 'invalid-id';
export type LinkResult = { ok: true; route: LinkRoute } | { ok: false; reason: LinkRejection };

export type Capstone = 'wishlist' | 'planner' | 'habits' | 'expenses';

// The two forms a record link may take:
//   jsll-lab://records/<capstone>/<id>                  — the app's custom scheme
//   https://lab.jsll.example/records/<capstone>/<id>    — the verified app link
export const CUSTOM_SCHEME = 'jsll-lab:';
export const APP_LINK_ORIGIN = 'https://lab.jsll.example';

// Each capstone's ids: its letter, a hyphen and two digits (w-03, t-01, h-06, e-02).
export const ID_PREFIX: Record<Capstone, string> = { wishlist: 'w', planner: 't', habits: 'h', expenses: 'e' };

// A query parameter is credential-like when its name, in lowercase, contains one of these.
export const CREDENTIAL_WORDS = ['token', 'password', 'secret', 'session', 'key', 'code'];
