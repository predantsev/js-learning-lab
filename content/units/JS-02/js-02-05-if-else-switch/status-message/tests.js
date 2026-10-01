// Spacing around the colon is not the point of the exercise, so it is normalized.
const normalize = (text) => text.replace(/\s+/g, ' ').replace(/ :/g, ':').trim();
const linesFor = (title) => logs().map(normalize).filter((line) => line.startsWith(title));

test('a done task says done, whatever its date', () => {
  expect(linesFor(L.bill), 'lines printed for the internet bill').toEqual([`${L.bill}: ${L.done}`]);
});

test('a task without a due date says so', () => {
  expect(linesFor(L.grandma), 'lines printed for the letter to grandma').toEqual([`${L.grandma}: ${L.noDate}`]);
});

test('a pending task shows its due date', () => {
  expect(linesFor(L.plants), 'lines printed for the plants').toEqual([`${L.plants}: ${L.due} 2026-03-02`]);
});
