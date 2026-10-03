// A threat note that names the safe API and, for contrast, the HTML sink it avoids.
const THREAT_NOTE = {
  untrustedSources: ["form field", "localStorage", "fetched JSON"],
  sinks: {
    title: "textContent, not innerHTML",
    organizerName: "textContent замість innerHTML",
    organizerLink: "link.href only after new URL(url).protocol is http: or https:, never insertAdjacentHTML",
  },
  storedKeys: [
    { key: "events.city", storage: "localStorage", scope: "origin", lifetime: "until the person clears it" },
  ],
  secrets: "The page needs no key at all; anything client code reads ends up in the bundle, so a secret would stay on the server.",
};
