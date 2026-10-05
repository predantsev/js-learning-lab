// parseIncomingLink.ts: checks the origin with startsWith on the raw text, so a longer look-alike host passes.
import { APP_LINK_ORIGIN, CREDENTIAL_WORDS, ID_PREFIX, type Capstone, type LinkResult } from './linkRules.ts';

export function parseIncomingLink(url: string): LinkResult {
  let link: URL;
  try {
    link = new URL(url);
  } catch {
    return { ok: false, reason: 'malformed-url' };
  }

  let segments: string[];
  if (url.startsWith('jsll-lab://')) segments = [link.host, ...link.pathname.split('/').slice(1)];
  else if (url.startsWith(APP_LINK_ORIGIN)) segments = link.pathname.split('/').slice(1);
  else return { ok: false, reason: 'unknown-origin' };

  for (const name of link.searchParams.keys()) {
    const lower = name.toLowerCase();
    if (CREDENTIAL_WORDS.some((word) => lower.includes(word))) return { ok: false, reason: 'credential-param' };
  }

  const [section, capstone, rawId, ...rest] = segments;
  if (section !== 'records' || !Object.hasOwn(ID_PREFIX, capstone) || rawId === undefined || rest.length > 0) {
    return { ok: false, reason: 'unknown-route' };
  }

  let id: string;
  try {
    id = decodeURIComponent(rawId);
  } catch {
    return { ok: false, reason: 'invalid-id' };
  }
  const prefix = ID_PREFIX[capstone as Capstone];
  if (!new RegExp(`^${prefix}-\\d{2}$`).test(id)) return { ok: false, reason: 'invalid-id' };

  return { ok: true, route: { screen: 'record', capstone: capstone as Capstone, id } };
}
