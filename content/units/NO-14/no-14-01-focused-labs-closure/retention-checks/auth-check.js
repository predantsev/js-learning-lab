// Check 2 (auth, NO-10): a session with an idle limit reaching a route that checks the owner.
// The clock is passed in, so a check can move time without waiting.
import http from 'node:http';

export const IDLE_MS = 30 * 60 * 1000;

export function createWishlistServer({ clock, sessions, wishlists }) {
  return http.createServer((request, response) => {
    const send = (status, body) => {
      response.writeHead(status, { 'content-type': 'application/json' });
      response.end(JSON.stringify(body));
    };
    const match = /^\/wishlists\/([\w-]+)$/.exec(request.url);
    if (request.method !== 'GET' || !match) return send(404, { error: 'NOT_FOUND' });

    const sid = /(?:^|;\s*)sid=([^;]+)/.exec(request.headers.cookie ?? '')?.[1];
    const session = sessions.get(sid);
    if (!session) return send(401, { error: 'NO_SESSION' });
    if (clock.now() - session.lastSeenAt > IDLE_MS) {
      sessions.delete(sid); // an idle session is over: the next request must log in again
      return send(401, { error: 'NO_SESSION' });
    }
    session.lastSeenAt = clock.now();

    // The owner is part of the lookup: someone else's wishlist looks exactly like a missing one.
    const wishlist = wishlists.find((list) => list.id === match[1] && list.ownerId === session.userId);
    if (!wishlist) return send(404, { error: 'NOT_FOUND' });
    send(200, wishlist);
  });
}
