import { history } from './history';

const heading = () => screen.$('#root h1')?.textContent ?? '(no heading)';
const entryCount = () => history.getState().entries.length;
async function openAt(path) {
  history.push(path);
  await settle();
}
const navLink = (name) => screen.allByRole('link').find((link) => link.textContent.trim() === name);

test('/items shows the wish list', async () => {
  await openAt('/items');
  expect(heading(), 'heading at /items').toBe(L.wishes);
});

test('/about shows the About screen', async () => {
  await openAt('/about');
  expect(heading(), 'heading at /about').toBe(L.about);
});

test('any other path shows the not-found screen', async () => {
  await openAt('/wishes/old');
  expect(heading(), 'heading at /wishes/old').toBe(L.notFound);
  await openAt('/');
  expect(heading(), 'heading at /').toBe(L.notFound);
});

test('the navigation has real links to /items and /about', async () => {
  await openAt('/items');
  const wishes = navLink(L.wishes);
  const about = navLink(L.about);
  expect(wishes, `a link with the text "${L.wishes}"`).toBeDefined();
  expect(about, `a link with the text "${L.about}"`).toBeDefined();
  expect(wishes.tagName, 'element of the wishes link').toBe('A');
  expect(wishes, 'the wishes link').toHaveAttribute('href', '/items');
  expect(about, 'the about link').toHaveAttribute('href', '/about');
});

test('clicking About changes the screen and adds one history entry', async () => {
  await openAt('/items');
  const before = entryCount();
  const about = navLink(L.about);
  expect(about, `a link with the text "${L.about}"`).toBeDefined();
  await user.click(about);
  await settle();
  expect(heading(), 'heading after clicking the about link').toBe(L.about);
  expect(entryCount(), 'history entries after one click').toBe(before + 1);
  const wishes = navLink(L.wishes);
  await user.click(wishes);
  await settle();
  expect(heading(), 'heading after clicking the wishes link').toBe(L.wishes);
});
