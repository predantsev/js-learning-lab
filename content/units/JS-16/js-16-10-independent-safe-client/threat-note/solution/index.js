// A threat note for the events page from the previous task. Fill in every field.
const THREAT_NOTE = {
  // Where untrusted text enters the page. Pick from: "form field", "URL query", "localStorage", "fetched JSON".
  untrustedSources: ["form field", "localStorage", "fetched JSON"],
  // The API that displays each value on the page.
  sinks: {
    title: "textContent",
    organizerName: "textContent",
    organizerLink: "href only after new URL(...).protocol is http: or https:",
  },
  // Every key the page stores: { key, storage, scope, lifetime }.
  storedKeys: [
    { key: "events.city", storage: "localStorage", scope: "origin", lifetime: "until the person clears it" },
  ],
  // One or two sentences: why no secret ships to the browser, and where a secret would live.
  secrets: "The page reads only public event data and needs no key; anything the client code reads ends up in the bundle, so a real key would stay on a server.",
};
