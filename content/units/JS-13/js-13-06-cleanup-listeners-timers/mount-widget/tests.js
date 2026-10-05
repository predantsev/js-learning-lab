const ready = () => expect(typeof scope.mountWidget, 'type of mountWidget').toBe('function');

// Records every interval the widget starts and every id it clears; the callbacks never run.
function watchTimers() {
  const created = [];
  const cleared = [];
  const realSet = window.setInterval;
  const realClear = window.clearInterval;
  window.setInterval = () => {
    const id = realSet(() => {}, 1000000);
    created.push(id);
    return id;
  };
  window.clearInterval = (id) => {
    cleared.push(id);
    realClear(id);
  };
  return { created, cleared, restore() { window.setInterval = realSet; window.clearInterval = realClear; } };
}

function newRoot() {
  const root = document.createElement('div');
  document.body.append(root);
  return root;
}
const draw = (text) => (element) => { element.textContent = text; };
const resize = () => window.dispatchEvent(new Event('resize'));

test('the program prints the clean message and the render error', () => {
  expect(logs(), 'the console of the program').toEqual([L.clean, L.broken]);
});

test('while mounted, resize and click update the widget and one timer runs', () => {
  ready();
  const timers = watchTimers();
  try {
    const root = newRoot();
    const teardown = scope.mountWidget(root, draw('A'));
    expect(root.textContent, 'the content after render').toBe('A');
    root.dataset.width = 'before';
    resize();
    expect(root.dataset.width, 'data-width after a resize').toBe(String(window.innerWidth));
    root.click();
    expect(root.dataset.clicks, 'data-clicks after one click').toBe('1');
    expect(timers.created.length, 'intervals started by mountWidget').toBe(1);
    teardown();
  } finally {
    timers.restore();
  }
});

test('teardown removes both listeners', () => {
  ready();
  const root = newRoot();
  const teardown = scope.mountWidget(root, draw('A'));
  teardown();
  root.dataset.width = 'before';
  resize();
  expect(root.dataset.width, 'data-width after a resize that came after teardown').toBe('before');
  root.click();
  expect(root.dataset.clicks, 'data-clicks after a click that came after teardown').toBe('0');
});

test('teardown stops the timer', () => {
  ready();
  const timers = watchTimers();
  try {
    const teardown = scope.mountWidget(newRoot(), draw('A'));
    teardown();
    expect(timers.created.length, 'intervals started').toBe(1);
    expect(timers.cleared, 'ids passed to clearInterval').toContain(timers.created[0]);
  } finally {
    timers.restore();
  }
});

test('teardown empties root', () => {
  ready();
  const root = newRoot();
  const teardown = scope.mountWidget(root, draw('A'));
  teardown();
  expect(root.textContent, 'the content after teardown').toBe('');
});

test('teardown can be called twice without an error', () => {
  ready();
  const teardown = scope.mountWidget(newRoot(), draw('A'));
  teardown();
  expect(() => teardown(), 'the second teardown() call').not.toThrow();
});

test('a second teardown call does not touch a newer widget', () => {
  ready();
  const timers = watchTimers();
  try {
    const root = newRoot();
    const first = scope.mountWidget(root, draw('A'));
    first();
    const second = scope.mountWidget(root, draw('B'));
    const secondTimer = timers.created[1];
    first();
    expect(root.textContent, 'the content of the newer widget after the old teardown ran again').toBe('B');
    root.dataset.width = 'before';
    resize();
    expect(root.dataset.width, 'data-width of the newer widget after a resize').toBe(String(window.innerWidth));
    expect(timers.cleared.includes(secondTimer), 'the newer widget\'s timer was cleared').toBe(false);
    second();
  } finally {
    timers.restore();
  }
});

test('a failing render is cleaned up and its own error reaches the caller', () => {
  ready();
  const timers = watchTimers();
  try {
    const root = newRoot();
    const failure = new Error('render failed');
    let caught = null;
    try {
      scope.mountWidget(root, () => {
        throw failure;
      });
    } catch (error) {
      caught = error;
    }
    expect(caught, 'the error mountWidget threw').toBe(failure);
    root.dataset.width = 'before';
    resize();
    expect(root.dataset.width, 'data-width after a resize that came after the failure').toBe('before');
    root.click();
    expect(root.dataset.clicks, 'data-clicks after a click that came after the failure').toBe('0');
    // Starting the interval before render (and stopping it) or only after a successful render are both fine.
    expect(timers.created.length <= 1, `${timers.created.length} intervals started before the failure is at most 1`).toBe(true);
    if (timers.created.length === 1) {
      expect(timers.cleared, 'ids passed to clearInterval').toContain(timers.created[0]);
    }
  } finally {
    timers.restore();
  }
});
