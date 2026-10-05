import { renderList, showMessage } from "./ui.js";

// Loads the expense records and shows them, or a message that fits what went wrong:
// - an answer that is not ok: no retry; MESSAGES.http followed by the status in brackets;
// - an ok answer whose Content-Type is not JSON: no retry, the body is not parsed; MESSAGES.notJson;
// - a rejected fetch (no network, or the browser blocked the response): one retry, then MESSAGES.noAnswer.
// On every failure the list is emptied; on success the message is "".
const MESSAGES = {
  http: "%%httpError%%",
  notJson: "%%notJson%%",
  noAnswer: "%%noAnswer%%",
  serverDown: "%%serverDown%%",
};

async function loadRecords(url) {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    let response;
    try {
      response = await fetch(url);
    } catch (error) {
      // No answer reached the code: offline, or a CORS block. Worth one more try.
      if (attempt === 2) {
        renderList([]);
        showMessage(MESSAGES.noAnswer);
      }
      continue;
    }
    if (!response.ok) {
      renderList([]);
      showMessage(`${MESSAGES.http} (${response.status})`);
      return;
    }
    if (!(response.headers.get("content-type") ?? "").includes("application/json")) {
      renderList([]);
      showMessage(MESSAGES.notJson);
      return;
    }
    renderList(await response.json());
    showMessage("");
    return;
  }
}

await loadRecords("./data/expenses.json");
