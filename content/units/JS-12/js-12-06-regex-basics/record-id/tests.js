const check = (id, expected) => expect(scope.isValidId(id), `isValidId(${JSON.stringify(id)})`).toBe(expected);

test('accepts ids of the right shape', () => {
  for (const id of ['w-01', 't-15', 'e-00', 'h-99']) check(id, true);
});

test('rejects text before or after the id', () => {
  for (const id of ['xw-01', 'w-01x', ' w-01', 'w-01 ', 'id: w-01']) check(id, false);
});

test('rejects the wrong number of digits', () => {
  for (const id of ['w-1', 'w-001', 'w-']) check(id, false);
});

test('rejects anything but one lowercase letter a–z at the start', () => {
  for (const id of ['W-01', '1-01', '_-01', 'ww-01', 'ї-01', '-01']) check(id, false);
});

test('rejects a missing hyphen', () => {
  for (const id of ['w01', 'w_01', 'w—01']) check(id, false);
});
