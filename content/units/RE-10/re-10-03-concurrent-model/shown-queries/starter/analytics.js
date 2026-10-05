// Searches the person actually saw results for. A real app would send them to a server.
export const shownSearches = [];

export function recordShown(query) {
  shownSearches.push(query);
}
