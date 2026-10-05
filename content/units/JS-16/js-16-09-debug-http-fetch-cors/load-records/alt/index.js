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

async function attemptOnce(url) {
  const response = await fetch(url); // a rejection leaves this function as it is
  if (!response.ok) return { message: `${MESSAGES.http} (${response.status})` };
  const type = response.headers.get("content-type") || "";
  if (!type.startsWith("application/json")) return { message: MESSAGES.notJson };
  return { records: await response.json() };
}

async function loadRecords(url) {
  let result;
  try {
    result = await attemptOnce(url);
  } catch (firstError) {
    try {
      result = await attemptOnce(url);
    } catch (secondError) {
      result = { message: MESSAGES.noAnswer };
    }
  }
  renderList(result.records ?? []);
  showMessage(result.message ?? "");
}

await loadRecords("./data/expenses.json");
