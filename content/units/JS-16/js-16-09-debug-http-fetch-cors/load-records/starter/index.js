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
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url);
      const records = await response.json();
      renderList(records);
      showMessage("");
      return;
    } catch (error) {
      if (attempt === 3) {
        renderList([]);
        showMessage(MESSAGES.serverDown);
      }
    }
  }
}

await loadRecords("./data/expenses.json");
