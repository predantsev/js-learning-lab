// Two failing requests recorded on a learner's computer. Read each record and fill in its diagnosis.
//
// Case "habits" — the page http://127.0.0.1:5173/ runs:
//   const response = await fetch("http://127.0.0.1:8080/habits.json");
// Console:
//   Access to fetch at 'http://127.0.0.1:8080/habits.json' from origin 'http://127.0.0.1:5173' has been
//   blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
//   Uncaught (in promise) TypeError: Failed to fetch
// Log of the server on port 8080:
//   127.0.0.1:58818 - "GET /habits.json" 200 [0ms]
// Headers of its response:
//   Content-Type: application/json; charset=utf-8
//
// Case "expenses" — the page http://127.0.0.1:5173/ runs:
//   await fetch("http://127.0.0.1:3000/expenses", {
//     method: "POST", headers: { "Content-Type": "application/json" }, body,
//   });
// Console:
//   Access to fetch at 'http://127.0.0.1:3000/expenses' from origin 'http://127.0.0.1:5173' has been
//   blocked by CORS policy: Request header field content-type is not allowed by
//   Access-Control-Allow-Headers in preflight response.
//   Uncaught (in promise) TypeError: Failed to fetch
// Log of the server on port 3000:
//   OPTIONS /expenses 204
// Headers of its OPTIONS response:
//   Access-Control-Allow-Origin: http://127.0.0.1:5173
//   Access-Control-Allow-Methods: GET, POST
//
// For each case fill in:
//   pageOrigin, targetOrigin  — origins as text, like "http://example.test:1234"
//   preflightNeeded           — did the browser have to send OPTIONS before the request itself?
//   missingHeader             — the response header whose absence kept the response from the script
//   requestReachedServer      — did the server receive the GET or POST itself (not only OPTIONS)?
//   fixedIn                   — "client" or "server": where the fix belongs
const diagnoses = {
  habits: {
    pageOrigin: "",
    targetOrigin: "",
    preflightNeeded: null,
    missingHeader: "",
    requestReachedServer: null,
    fixedIn: "",
  },
  expenses: {
    pageOrigin: "",
    targetOrigin: "",
    preflightNeeded: null,
    missingHeader: "",
    requestReachedServer: null,
    fixedIn: "",
  },
};
