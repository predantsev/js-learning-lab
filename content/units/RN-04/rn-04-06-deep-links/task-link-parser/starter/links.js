// Planner links look like courselab://task/<id>, for example courselab://task/t-02.
// A task id is "t-" followed by exactly two digits.

// Turns a link into the screen to open: { screen: 'Detail', params: { id } } or { screen: 'NotFound' }.
// The link comes from outside the app, so nothing in it is trusted.
export function parseRecordLink(url) {
  // TODO
  return { screen: 'NotFound' };
}
