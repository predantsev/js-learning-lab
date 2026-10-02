const list = () => screen.$('#tasks');
const item = (id) => screen.$(`#tasks li[data-id="${id}"]`);
const buttonOf = (id, action) => item(id)?.querySelector(`button[data-action="${action}"]`);
const status = () => screen.$('#status').textContent.trim();
// Collects the errors thrown by listeners while `action` runs.
async function errorsDuring(action) {
  const errors = [];
  const onError = (event) => errors.push(event.error?.name ?? 'Error');
  window.addEventListener('error', onError);
  try {
    await action();
  } finally {
    window.removeEventListener('error', onError);
  }
  return errors;
}

test('clicking the delete icon removes only that task', async () => {
  await user.click(buttonOf('t-02', 'delete').querySelector('span'));
  expect(item('t-02'), 'the task t-02').toBeNull();
  expect(item('t-01'), 'the task t-01').toBeInTheDocument();
  expect(item('t-03'), 'the task t-03').toBeInTheDocument();
  expect(status(), 'text of #status').toBe(`${L.deleted} ${L.task2}`);
});

test('clicking edit reports that task and keeps it', async () => {
  await user.click(buttonOf('t-03', 'edit'));
  expect(status(), 'text of #status').toBe(`${L.editing} ${L.task3}`);
  expect(item('t-03'), 'the task t-03').toBeInTheDocument();
});

test('a task added later works with the same listener', async () => {
  const extra = document.createElement('li');
  extra.dataset.id = 't-09';
  extra.innerHTML = `<span class="title">${L.task9}</span> <button type="button" data-action="delete"><span aria-hidden="true">✕</span> ${L.delete}</button>`;
  list().append(extra);
  await user.click(extra.querySelector('button span'));
  expect(item('t-09'), 'the task added after the program ran').toBeNull();
});

test('clicks outside the buttons change nothing', async () => {
  const before = screen.$$('#tasks li').length;
  const statusBefore = status();
  const errors = await errorsDuring(async () => {
    await user.click(item('t-01').querySelector('.title'));
    await user.click(item('t-01'));
    await user.click(list());
  });
  expect(errors, 'errors thrown while clicking a title, a card and the list').toEqual([]);
  expect(screen.$$('#tasks li').length, 'number of tasks').toBe(before);
  expect(status(), 'text of #status').toBe(statusBefore);
});
