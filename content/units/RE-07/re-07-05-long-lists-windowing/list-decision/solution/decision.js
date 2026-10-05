// Your decision for the planner, from YOUR measurements.
export const decision = {
  realisticCount: 300, // how many tasks a real planner user has (from the task)
  msAtRealistic: 3.2, // the "mount" line: the page opens with that many tasks
  msAt5000: 41.5, // the "update" line after pressing 5000
  choice: "plain", // for the realistic count: "plain", "paging" or "windowing"
  windowingCosts: ["find-in-page", "keyboard-focus", "screen-reader-context", "scroll-restoration"], // what windowing would cost here
};
