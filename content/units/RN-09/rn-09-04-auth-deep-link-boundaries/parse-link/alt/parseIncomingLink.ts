// parseIncomingLink.ts: the same rules, with one pattern for the path after the origin is normalized.
import { APP_LINK_ORIGIN, CREDENTIAL_WORDS, CUSTOM_SCHEME, ID_PREFIX, type Capstone, type LinkResult } from './linkRules.ts';

const ROUTE = /^\/records\/(wishlist|planner|habits|expenses)\/([^/]+)$/;

function pathOf(link: URL): string | null {
  if (link.protocol === CUSTOM_SCHEME) return `/${link.host}${link.pathname}`;
  if (link.origin === APP_LINK_ORIGIN) return link.pathname;
  return null;
}

export function parseIncomingLink(url: string): LinkResult {
  if (!URL.canParse(url)) return { ok: false, reason: 'malformed-url' };
  const link = new URL(url);

  const path = pathOf(link);
  if (path === null) return { ok: false, reason: 'unknown-origin' };

  const names = [...link.searchParams.keys()].map((name) => name.toLowerCase());
  if (names.some((name) => CREDENTIAL_WORDS.some((word) => name.includes(word)))) {
    return { ok: false, reason: 'credential-param' };
  }

  const match = ROUTE.exec(path);
  if (!match) return { ok: false, reason: 'unknown-route' };
  const capstone = match[1] as Capstone;

  let id = '';
  try {
    id = decodeURIComponent(match[2]);
  } catch {
    return { ok: false, reason: 'invalid-id' };
  }
  const [prefix, digits, ...more] = id.split('-');
  const valid = prefix === ID_PREFIX[capstone] && more.length === 0 && /^\d\d$/.test(digits ?? '');
  return valid ? { ok: true, route: { screen: 'record', capstone, id } } : { ok: false, reason: 'invalid-id' };
}
