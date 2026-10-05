// Compares only the host name, as if localStorage were shared by every page on localhost.
function sameOrigin(a, b) {
  try {
    return new URL(a).hostname === new URL(b).hostname;
  } catch (error) {
    return false;
  }
}

const storageFacts = {
  localStorage: { scope: "origin", sentWithRequests: false, readableByScripts: true },
  sessionStorage: { scope: "origin and tab", sentWithRequests: false, readableByScripts: true },
  cookie: { scope: "host and path", sentWithRequests: true, readableByScripts: true },
  httpOnlyCookie: { scope: "host and path", sentWithRequests: true, readableByScripts: false },
};
