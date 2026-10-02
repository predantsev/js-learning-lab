const clickAfterWiring = () => {
  const store = new scope.NoteStore();
  const button = document.createElement('button');
  scope.wireSaveButton(store, button);
  return { store, button };
};

test('clicking the button marks the store as saved', () => {
  expect(typeof scope.wireSaveButton, 'type of wireSaveButton').toBe('function');
  const { store, button } = clickAfterWiring();
  button.click();
  expect(store.saved, 'store.saved after one click').toBe(true);
  expect(button.saved, 'a field saved on the button itself').toBeUndefined();
});

test('wiring the button saves nothing until the click', () => {
  expect(typeof scope.wireSaveButton, 'type of wireSaveButton').toBe('function');
  const { store } = clickAfterWiring();
  expect(store.saved, 'store.saved right after wireSaveButton, before any click').toBe(false);
});

test('start makes the poller tick once, 10 ms later, on itself', async () => {
  expect(typeof scope.Poller, 'type of Poller').toBe('function');
  const poller = new scope.Poller();
  poller.start();
  expect(poller.ticks, 'poller.ticks right after start').toBe(0);
  await sleep(80);
  expect(poller.ticks, 'poller.ticks 80 ms after start').toBe(1);
});

test('each basket keeps its own tags', () => {
  expect(typeof scope.Basket, 'type of Basket').toBe('function');
  const a = new scope.Basket(L.lamp);
  const b = new scope.Basket(L.mug);
  a.addTag(L.gift);
  a.addTag(L.sale);
  expect(a.tags, 'the tags of the first basket after two addTag calls').toEqual([L.gift, L.sale]);
  expect(b.tags, 'the tags of another basket').toEqual([]);
});

test('createBasket returns a new Basket with the given name', () => {
  expect(typeof scope.createBasket, 'type of createBasket').toBe('function');
  const basket = scope.createBasket(L.tickets);
  expect(basket, 'the result of createBasket').toBeInstanceOf(scope.Basket);
  expect(basket.name, 'the name of the created basket').toBe(L.tickets);
});

test('the store still keeps notes and can be marked saved directly', () => {
  expect(typeof scope.NoteStore, 'type of NoteStore').toBe('function');
  const store = new scope.NoteStore();
  store.add('a');
  store.add('b');
  expect(store.notes, 'the notes of the store').toEqual(['a', 'b']);
  store.markSaved();
  expect(store.saved, 'store.saved after store.markSaved()').toBe(true);
});
