// Measured on a slow laptop: even 300 tasks take longer than one frame.
export const decision = {
  realisticCount: 300,
  msAtRealistic: 21,
  msAt5000: 260,
  choice: "paging",
  windowingCosts: ["scroll-restoration", "screen-reader-context", "keyboard-focus", "find-in-page"],
};
