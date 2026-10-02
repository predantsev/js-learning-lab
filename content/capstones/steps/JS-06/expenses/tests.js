// Checks of capstone step JS-06, expense tracker variant: the cards are built from the data, the
// labeled form adds and edits expenses with validateExpense's messages next to the fields (the
// amount field is in hryvnias and becomes whole kopiykas), delete asks for a confirmation first,
// and the starting list expenses never changes. The checks run one after another on the same
// page, like a person using it. Focus is not checked (it is unreliable in the hidden frame the
// checks run in); the task asks the learner to check it by keyboard.
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
/** Put a value into a field the way the page receives it (also for number and date fields). */
async function setValue(node, value) {
  node.focus();
  node.value = value;
  node.dispatchEvent(new Event('input', { bubbles: true }));
  node.dispatchEvent(new Event('change', { bubbles: true }));
  await settle();
}
/** The text of the elements a field names in aria-describedby. */
const describedText = (node) => (node?.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean).map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
const list = () => screen.$('#expenses');
const cards = () => [...(list()?.querySelectorAll('[data-id]') ?? [])];
const card = (id) => cards().find((node) => node.dataset.id === id) ?? null;
const buttonIn = (node, label, unless = null) => [...(node?.querySelectorAll('button') ?? [])].find((button) => inOrder(screen.nameOf(button), label) && !(unless !== null && inOrder(screen.nameOf(button), unless))) ?? null;
const amount = (hryvnias, kopiykas) => `${hryvnias}${L.decimalMark}${kopiykas}`;
const WORDS = () => ({ food: L.categoryFood, transport: L.categoryTransport, home: L.categoryHome, fun: L.categoryFun });
const fixtures = () => [
  { id: 'e-01', label: L.fixture1Name, amountMinor: 84550, date: '2026-03-01', category: 'food' },
  { id: 'e-02', label: L.fixture2Name, amountMinor: 52000, date: '2026-03-01', category: 'transport' },
  { id: 'e-03', label: L.fixture3Name, amountMinor: 18000, date: '2026-02-28', category: 'fun' },
  { id: 'e-04', label: L.fixture4Name, amountMinor: 9990, date: '2026-02-27', category: 'home' },
  { id: 'e-05', label: L.fixture5Name, amountMinor: 30000, date: '2026-02-27', category: 'fun' },
  { id: 'e-06', label: L.fixture6Name, amountMinor: 21050, date: '2026-03-02', category: 'food' },
];
const shown = (minor) => amount((minor - (minor % 100)) / 100, String(minor % 100).padStart(2, '0'));

test('the script runs without errors', () => {
  const error = loadError();
  expect(error === null ? null : `${error.name}: ${error.message}`, 'an error while the page was loading').toBeNull();
});

test('the form has labeled fields and a submit button', () => {
  expect(form(), 'a <form> on the page').toBeTruthy();
  for (const label of [L.nameLabel, L.valueLabel, L.dateFieldLabel, L.categoryFieldLabel]) {
    expect(field(label), `a form field labeled "${label}"`).toBeTruthy();
  }
  expect(field(L.dateFieldLabel).type, `the type of the field "${L.dateFieldLabel}"`).toBe('date');
  expect(field(L.categoryFieldLabel).tagName, `the element of the field "${L.categoryFieldLabel}"`).toBe('SELECT');
  expect(form().querySelector('button[type="submit"], button:not([type]), input[type="submit"]'), 'a submit button inside the form').toBeTruthy();
});

test('every expense is a card with its label, amount, date, category and named buttons', () => {
  expect(list(), 'the list with id="expenses"').toBeTruthy();
  expect(cards().length, 'cards with data-id in #expenses').toBe(6);
  for (const expense of fixtures()) {
    const node = card(expense.id);
    expect(node, `the card with data-id="${expense.id}"`).toBeTruthy();
    expect(inOrder(node.textContent, expense.label, shown(expense.amountMinor), L.currency), `the card ${expense.id} shows "${expense.label}", then ${shown(expense.amountMinor)} and "${L.currency}"`).toBe(true);
    expect(inOrder(node.textContent, expense.date) && inOrder(node.textContent, WORDS()[expense.category]), `the card ${expense.id} shows the date ${expense.date} and the category "${WORDS()[expense.category]}"`).toBe(true);
    for (const label of [L.editLabel, L.deleteLabel]) {
      const button = buttonIn(node, label);
      expect(button, `a "${label}" button in the card ${expense.id}`).toBeTruthy();
      expect(inOrder(screen.nameOf(button), expense.label), `the "${label}" button of ${expense.id} also names "${expense.label}"`).toBe(true);
    }
  }
});

test('an invalid draft shows messages next to its fields and adds nothing', async () => {
  const before = cards().length;
  await setValue(field(L.nameLabel), '');
  await setValue(field(L.valueLabel), '0');
  await setValue(field(L.categoryFieldLabel), '');
  const { prevented } = await user.submit(form());
  expect(prevented, 'the form submit is prevented').toBe(true);
  expect(cards().length, 'the number of cards after submitting an invalid draft').toBe(before);
  expect(inOrder(describedText(field(L.nameLabel)), L.labelRequiredMessage), `"${L.labelRequiredMessage}" in the element the label field names in aria-describedby`).toBe(true);
  expect(inOrder(describedText(field(L.valueLabel)), L.invalidMessage), `"${L.invalidMessage}" in the element the amount field names in aria-describedby`).toBe(true);
  expect(inOrder(describedText(field(L.categoryFieldLabel)), L.requiredMessage), `"${L.requiredMessage}" in the element the category field names in aria-describedby`).toBe(true);
});

