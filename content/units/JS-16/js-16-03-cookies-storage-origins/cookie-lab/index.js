// Part 1: which addresses share an origin with the page.
const page = "http://localhost:5173/wishes";
const others = [
  "http://localhost:5174/wishes",
  "http://localhost:5173/planner?day=2026-03-02",
  "https://localhost:5173/wishes",
  "http://app.localhost:5173/",
];
console.log("page:", new URL(page).origin);
for (const other of others) {
  console.log(other, "→", new URL(other).origin);
}

// Part 2: a Set-Cookie header recorded from a server's response, and a simplified model of the
// browser's rules for attaching it to requests: host, Domain, Path and Secure. The model ignores
// SameSite and expiry. Ports never matter for cookies.
const setOn = "http://shop.example.test/account/login";
const header = "session=%%sessionValue%%; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600";

function parseSetCookie(text, url) {
  const [pair, ...attributes] = text.split(";").map((part) => part.trim());
  const [name, ...rest] = pair.split("=");
  const pathname = new URL(url).pathname;
  const cookie = {
    name,
    value: rest.join("="),
    domain: null, // null means host-only: exactly the host that set it
    path: pathname.slice(0, pathname.lastIndexOf("/")) || "/",
    secure: false,
    httpOnly: false,
    sameSite: "Lax",
  };
  for (const attribute of attributes) {
    const [key, value = ""] = attribute.split("=");
    const lower = key.toLowerCase();
    if (lower === "domain") cookie.domain = value.replace(/^\./, "").toLowerCase();
    if (lower === "path") cookie.path = value;
    if (lower === "secure") cookie.secure = true;
    if (lower === "httponly") cookie.httpOnly = true;
    if (lower === "samesite") cookie.sameSite = value;
  }
  return cookie;
}

function attachedTo(cookie, url) {
  const target = new URL(url);
  const host = cookie.domain === null ? new URL(setOn).hostname : cookie.domain;
  const hostMatches = cookie.domain === null ? target.hostname === host : target.hostname === host || target.hostname.endsWith("." + host);
  const prefix = cookie.path.endsWith("/") ? cookie.path : cookie.path + "/";
  const pathMatches = target.pathname === cookie.path || target.pathname.startsWith(prefix);
  const schemeMatches = !cookie.secure || target.protocol === "https:";
  return hostMatches && pathMatches && schemeMatches;
}

const cookie = parseSetCookie(header, setOn);
console.log(cookie);
for (const url of [
  "http://shop.example.test/wishes",
  "http://shop.example.test:8080/api/items",
  "http://api.example.test/items",
  "http://shop.example.test/account/settings",
]) {
  console.log(attachedTo(cookie, url) ? "%%attached%%" : "%%notAttached%%", url);
}
console.log("%%scriptsCanRead%%", !cookie.httpOnly);
