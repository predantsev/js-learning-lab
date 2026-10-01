// Hash router: #/course, #/lesson/<id>/<page>?block=<id>, #/project[/<UNIT>], #/bookmarks, #/review, #/glossary/<term>, #/settings
import { Store } from './store';

export type Route =
  | { name: 'home' }
  | { name: 'course' }
  | { name: 'lesson'; id: string; page: number; block: string | null }
  | { name: 'project'; unit: string | null }
  | { name: 'bookmarks' }
  | { name: 'review' }
  | { name: 'glossary'; term: string | null }
  | { name: 'settings' }
  | { name: 'not-found'; path: string };

export function parseRoute(hash: string): Route {
  const [pathPart, queryPart = ''] = hash.replace(/^#\/?/, '').split('?');
  const parts = pathPart.split('/').filter(Boolean).map(decodeURIComponent);
  const query = new URLSearchParams(queryPart);
  if (parts.length === 0) return { name: 'home' };
  switch (parts[0]) {
    case 'course': return { name: 'course' };
    case 'lesson': return parts[1] ? { name: 'lesson', id: parts[1], page: Math.max(0, Number(parts[2] ?? 1) - 1 || 0), block: query.get('block') } : { name: 'course' };
    case 'project': return { name: 'project', unit: parts[1] ? parts[1].toUpperCase() : null };
    case 'bookmarks': return { name: 'bookmarks' };
    case 'review': return { name: 'review' };
    case 'glossary': return { name: 'glossary', term: parts[1] ?? null };
    case 'settings': return { name: 'settings' };
    default: return { name: 'not-found', path: pathPart };
  }
}

export const lessonHref = (id: string, page = 0, block?: string): string => `#/lesson/${encodeURIComponent(id)}/${page + 1}${block ? `?block=${encodeURIComponent(block)}` : ''}`;
export const route = new Store<Route>(parseRoute(location.hash));
window.addEventListener('hashchange', () => route.set(parseRoute(location.hash)));
export const navigate = (href: string): void => { location.hash = href.replace(/^#/, ''); };
