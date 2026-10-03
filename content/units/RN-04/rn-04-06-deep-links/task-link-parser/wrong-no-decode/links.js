// Planner links look like courselab://task/<id>, for example courselab://task/t-02.
// A task id is "t-" followed by exactly two digits.

const NOT_FOUND = { screen: 'NotFound' };
const TASK_ID = /^t-\d{2}$/;

// Turns a link into the screen to open: { screen: 'Detail', params: { id } } or { screen: 'NotFound' }.
// The link comes from outside the app, so nothing in it is trusted.
export function parseRecordLink(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return NOT_FOUND; // not a URL at all
  }
  if (parsed.protocol !== 'courselab:' || parsed.host !== 'task') return NOT_FOUND;

  const parts = parsed.pathname.split('/').filter((part) => part !== '');
  if (parts.length !== 1) return NOT_FOUND; // no id, or more than an id

  const id = parts[0]; // used as written, without decoding
  if (!TASK_ID.test(id)) return NOT_FOUND;

  // Only the checked id goes on; anything else in the link (a query, a fragment) is dropped.
  return { screen: 'Detail', params: { id } };
}
