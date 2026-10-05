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
  // Checks the status and the type now, but never retries a rejected fetch.
  try {
    const response = await fetch(url);
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
  } catch (error) {
    renderList([]);
    showMessage(MESSAGES.serverDown);
  }
}

await loadRecords("./data/expenses.json");
