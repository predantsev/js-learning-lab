// Words that name the kind of thing instead of describing the picture.
const GENERIC = ['image', 'picture', 'photo', 'img', 'icon', 'зображення', 'картинка', 'фото', 'малюнок', 'світлина', 'іконка', 'значок'];
// Style properties that make text look different and do not depend on the text itself.
const LOOK = ['color', 'backgroundColor', 'fontSize', 'fontWeight', 'fontStyle', 'fontFamily', 'textAlign', 'textDecorationLine',
  'textTransform', 'letterSpacing', 'lineHeight', 'opacity', 'borderTopStyle', 'borderLeftStyle', 'paddingTop', 'paddingLeft', 'marginTop', 'marginLeft'];

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// A printed line that contains one of the accepted numbers on its own, next to at least one word.
const labeledLine = (accepted) => logs().find((line) => /\p{L}/u.test(line)
  && accepted.some((number) => new RegExp(`(^|[^\\d.])${escapeRegExp(number)}($|[^\\d])`).test(line)));

test('main has one first-level heading', () => {
  expect(screen.byRole('main'), 'the <main> element').toBeInTheDocument();
  expect(screen.$('main h1'), 'an <h1> inside <main>').toBeInTheDocument();
  expect(screen.$$('h1').length, 'number of <h1> elements on the page').toBe(1);
});

test('the image inside main has a meaningful alt text', () => {
  const image = screen.$('main img');
  expect(image, 'an <img> inside <main>').toBeInTheDocument();
  const alt = (image.getAttribute('alt') ?? '').trim();
  expect(alt.length, 'length of the alt text').toBeGreaterThan(2);
  expect(/\.(png|jpe?g|gif|svg|webp)$/i.test(alt), 'the alt text is a file name').toBe(false);
  expect(GENERIC.includes(alt.toLowerCase()), 'the alt text is only a generic word').toBe(false);
});

test('the note is styled through its class', () => {
  const note = screen.$('.note');
  expect(note, 'an element with class="note"').toBeInTheDocument();
  expect(note.textContent.trim().length, 'length of the note text').toBeGreaterThan(0);
  // The same element without the class shows what the note would look like without its rule.
  const probe = document.createElement(note.tagName);
  note.parentElement.append(probe);
  const withClass = getComputedStyle(note);
  const withoutClass = getComputedStyle(probe);
  const differs = LOOK.some((property) => withClass[property] !== withoutClass[property]);
  probe.remove();
  expect(differs, 'the note looks different from the same element without the class').toBe(true);
});

test('prints the total in hryvnias with a label', () => {
  expect(labeledLine(['1365.5', '1365.50']), 'a printed line with a label and the total 1365.5').toBeDefined();
});

test('prints the average in hryvnias with a label', () => {
  expect(labeledLine(['682.75']), 'a printed line with a label and the average 682.75').toBeDefined();
});
