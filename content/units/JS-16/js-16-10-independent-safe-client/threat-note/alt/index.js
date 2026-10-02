// A threat note for the events page, written in Ukrainian prose where prose is asked for.
const THREAT_NOTE = {
  untrustedSources: ["fetched JSON", "form field", "localStorage"],
  sinks: {
    title: "createElement + textContent",
    organizerName: "textContent (or a text node)",
    organizerLink: "setAttribute(\"href\") after checking the URL protocol",
  },
  storedKeys: [
    { key: "events.city", storage: "localStorage", scope: "origin", lifetime: "без терміну, доки людина не стерла" },
  ],
  secrets: "Сторінці не потрібен жоден ключ: усе, що читає клієнтський код, потрапляє в bundle, тож секрет жив би лише на сервері.",
};
