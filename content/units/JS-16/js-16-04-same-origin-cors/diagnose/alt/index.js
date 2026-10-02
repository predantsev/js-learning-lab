// The same diagnosis, with the origins worked out by the URL API and lower-case header names.
const page = new URL("http://127.0.0.1:5173/").origin;

const diagnoses = {
  habits: {
    pageOrigin: page,
    targetOrigin: new URL("http://127.0.0.1:8080/habits.json").origin,
    preflightNeeded: false,
    missingHeader: "access-control-allow-origin",
    requestReachedServer: true,
    fixedIn: "server",
  },
  expenses: {
    pageOrigin: page,
    targetOrigin: new URL("http://127.0.0.1:3000/expenses").origin,
    preflightNeeded: true,
    missingHeader: "access-control-allow-headers",
    requestReachedServer: false,
    fixedIn: "server",
  },
};
