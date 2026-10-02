// Render a copy of the page in a frame of the given width (a window of its own) and report
// whether the page needs horizontal scrolling there.
function overflowsAt(width) {
  return new Promise((resolve, reject) => {
    const frame = document.createElement('iframe');
    frame.style.cssText = `position:absolute;left:-10000px;top:0;border:0;width:${width}px;height:700px`;
    const copy = document.documentElement.cloneNode(true);
    copy.querySelectorAll('script, iframe').forEach((node) => node.remove());
    const probe = `<script>addEventListener('load', () => {
      parent.postMessage({ jsllProbe: true, overflow: document.documentElement.scrollWidth > innerWidth }, '*');
    });<\/script>`;
    frame.srcdoc = `<!doctype html>${copy.outerHTML.replace('</body>', `${probe}</body>`)}`;
    const timer = setTimeout(() => finish(new Error('the measuring frame did not answer')), 3000);
    function onMessage(event) {
      if (event.source === frame.contentWindow && event.data && event.data.jsllProbe) finish(null, event.data.overflow);
    }
    function finish(error, overflow) {
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      frame.remove();
      if (error) reject(error);
      else resolve(overflow);
    }
    window.addEventListener('message', onMessage);
    document.body.append(frame);
  });
}

const cards = () => screen.$$('#expenses li');
const deleteButtonOf = (card) => card.querySelector('button');

async function addExpense(what, amount) {
  await user.fill(screen.$('#what'), what);
  await user.fill(screen.$('#amount'), String(amount));
  await user.submit(screen.$('#expense-form'));
}

test('one click on Delete removes one expense and counts one deletion', async () => {
  const before = cards().length;
  const counted = Number(screen.$('#deleted-count').textContent);
  await user.click(deleteButtonOf(cards()[0]));
  expect(cards(), 'the cards after one click on Delete').toHaveLength(before - 1);
  expect(screen.$('#deleted-count'), 'the deleted counter after one click on Delete').toHaveTextContent(String(counted + 1));
});

test('adding two expenses in a row adds exactly two cards', async () => {
  const before = cards().length;
  await addExpense(L.lunch, 180);
  await addExpense(L.taxi, 120);
  expect(cards(), 'the cards after two submits').toHaveLength(before + 2);
  expect(cards().at(-1), 'the last card').toHaveTextContent(L.taxi);
});

test('after a delete the focus moves to the next Delete button', async () => {
  const list = cards();
  expect(list.length >= 2, 'at least two cards to delete from').toBe(true);
  const nextId = list[1].dataset.id;
  const button = deleteButtonOf(list[0]);
  button.focus();
  await user.press('Enter', button);
  const next = screen.$(`#expenses li[data-id="${nextId}"] button`);
  expect(next, 'the Delete button of the card after the deleted one').toHaveFocus();
});

test('the amount field has a label', () => {
  expect(screen.nameOf(screen.$('#amount')), 'the accessible name of the amount field').toBeTruthy();
});

test('an expense over the budget gets the warning background', async () => {
  await addExpense(L.laptop, 25000);
  const card = cards().find((item) => item.textContent.includes(L.laptop));
  expect(card, 'the card of the new expense over the budget').toBeTruthy();
  expect(card, 'the card of the new expense over the budget').toHaveClass('over-budget');
  expect(getComputedStyle(card).backgroundColor, 'the background color of that card').toBe('rgb(254, 215, 215)');
});

test('the cards fit a 320px wide window without horizontal scrolling', async () => {
  expect(cards().length > 0, 'cards on the page').toBe(true);
  expect(await overflowsAt(320), 'horizontal scrolling at 320px').toBe(false);
});

test('Clear all is a button and empties the list', async () => {
  const clear = screen.$('#clear');
  expect(clear.tagName, 'the element #clear').toBe('BUTTON');
  expect(clear.getAttribute('type'), 'the type attribute of #clear').toBe('button');
  await user.click(clear);
  expect(cards(), 'the cards after Clear all').toHaveLength(0);
});
