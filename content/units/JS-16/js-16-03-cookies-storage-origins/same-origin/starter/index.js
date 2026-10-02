// Returns true when the two addresses share an origin (scheme, host and port), otherwise false.
// An address that is not a valid URL, or whose origin is "null", never shares an origin.
function sameOrigin(a, b) {
  // your code here
}

// What each kind of browser storage is tied to, whether the browser sends it with requests by
// itself, and whether the page's scripts can read it.
// scope: "origin" | "origin and tab" | "host and path"
const storageFacts = {
  localStorage: { scope: "", sentWithRequests: null, readableByScripts: null },
  sessionStorage: { scope: "", sentWithRequests: null, readableByScripts: null },
  cookie: { scope: "", sentWithRequests: null, readableByScripts: null },
  httpOnlyCookie: { scope: "", sentWithRequests: null, readableByScripts: null },
};

// To try it, add for example:
// console.log(sameOrigin("http://localhost:5173/a", "http://localhost:5173/b"));
