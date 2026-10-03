// parseIncomingLink.ts: turns an incoming link into a route, or refuses it.
import { APP_LINK_ORIGIN, CREDENTIAL_WORDS, CUSTOM_SCHEME, ID_PREFIX, type LinkResult } from './linkRules.ts';

export function parseIncomingLink(url: string): LinkResult {
  return { ok: false, reason: 'unknown-route' }; // TODO
}
