import { history } from './history';

const detailHeading = () => screen.$('#root main h2')?.textContent ?? '(no heading in <main>)';
const mainText = () => screen.$('#root main')?.textContent ?? '';
async function openAt(path) {
  history.push(path);
  await settle();
}

test('/tasks/t-02 shows that task', async () => {
  await openAt('/tasks/t-02');
  expect(detailHeading(), 'heading at /tasks/t-02').toBe(L.library);
  expect(mainText(), 'details at /tasks/t-02').toContain('2026-03-01');
});

test('/tasks/t-05 shows that task', async () => {
  await openAt('/tasks/t-05');
  expect(detailHeading(), 'heading at /tasks/t-05').toBe(L.dentist);
});

test('an unknown id shows the not-found state with that id', async () => {
  await openAt('/tasks/t-99');
  expect(detailHeading(), 'heading at /tasks/t-99').toBe(L.notFound);
  expect(screen.$('#root main code')?.textContent, 'id shown in the not-found state').toBe('t-99');
});

test('an encoded id is decoded and still not found', async () => {
  await openAt('/tasks/t%2001');
  expect(detailHeading(), 'heading at /tasks/t%2001').toBe(L.notFound);
  expect(screen.$('#root main code')?.textContent, 'id shown in the not-found state').toBe('t 01');
});

test('clicking another task in the list shows that task', async () => {
  await openAt('/tasks/t-01');
  expect(detailHeading(), 'heading at /tasks/t-01').toBe(L.plants);
  const link = screen.allByRole('link').find((a) => a.textContent === L.grandma);
  await user.click(link);
  await settle();
  expect(detailHeading(), 'heading after clicking the third task').toBe(L.grandma);
  expect(mainText(), 'due date of a task without one').toContain(L.noDue);
});
