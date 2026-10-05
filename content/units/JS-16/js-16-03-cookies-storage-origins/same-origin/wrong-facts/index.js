// Correct comparison, but treats cookies as an older kind of localStorage.
function sameOrigin(a, b) {
  try {
    const first = new URL(a);
    const second = new URL(b);
    return first.origin !== "null" && first.origin === second.origin;
  } catch (error) {
    return false;
  }
}

const storageFacts = {
  localStorage: { scope: "origin", sentWithRequests: false, readableByScripts: true },
  sessionStorage: { scope: "origin", sentWithRequests: false, readableByScripts: true },
  cookie: { scope: "origin", sentWithRequests: false, readableByScripts: true },
  httpOnlyCookie: { scope: "origin", sentWithRequests: false, readableByScripts: true },
};
