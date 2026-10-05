// Your decision for the planner, from YOUR measurements.
export const decision = {
  realisticCount: 0, // how many tasks a real planner user has (from the task)
  msAtRealistic: 0, // the "mount" line: the page opens with that many tasks
  msAt5000: 0, // the "update" line after pressing 5000
  choice: "", // for the realistic count: "plain", "paging" or "windowing"
  windowingCosts: [], // what windowing would cost here: ids from the list in the task
};
