console.log("▶ format.js");

// formatTotal(summary): one line of text for the page.
export function formatTotal(summary) {
  return "%%wishesText%%" + summary.count + " · %%totalText%%" + summary.total + " %%uah%%";
}
