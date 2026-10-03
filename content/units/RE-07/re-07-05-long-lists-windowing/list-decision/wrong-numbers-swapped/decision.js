// Your decision for the planner, from YOUR measurements.
export const decision = {
  realisticCount: 300, // how many tasks a real planner user has (from the task)
  msAtRealistic: 41.5, // render time when switching the plain list to that many tasks
  msAt5000: 3.2, // render time when switching it to 5,000 tasks
  choice: "plain", // for the realistic count: "plain", "paging" or "windowing"
  windowingCosts: ["find-in-page", "keyboard-focus", "screen-reader-context", "scroll-restoration"], // what windowing would cost here
};