test('a valid draft adds a card, clears the form and the messages and updates the totals', async () => {
  const before = cards().length;
  await setValue(field(L.nameLabel), L.newName);
  await setValue(field(L.valueLabel), '19.99');
  await setValue(field(L.dateFieldLabel), '2026-03-02');
  await setValue(field(L.categoryFieldLabel), 'transport');
  const { prevented } = await user.submit(form());
  expect(prevented, 'the form submit is prevented').toBe(true);
  expect(cards().length, 'the number of cards after adding an expense').toBe(before + 1);
  expect(cards().some((node) => inOrder(node.textContent, L.newName, amount(19, '99'))), `a card with "${L.newName}" and ${amount(19, '99')} (19.99 is 1999 kopiykas)`).toBe(true);
  expect(field(L.nameLabel).value, 'the label field after adding').toBe('');
  expect(inOrder(describedText(field(L.nameLabel)), L.labelRequiredMessage) || inOrder(describedText(field(L.valueLabel)), L.invalidMessage), 'an old error message is still shown').toBe(false);
  expect([...(screen.$('main')?.querySelectorAll('*') ?? [])].some((node) => inOrder(node.textContent, L.totalLabel, amount(2175, '89'))), `"${L.totalLabel}" with ${amount(2175, '89')} (2155.90 + 19.99) on the page`).toBe(true);
});

test('a label with markup stays text', async () => {
  const before = cards().length;
  await setValue(field(L.nameLabel), '<b>Bold</b>');
  await setValue(field(L.valueLabel), '5');
  await setValue(field(L.dateFieldLabel), '2026-03-03');
  await setValue(field(L.categoryFieldLabel), 'fun');
  await user.submit(form());
  expect(cards().length, 'the number of cards after adding an expense').toBe(before + 1);
  const added = cards().find((node) => node.textContent.includes('<b>Bold</b>'));
  expect(added, 'a card whose text shows "<b>Bold</b>" literally').toBeTruthy();
  expect(inOrder(added.textContent, amount(5, '00')), `${amount(5, '00')} in that card`).toBe(true);
  expect(list().querySelector('b'), 'a <b> element made from the label').toBeNull();
});

test('Edit fills the form and saving changes only that expense', async () => {
  const before = cards().length;
  await user.click(buttonIn(card('e-02'), L.editLabel));
  expect(field(L.nameLabel).value, 'the label field after Edit of e-02').toBe(L.fixture2Name);
  expect(Number(field(L.valueLabel).value), 'the amount field after Edit of e-02, as a number').toBe(520);
  expect(field(L.dateFieldLabel).value, 'the date field after Edit of e-02').toBe('2026-03-01');
  expect(field(L.categoryFieldLabel).value, 'the category field after Edit of e-02').toBe('transport');
  await setValue(field(L.valueLabel), '530.50');
  await setValue(field(L.categoryFieldLabel), 'food');
  await user.submit(form());
  expect(cards().length, 'the number of cards after saving an edit').toBe(before);
  expect(inOrder(card('e-02')?.textContent, L.fixture2Name, amount(530, '50')), `the card e-02 shows "${L.fixture2Name}" and ${amount(530, '50')}`).toBe(true);
  expect(inOrder(card('e-02')?.textContent, L.categoryFood), `the card e-02 shows the category "${L.categoryFood}"`).toBe(true);
  expect(cards().filter((node) => inOrder(node.textContent, L.fixture2Name)).length, `cards showing "${L.fixture2Name}"`).toBe(1);
  expect(inOrder(card('e-01')?.textContent, amount(845, '50')), `the card e-01 still shows ${amount(845, '50')}`).toBe(true);
});

test('Delete asks for confirmation and Cancel keeps the expense', async () => {
  const before = cards().length;
  await user.click(buttonIn(card('e-03'), L.deleteLabel, L.confirmDeleteLabel));
  expect(card('e-03'), 'the card e-03 right after Delete').toBeTruthy();
  expect(buttonIn(card('e-03'), L.confirmDeleteLabel), `a "${L.confirmDeleteLabel}" button in the card e-03`).toBeTruthy();
  await user.click(buttonIn(card('e-03'), L.cancelLabel));
  expect(card('e-03'), 'the card e-03 after Cancel').toBeTruthy();
  expect(buttonIn(card('e-03'), L.confirmDeleteLabel), `the "${L.confirmDeleteLabel}" button after Cancel`).toBeNull();
  expect(cards().length, 'the number of cards after Cancel').toBe(before);
});

test('confirming the delete removes only that expense', async () => {
  const before = cards().length;
  await user.click(buttonIn(card('e-03'), L.deleteLabel, L.confirmDeleteLabel));
  await user.click(buttonIn(card('e-03'), L.confirmDeleteLabel));
  expect(card('e-03'), 'the card e-03 after the confirmed delete').toBeNull();
  expect(cards().length, 'the number of cards after the confirmed delete').toBe(before - 1);
  expect(card('e-02') !== null && card('e-04') !== null, 'the cards e-02 and e-04').toBe(true);
});

test('expenses stays the starting list', () => {
  expect(scope.expenses, 'the list expenses after adding, editing and deleting on the page').toEqual(fixtures());
});
