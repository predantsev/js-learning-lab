const make = () => ({ id: 't-05', title: L.dentist, tags: [L.tagHealth] });

test('adds the tag at the end of the copy', () => {
  expect(scope.withTag(make(), L.tagUrgent)?.tags, 'tags of the copy').toEqual([L.tagHealth, L.tagUrgent]);
  expect(scope.withTag({ id: 't-06', title: 'x', tags: [] }, 'a')?.tags, 'tags of a copy made from an empty tags array').toEqual(['a']);
});

test('keeps the other fields', () => {
  const copy = scope.withTag(make(), L.tagUrgent);
  expect(copy?.id, 'id of the copy').toBe('t-05');
  expect(copy?.title, 'title of the copy').toBe(L.dentist);
});

test('returns a new object', () => {
  const task = make();
  const copy = scope.withTag(task, L.tagUrgent);
  expect(copy, 'the result').toBeDefined();
  expect(copy === task, 'copy === task').toBe(false);
});

test('leaves the original tags alone', () => {
  const task = make();
  const tagsBefore = task.tags;
  const copy = scope.withTag(task, L.tagUrgent);
  expect(task.tags, 'the original tags after the call').toEqual([L.tagHealth]);
  expect(task.tags === tagsBefore, 'the original still holds its own array').toBe(true);
  expect(copy?.tags === task.tags, 'copy.tags === task.tags').toBe(false);
});
