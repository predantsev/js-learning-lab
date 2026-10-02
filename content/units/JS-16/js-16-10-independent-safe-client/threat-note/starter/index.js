// A threat note for the events page from the previous task. Fill in every field.
const THREAT_NOTE = {
  // Where untrusted text enters the page. Pick from: "form field", "URL query", "localStorage", "fetched JSON".
  untrustedSources: [],
  // The API that displays each value on the page.
  sinks: {
    title: "",
    organizerName: "",
    organizerLink: "",
  },
  // Every key the page stores: { key, storage, scope, lifetime }.
  storedKeys: [],
  // One or two sentences: why no secret ships to the browser, and where a secret would live.
  secrets: "",
};
