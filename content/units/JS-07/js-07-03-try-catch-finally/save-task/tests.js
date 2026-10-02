// Every check starts from a clean state object, so earlier calls do not leak into it.
const fresh = () => {
  scope.state.saving = false;
  scope.state.message = '';
};

const thrownBy = (fn) => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  return null;
};

test('returns true and reports success when the store accepts the task', () => {
  fresh();
  const store = spy();
  const task = { id: 't-05', title: L.dentist };
  expect(scope.saveTask(task, store), 'the value saveTask returns').toBe(true);
  expect(store, 'the store function').toHaveBeenCalledWith(task);
  expect(scope.state.message, 'state.message').toBe(L.saved);
});

test('the saving flag is on while the store works', () => {
  fresh();
  let seen = null;
  scope.saveTask({ title: L.water }, () => {
    seen = scope.state.saving;
  });
  expect(seen, 'state.saving while the store runs').toBe(true);
});

test('the saving flag is off after a success', () => {
  fresh();
  scope.saveTask({ title: L.water }, () => {});
  expect(scope.state.saving, 'state.saving after a success').toBe(false);
});

test('a RangeError becomes a message, not an error', () => {
  fresh();
  let result;
  const thrown = thrownBy(() => {
    result = scope.saveTask({ title: L.books }, () => {
      throw new RangeError('the planner is full');
    });
  });
  expect(thrown, 'what saveTask threw').toBeNull();
  expect(result, 'the value saveTask returns').toBe(false);
  expect(scope.state.message, 'state.message').toBe(L.full);
});

test('the saving flag is off after a RangeError', () => {
  fresh();
  thrownBy(() => scope.saveTask({ title: L.books }, () => {
    throw new RangeError('the planner is full');
  }));
  expect(scope.state.saving, 'state.saving after a RangeError').toBe(false);
});

test('any other error goes further', () => {
  fresh();
  const problem = new TypeError('task.title must be text');
  const thrown = thrownBy(() => scope.saveTask({ title: 42 }, () => {
    throw problem;
  }));
  expect(thrown, 'what saveTask threw').not.toBeNull();
  expect(thrown === problem || thrown?.cause === problem, 'saveTask throws the same error, or a new one with it as the cause').toBe(true);
});

test('the saving flag is off even when the error goes further', () => {
  fresh();
  thrownBy(() => scope.saveTask({ title: 42 }, () => {
    throw new TypeError('task.title must be text');
  }));
  expect(scope.state.saving, 'state.saving after the error went further').toBe(false);
});
