// Counts how many times each component has rendered. Every component calls countRender first.
// The checks read these numbers; the page shows nothing. Read-only.
export const renderCounts = {};

export function countRender(name) {
  renderCounts[name] = (renderCounts[name] ?? 0) + 1;
}
