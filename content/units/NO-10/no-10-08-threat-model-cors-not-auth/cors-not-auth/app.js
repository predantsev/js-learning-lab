// The lab notes service with a strict CORS policy: only pages of http://127.0.0.1:4310 get
// Access-Control-Allow-Origin. With requireSession: false there is no session check at all.
import http from 'node:http';

const ALLOWED_ORIGIN = 'http://127.0.0.1:4310';
const SESSIONS = new Map([['lab-session-u01', 'u-01']]);
const NOTES = [{ id: 'n-1', ownerId: 'u-01', title: '%%gifts%%' }];

export function createApp({ requireSession }) {
  return http.createServer((request, response) => {
    const headers = { 'content-type': 'application/json; charset=utf-8', vary: 'Origin' };
    // CORS: tells a BROWSER whether a page of this origin may read the answer. Nothing more.
    if (request.headers.origin === ALLOWED_ORIGIN) headers['access-control-allow-origin'] = ALLOWED_ORIGIN;

    const sid = /(?:^|;\s*)sid=([^;]*)/.exec(request.headers.cookie ?? '')?.[1];
    const userId = SESSIONS.get(sid);
    if (requireSession && !userId) {
      response.writeHead(401, headers);
      return response.end(JSON.stringify({ error: { code: 'UNAUTHENTICATED', details: {} } }));
    }
    response.writeHead(200, headers);
    response.end(JSON.stringify(requireSession ? NOTES.filter((note) => note.ownerId === userId) : NOTES));
  });
}
