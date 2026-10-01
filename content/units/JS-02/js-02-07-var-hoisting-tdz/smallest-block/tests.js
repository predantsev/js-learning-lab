test('prints the same message as before', () => {
  expect(logs(), 'console lines').toEqual([`${L.walk}: 2 ${L.toGo}`]);
});

// `scope` lists the top-level names of the program: a name declared inside the if block is not among them.
test('left lives only inside its block', () => {
  expect(scope.left, 'left outside the if block').toBeUndefined();
});
