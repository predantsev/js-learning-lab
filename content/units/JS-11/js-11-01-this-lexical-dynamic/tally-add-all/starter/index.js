// Counts the finished tasks of a planner.
const board = {
  doneCount: 0,
  // For every id in the list, increase doneCount by 1.
  // Count on `this`, so that the method works on any object it is called on.
  markDone(ids) {
  },
};

board.markDone(["t-01", "t-02", "t-03"]);
console.log(board.doneCount);
