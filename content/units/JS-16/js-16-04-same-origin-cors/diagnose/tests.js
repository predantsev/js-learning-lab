const CASES = ['habits', 'expenses'];

function diagnosis(name) {
  const all = scope.diagnoses;
  expect(typeof all, 'type of diagnoses').toBe('object');
  expect(typeof all[name], `type of diagnoses.${name}`).toBe('object');
  return all[name];
}

test('names the page origin and the target origin of both cases', () => {
  expect(diagnosis('habits').pageOrigin, 'diagnoses.habits.pageOrigin').toBe('http://127.0.0.1:5173');
  expect(diagnosis('habits').targetOrigin, 'diagnoses.habits.targetOrigin').toBe('http://127.0.0.1:8080');
  expect(diagnosis('expenses').pageOrigin, 'diagnoses.expenses.pageOrigin').toBe('http://127.0.0.1:5173');
  expect(diagnosis('expenses').targetOrigin, 'diagnoses.expenses.targetOrigin').toBe('http://127.0.0.1:3000');
});

test('says which request needed a preflight', () => {
  expect(diagnosis('habits').preflightNeeded, 'diagnoses.habits.preflightNeeded').toBe(false);
  expect(diagnosis('expenses').preflightNeeded, 'diagnoses.expenses.preflightNeeded').toBe(true);
});

test('names the missing response header of each case', () => {
  expect(String(diagnosis('habits').missingHeader).toLowerCase(), 'diagnoses.habits.missingHeader').toBe('access-control-allow-origin');
  expect(String(diagnosis('expenses').missingHeader).toLowerCase(), 'diagnoses.expenses.missingHeader').toBe('access-control-allow-headers');
});

test('reads from the server log whether the request itself arrived', () => {
  expect(diagnosis('habits').requestReachedServer, 'diagnoses.habits.requestReachedServer').toBe(true);
  expect(diagnosis('expenses').requestReachedServer, 'diagnoses.expenses.requestReachedServer').toBe(false);
});

test('puts the fix where CORS is decided', () => {
  for (const name of CASES) {
    expect(diagnosis(name).fixedIn, `diagnoses.${name}.fixedIn`).toBe('server');
  }
});
