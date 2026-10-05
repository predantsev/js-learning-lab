// Planner links look like courselab://task/<id>, for example courselab://task/t-02.
// A task id is "t-" followed by exactly two digits.

// Turns a link into the screen to open: { screen: 'Detail', params: { id } } or { screen: 'NotFound' }.
// The link comes from outside the app, so nothing in it is trusted.
// Without URL: cut the known prefix off the text and check what is left.
const PREFIX = 'courselab://task/';

export function parseRecordLink(url) {
  if (typeof url !== 'string' || !url.startsWith(PREFIX)) return { screen: 'NotFound' };
  const rest = url.slice(PREFIX.length).split('?')[0].split('#')[0];
  if (rest === '' || rest.includes('/')) return { screen: 'NotFound' };
  try {
    const id = decodeURIComponent(rest);
    return /^t-[0-9][0-9]$/.test(id) ? { screen: 'Detail', params: { id } } : { screen: 'NotFound' };
  } catch {
    return { screen: 'NotFound' };
  }
}
