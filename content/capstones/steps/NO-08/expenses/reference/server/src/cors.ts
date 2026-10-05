// CORS for the web client: the browser lets a page of another origin (the web app on 127.0.0.1:4310) read
// an answer of this server (127.0.0.1:4311) only when the answer names that origin. An allowlist, never
// "*": an allowed Origin is repeated exactly, every answer says `Vary: Origin` (the answer depends on it),
// and nothing is said for any other origin — its page cannot read the answer. No credentials: the API has
// no login and no cookies, so Access-Control-Allow-Credentials is never sent.
//
// A DELETE or a JSON body is not a "simple" request: the browser first asks with OPTIONS (a preflight,
// with Access-Control-Request-Method). answerPreflight answers it here, before any route runs — 204 with
// the methods and headers the web client uses, or a bare 204 for an origin that is not allowed. CORS does
// not protect the API: curl, a Node script or another program never asks and is never stopped by it.
import type http from "node:http";

export const ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE";
export const ALLOWED_HEADERS = "content-type, idempotency-key";

// Sets the CORS headers of an ordinary answer; true when the request's origin is allowed.
export function applyCors(req: http.IncomingMessage, res: http.ServerResponse, allowedOrigins: readonly string[]): boolean {
  res.setHeader("vary", "Origin");
  const origin = req.headers.origin;
  if (typeof origin === "string" && allowedOrigins.includes(origin)) {
    res.setHeader("access-control-allow-origin", origin);
    return true;
  }
  return false;
}

// A preflight is an OPTIONS request with Access-Control-Request-Method. It is answered whole here (true);
// any other request goes on to the routes (false).
export function answerPreflight(req: http.IncomingMessage, res: http.ServerResponse, allowedOrigins: readonly string[]): boolean {
  if (req.method !== "OPTIONS" || req.headers["access-control-request-method"] === undefined) {
    return false;
  }
  if (applyCors(req, res, allowedOrigins)) {
    res.setHeader("access-control-allow-methods", ALLOWED_METHODS);
    res.setHeader("access-control-allow-headers", ALLOWED_HEADERS);
  }
  res.statusCode = 204;
  res.end();
  return true;
}
