// A name with markup in it: bold text and an image whose onerror attribute holds code.
const NASTY = `<b>${L.word}</b><img src="x.png" onerror="window.nameCodeRan = true">`;
const freshBox = () => {
  const box = document.createElement('div');
  document.body.append(box);
  return box;
};
const parsedInside = (box) => box.querySelectorAll('b, img').length;

test('the page shows the typed name as text when the program runs', () => {
  const box = document.querySelector('#preview');
  expect(box.textContent, 'text of #preview').toBe(L.typed);
  expect(box.querySelectorAll('img').length, '<img> elements inside #preview').toBe(0);
});

test('renderName shows markup in a name as plain characters', () => {
  const box = freshBox();
  scope.renderName(box, NASTY);
  expect(box.textContent, 'text shown in the container').toBe(NASTY);
  expect(parsedInside(box), '<b> and <img> elements made from the name').toBe(0);
  box.remove();
});

test('renderName replaces what the container showed before', () => {
  const box = freshBox();
  scope.renderName(box, L.first);
  scope.renderName(box, L.second);
  expect(box.textContent, 'text of the container after two calls').toBe(L.second);
  box.remove();
});

test('renderBold shows the name inside one strong element', () => {
  const box = freshBox();
  scope.renderBold(box, L.first);
  scope.renderBold(box, NASTY);
  const strong = box.querySelectorAll('strong');
  expect(strong.length, '<strong> elements in the container after two calls').toBe(1);
  expect(strong[0].textContent, 'text inside <strong>').toBe(NASTY);
  expect(parsedInside(box), '<b> and <img> elements made from the name').toBe(0);
  box.remove();
});
