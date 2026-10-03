const KINDS = ['offline', 'timeout', 'server', 'invalid'];

async function caseOf(kind) {
  return waitFor(() => screen.$(`[data-testid="case-${kind}"]`));
}
function buttonsIn(element) {
  return [...element.querySelectorAll('[role="button"]')].map((button) => ({ button, text: button.textContent.trim() }));
}
function counters(kind) {
  return screen.$(`[data-testid="counters-${kind}"]`).textContent;
}

test('no failure shows no banner', async () => {
  const none = await caseOf('none');
  expect(none.querySelector('[role="alert"]'), 'alert in the case without a failure').toBeNull();
  expect(buttonsIn(none).length, 'buttons in the case without a failure').toBe(0);
});

test('each failure kind shows its own message', async () => {
  for (const kind of KINDS) {
    const element = await caseOf(kind);
    expect(element.textContent, `text of the ${kind} case`).toContain(L[kind]);
    for (const other of KINDS.filter((k) => k !== kind)) {
      expect(element.textContent.includes(L[other]), `the ${kind} case also shows the ${other} message`).toBe(false);
    }
  }
});

test('timeout and server error offer Try again', async () => {
  for (const kind of ['timeout', 'server']) {
    const buttons = buttonsIn(await caseOf(kind));
    expect(buttons.map((b) => b.text), `buttons in the ${kind} case`).toEqual([L.retry]);
    await user.click(buttons[0].button);
    await waitFor(() => counters(kind).includes('retry: 1'));
    expect(counters(kind), `counters after pressing in the ${kind} case`).toContain('bundled: 0');
  }
});

test('offline and an invalid answer offer the bundled data instead of a retry', async () => {
  for (const kind of ['offline', 'invalid']) {
    const buttons = buttonsIn(await caseOf(kind));
    expect(buttons.map((b) => b.text), `buttons in the ${kind} case`).toEqual([L.useBundled]);
    await user.click(buttons[0].button);
    await waitFor(() => counters(kind).includes('bundled: 1'));
    expect(counters(kind), `counters after pressing in the ${kind} case`).toContain('retry: 0');
  }
});

test('the banner is announced as an alert', async () => {
  for (const kind of KINDS) {
    const element = await caseOf(kind);
    expect(element.querySelector('[role="alert"]'), `an element with role="alert" in the ${kind} case`).not.toBeNull();
  }
});
