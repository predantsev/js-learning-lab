// Compares the text between "//" and the next "/": misses default ports, letter case and bad input.
function sameOrigin(a, b) {
  return a.split("/")[0] === b.split("/")[0] && a.split("/")[2] === b.split("/")[2];
}

const storageFacts = {
  localStorage: { scope: "origin", sentWithRequests: false, readableByScripts: true },
  sessionStorage: { scope: "origin and tab", sentWithRequests: false, readableByScripts: true },
  cookie: { scope: "host and path", sentWithRequests: true, readableByScripts: true },
  httpOnlyCookie: { scope: "host and path", sentWithRequests: true, readableByScripts: false },
};
