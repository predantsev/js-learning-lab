// Returns true when the two addresses share an origin (scheme, host and port), otherwise false.
// An address that is not a valid URL, or whose origin is "null", never shares an origin.
function sameOrigin(a, b) {
  if (!URL.canParse(a) || !URL.canParse(b)) return false;
  const first = new URL(a);
  const second = new URL(b);
  const web = ["http:", "https:"];
  if (!web.includes(first.protocol) || !web.includes(second.protocol)) return false;
  return first.protocol === second.protocol && first.hostname === second.hostname && first.port === second.port;
}

// scope: "origin" | "origin and tab" | "host and path"
const storageFacts = {
  localStorage: { scope: "origin", sentWithRequests: false, readableByScripts: true },
  sessionStorage: { scope: "origin and tab", sentWithRequests: false, readableByScripts: true },
  cookie: { scope: "host and path", sentWithRequests: true, readableByScripts: true },
  httpOnlyCookie: { scope: "host and path", sentWithRequests: true, readableByScripts: false },
};
