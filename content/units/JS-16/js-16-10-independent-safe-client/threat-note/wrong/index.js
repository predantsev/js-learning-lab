// A note that trusts the page's own storage and shows titles as HTML.
const THREAT_NOTE = {
  untrustedSources: ["form field"],
  sinks: {
    title: "innerHTML",
    organizerName: "textContent",
    organizerLink: "href",
  },
  storedKeys: [
    { key: "events.city", storage: "localStorage", scope: "localhost", lifetime: "forever" },
  ],
  secrets: "Minified.",
};
