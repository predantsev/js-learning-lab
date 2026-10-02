test('the program counts three finished tasks', () => {
  expect(logs(), 'the console after the call at the bottom of the file').toEqual(['3']);
});

test('markDone counts on whatever object it is called on', () => {
  expect(typeof scope.board.markDone, 'type of board.markDone').toBe('function');
  const other = { doneCount: 10, markDone: scope.board.markDone };
  other.markDone(['a', 'b']);
  expect(other.doneCount, 'doneCount of the other object after markDone(["a", "b"])').toBe(12);
});

test('markDone leaves board alone when called on another object', () => {
  expect(typeof scope.board.markDone, 'type of board.markDone').toBe('function');
  const other = { doneCount: 0, markDone: scope.board.markDone };
  other.markDone(['a', 'b']);
  expect(scope.board.doneCount, 'board.doneCount after a call on another object').toBe(3);
});

test('an empty list changes nothing', () => {
  expect(typeof scope.board.markDone, 'type of board.markDone').toBe('function');
  const other = { doneCount: 4, markDone: scope.board.markDone };
  other.markDone([]);
  expect(other.doneCount, 'doneCount after markDone([])').toBe(4);
});
