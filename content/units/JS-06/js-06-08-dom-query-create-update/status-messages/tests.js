const area = () => document.querySelector('#messages');
const shown = () => [...(area()?.querySelectorAll('p') ?? [])].map((paragraph) => paragraph.textContent);

test('the page shows its two messages when the program runs', () => {
  expect(shown(), 'texts of the paragraphs in the messages area').toEqual([L.saved, L.streak]);
});

test('addMessage adds a new paragraph with the given text', () => {
  const before = shown().length;
  scope.addMessage(L.extra);
  const after = shown();
  expect(after.length, 'number of paragraphs after one more addMessage').toBe(before + 1);
  expect(after[after.length - 1], 'text of the last paragraph').toBe(L.extra);
});

test('clearMessages removes every message but keeps the area', () => {
  scope.addMessage(L.extra);
  scope.clearMessages();
  expect(area(), 'the messages area #messages').toBeInTheDocument();
  expect(shown().length, 'paragraphs left in the area').toBe(0);
});

test('messages added after clearing appear on the page', () => {
  scope.clearMessages();
  scope.addMessage(L.extra);
  expect(shown(), 'messages in the area after clearing and adding one').toEqual([L.extra]);
});
