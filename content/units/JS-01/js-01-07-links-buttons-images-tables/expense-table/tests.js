// Words that name the kind of thing instead of describing the picture.
const GENERIC = ['image', 'picture', 'photo', 'img', 'icon', 'зображення', 'картинка', 'фото', 'малюнок', 'світлина', 'іконка', 'значок'];
const dataRows = () => screen.$$('table tr').filter((row) => row.querySelector('td'));

test('the image has a meaningful alt text', () => {
  const image = screen.$('img');
  expect(image, 'the <img> element').toBeInTheDocument();
  const alt = (image.getAttribute('alt') ?? '').trim();
  expect(alt.length, 'length of the alt text').toBeGreaterThan(2);
  expect(/\.(png|jpe?g|gif|svg|webp)$/i.test(alt), 'the alt text is a file name').toBe(false);
  expect(GENERIC.includes(alt.toLowerCase()), 'the alt text is only a generic word').toBe(false);
});

test('the first table row holds header cells', () => {
  const firstRow = screen.$('table tr');
  expect(firstRow, 'the first row of the table').toBeInTheDocument();
  const cells = [...firstRow.children];
  const headers = cells.filter((cell) => cell.tagName === 'TH');
  expect(headers.length, 'header cells <th> in the first row').toBeGreaterThanOrEqual(2);
  expect(headers.length, 'header cells among all cells of the first row').toBe(cells.length);
});

test('the table has two rows of expenses', () => {
  expect(dataRows().length, 'rows with <td> cells').toBeGreaterThanOrEqual(2);
});

test('every expense row has a cell for each column', () => {
  const columns = screen.$('table tr')?.children.length ?? 0;
  expect(dataRows().length, 'rows with <td> cells').toBeGreaterThan(0);
  for (const row of dataRows()) expect(row.children.length, 'cells in an expense row').toBe(columns);
});
