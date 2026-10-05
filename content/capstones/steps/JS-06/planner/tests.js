// Checks of capstone step JS-06, planner variant: the cards are built from the data, the labeled
// form adds and edits tasks with validateTask's messages next to the fields, delete asks for a
// confirmation first, and the starting list tasks never changes. The checks run one after another
// on the same page, like a person using it. Focus is not checked (it is unreliable in the hidden
// frame the checks run in); the task asks the learner to check it by keyboard.
const norm = (text) => String(text ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
/** `text` contains every part, in this order (case and extra spaces do not matter). */
function inOrder(text, ...parts) {
  const t = norm(text);
  let from = 0;
  for (const part of parts.map(norm)) {
    const at = t.indexOf(part, from);
    if (at < 0) return false;
    from = at + part.length;
  }
  return true;
}
const form = () => screen.$('form');
/** The form field whose label contains `label`. */
const field = (label) => [...(form()?.querySelectorAll('input, select, textarea') ?? [])].find((node) => inOrder(screen.nameOf(node), label)) ?? null;
/** Put a value into a field the way the page receives it (also for date fields and selects). */
async function setValue(node, value) {
  node.focus();
  node.value = value;
  node.dispatchEvent(new Event('input', { bubbles: true }));
  node.dispatchEvent(new Event('change', { bubbles: true }));
  await settle();
}
/** The text of the elements a field names in aria-describedby. */
const describedText = (node) => (node?.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean).map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
const list = () => screen.$('#tasks');
const cards = () => [...(list()?.querySelectorAll('[data-id]') ?? [])];
const card = (id) => cards().find((node) => node.dataset.id === id) ?? null;
const buttonIn = (node, label, unless = null) => [...(node?.querySelectorAll('button') ?? [])].find((button) => inOrder(screen.nameOf(button), label) && !(unless !== null && inOrder(screen.nameOf(button), unless))) ?? null;
const PRIORITY_WORDS = () => ({ low: L.priorityLow, normal: L.priorityNormal, high: L.priorityHigh });
const fixtures = () => [
  { id: 't-01', title: L.fixture1Name, dueDate: '2026-03-02', done: false, priority: 'normal' },
  { id: 't-02', title: L.fixture2Name, dueDate: '2026-03-01', done: false, priority: 'high' },
  { id: 't-03', title: L.fixture3Name, dueDate: null, done: false, priority: 'low' },
  { id: 't-04', title: L.fixture4Name, dueDate: '2026-02-27', done: true, priority: 'high' },
  { id: 't-05', title: L.fixture5Name, dueDate: '2026-03-10', done: false, priority: 'normal' },
  { id: 't-06', title: L.fixture6Name, dueDate: '2026-03-05', done: true, priority: 'low' },
];

test('the script runs without errors', () => {
  const error = loadError();
  expect(error === null ? null : `${error.name}: ${error.message}`, 'an error while the page was loading').toBeNull();
});

test('the form has labeled fields and a submit button', () => {
  expect(form(), 'a <form> on the page').toBeTruthy();
  for (const label of [L.nameLabel, L.valueLabel, L.priorityFieldLabel, L.doneFieldLabel]) {
    expect(field(label), `a form field labeled "${label}"`).toBeTruthy();
  }
  expect(field(L.valueLabel).type, `the type of the field "${L.valueLabel}"`).toBe('date');
  expect(field(L.priorityFieldLabel).tagName, `the element of the field "${L.priorityFieldLabel}"`).toBe('SELECT');
  expect(field(L.doneFieldLabel).type, `the type of the field "${L.doneFieldLabel}"`).toBe('checkbox');
  expect(form().querySelector('button[type="submit"], button:not([type]), input[type="submit"]'), 'a submit button inside the form').toBeTruthy();
});

test('every task is a card with its title, due date, priority, state and named buttons', () => {
  expect(list(), 'the list with id="tasks"').toBeTruthy();
  expect(cards().length, 'cards with data-id in #tasks').toBe(6);
  for (const task of fixtures()) {
    const node = card(task.id);
    expect(node, `the card with data-id="${task.id}"`).toBeTruthy();
    expect(inOrder(node.textContent, task.title, task.dueDate ?? L.noDueDate), `the card ${task.id} shows "${task.title}" and then "${task.dueDate ?? L.noDueDate}"`).toBe(true);
    expect(inOrder(node.textContent, PRIORITY_WORDS()[task.priority]), `the card ${task.id} shows the priority "${PRIORITY_WORDS()[task.priority]}"`).toBe(true);
    expect(inOrder(node.textContent, L.doneMark), `the card ${task.id} has the mark "${L.doneMark}"`).toBe(task.done);
    for (const label of [L.editLabel, L.deleteLabel]) {
      const button = buttonIn(node, label);
      expect(button, `a "${label}" button in the card ${task.id}`).toBeTruthy();
      expect(inOrder(screen.nameOf(button), task.title), `the "${label}" button of ${task.id} also names "${task.title}"`).toBe(true);
    }
  }
});

test('an invalid draft shows messages next to its fields and adds nothing', async () => {
  const before = cards().length;
  await setValue(field(L.nameLabel), '');
  const first = await user.submit(form());
  expect(first.prevented, 'the form submit is prevented').toBe(true);
  expect(inOrder(describedText(field(L.nameLabel)), L.requiredMessage), `"${L.requiredMessage}" in the element the title field names in aria-describedby`).toBe(true);
  await setValue(field(L.nameLabel), 'x'.repeat(81));
  await user.submit(form());
  expect(inOrder(describedText(field(L.nameLabel)), L.tooLongMessage), `"${L.tooLongMessage}" for a title of 81 characters`).toBe(true);
  expect(cards().length, 'the number of cards after submitting invalid drafts').toBe(before);
});

test('a valid draft adds a card, clears the form and the messages and updates the summary', async () => {
  const before = cards().length;
  await setValue(field(L.nameLabel), L.newName);
  await setValue(field(L.valueLabel), '2026-03-01');
  await setValue(field(L.priorityFieldLabel), 'high');
  const { prevented } = await user.submit(form());
  expect(prevented, 'the form submit is prevented').toBe(true);
  expect(cards().length, 'the number of cards after adding a task').toBe(before + 1);
  expect(cards().some((node) => inOrder(node.textContent, L.newName, '2026-03-01', L.priorityHigh)), `a card with "${L.newName}", 2026-03-01 and "${L.priorityHigh}"`).toBe(true);
  expect(field(L.nameLabel).value, 'the title field after adding').toBe('');
  expect(inOrder(describedText(field(L.nameLabel)), L.requiredMessage) || inOrder(describedText(field(L.nameLabel)), L.tooLongMessage), 'an old error message is still shown').toBe(false);
  expect([...(screen.$('main')?.querySelectorAll('*') ?? [])].some((node) => inOrder(node.textContent, L.dueSummary, '2026-03-02', '3')), `"${L.dueSummary} 2026-03-02" with 3 (one more task due) on the page`).toBe(true);
});

test('a task without a due date shows the no-due-date text, and a title with markup stays text', async () => {
  const before = cards().length;
  await setValue(field(L.nameLabel), '<b>Bold</b>');
  await setValue(field(L.valueLabel), '');
  await user.submit(form());
  expect(cards().length, 'the number of cards after adding a task without a due date').toBe(before + 1);
  const added = cards().find((node) => node.textContent.includes('<b>Bold</b>'));
  expect(added, 'a card whose text shows "<b>Bold</b>" literally').toBeTruthy();
  expect(inOrder(added.textContent, L.noDueDate), `"${L.noDueDate}" in that card (an empty date field means no due date)`).toBe(true);
  expect(list().querySelector('b'), 'a <b> element made from the title').toBeNull();
});

test('a new task keeps the done box', async () => {
  const before = cards().length;
  await setValue(field(L.nameLabel), 'Sort the mail');
  await user.check(field(L.doneFieldLabel), true);
  await user.submit(form());
  expect(cards().length, 'the number of cards after adding a task with the done box ticked').toBe(before + 1);
  const added = cards().find((node) => inOrder(node.textContent, 'Sort the mail'));
  expect(added, 'a card with "Sort the mail"').toBeTruthy();
  expect(inOrder(added.textContent, L.doneMark), `the mark "${L.doneMark}" in that card`).toBe(true);
});

test('Edit fills the form and saving changes only that task', async () => {
  const before = cards().length;
  await user.click(buttonIn(card('t-02'), L.editLabel));
  expect(field(L.nameLabel).value, 'the title field after Edit of t-02').toBe(L.fixture2Name);
  expect(field(L.valueLabel).value, 'the due date field after Edit of t-02').toBe('2026-03-01');
  await setValue(field(L.priorityFieldLabel), 'low');
  await user.check(field(L.doneFieldLabel), true);
  await user.submit(form());
  expect(cards().length, 'the number of cards after saving an edit').toBe(before);
  expect(inOrder(card('t-02')?.textContent, L.fixture2Name, '2026-03-01', L.priorityLow), `the card t-02 shows "${L.fixture2Name}", 2026-03-01 and "${L.priorityLow}"`).toBe(true);
  expect(inOrder(card('t-02')?.textContent, L.doneMark), `the card t-02 has the mark "${L.doneMark}"`).toBe(true);
  expect(cards().filter((node) => inOrder(node.textContent, L.fixture2Name)).length, `cards showing "${L.fixture2Name}"`).toBe(1);
  expect(inOrder(card('t-01')?.textContent, L.doneMark), 'the card t-01 has no done mark').toBe(false);
});

test('Delete asks for confirmation and Cancel keeps the task', async () => {
  const before = cards().length;
  await user.click(buttonIn(card('t-03'), L.deleteLabel, L.confirmDeleteLabel));
  expect(card('t-03'), 'the card t-03 right after Delete').toBeTruthy();
  expect(buttonIn(card('t-03'), L.confirmDeleteLabel), `a "${L.confirmDeleteLabel}" button in the card t-03`).toBeTruthy();
  await user.click(buttonIn(card('t-03'), L.cancelLabel));
  expect(card('t-03'), 'the card t-03 after Cancel').toBeTruthy();
  expect(buttonIn(card('t-03'), L.confirmDeleteLabel), `the "${L.confirmDeleteLabel}" button after Cancel`).toBeNull();
  expect(cards().length, 'the number of cards after Cancel').toBe(before);
});

test('confirming the delete removes only that task', async () => {
  const before = cards().length;
  await user.click(buttonIn(card('t-03'), L.deleteLabel, L.confirmDeleteLabel));
  await user.click(buttonIn(card('t-03'), L.confirmDeleteLabel));
  expect(card('t-03'), 'the card t-03 after the confirmed delete').toBeNull();
  expect(cards().length, 'the number of cards after the confirmed delete').toBe(before - 1);
  expect(card('t-02') !== null && card('t-04') !== null, 'the cards t-02 and t-04').toBe(true);
});

test('tasks stays the starting list', () => {
  expect(scope.tasks, 'the list tasks after adding, editing and deleting on the page').toEqual(fixtures());
});
