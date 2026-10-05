// Read-only helper of this lesson: requests the lab wishlist in one of five modes.
//   ok        the server answers at once
//   slow      the server answers after 1.5 s
//   error500  the server answers with status 500
//   offline   simulated: rejects exactly the way fetch does when there is no network
//             (the lab server is always reachable, so a real outage cannot be shown here)
//   hung      the server answers only after 10 s
const QUERY = { ok: "", slow: "&delay=1500", error500: "&status=500", hung: "&delay=10000" };

export function requestWishes(mode, lang) {
  if (mode === "offline") {
    return Promise.reject(new TypeError("Failed to fetch"));
  }
  return fetch("/lab/wishlist/items?lang=" + lang + QUERY[mode]);
}
