// Returns true when the two addresses share an origin (scheme, host and port), otherwise false.
// An address that is not a valid URL, or whose origin is "null", never shares an origin.
function sameOrigin(a, b) {
  let first;
  let second;
  try {
    first = new URL(a);
    second = new URL(b);
  } catch (error) {
    return false;
  }
  if (first.origin === "null" || second.origin === "null") return false;
  return first.origin === second.origin;
}

// What each kind of browser storage is tied to, whether the browser sends it with requests by
// itself, and whether the page's scripts can read it.
// scope: "origin" | "origin and tab" | "host and path"
const storageFacts = {
  localStorage: { scope: "origin", sentWithRequests: false, readableByScripts: true },
  sessionStorage: { scope: "origin and tab", sentWithRequests: false, readableByScripts: true },
  cookie: { scope: "host and path", sentWithRequests: true, readableByScripts: true },
  httpOnlyCookie: { scope: "host and path", sentWithRequests: true, readableByScripts: false },
};

console.log(sameOrigin("http://localhost:5173/a", "http://localhost:5173/b"));
