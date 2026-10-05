const where = (cwd, target) => {
  expect(typeof scope.whereItActs, 'whereItActs').toBe('function');
  return scope.whereItActs(cwd, target);
};

test('a plain name lands inside the working directory', () => {
  expect(where('/home/you/course', 'notes.txt'), 'whereItActs("/home/you/course", "notes.txt")').toBe('/home/you/course/notes.txt');
  expect(where('/home/you/course', 'old/a.txt'), 'whereItActs("/home/you/course", "old/a.txt")').toBe('/home/you/course/old/a.txt');
});

test('one .. goes up exactly one folder', () => {
  expect(where('/home/you/course/scratch', '../notes.txt'), 'whereItActs("/home/you/course/scratch", "../notes.txt")').toBe('/home/you/course/notes.txt');
});

test('several .. go up several folders', () => {
  expect(where('/home/you/course/scratch/old', '../../x.txt'), 'whereItActs("/home/you/course/scratch/old", "../../x.txt")').toBe('/home/you/course/x.txt');
  expect(where('/home/you/course/scratch', '../other/../y.txt'), 'whereItActs("/home/you/course/scratch", "../other/../y.txt")').toBe('/home/you/course/y.txt');
});

test('. and ./ mean the working directory itself', () => {
  expect(where('/home/you/course', './a.txt'), 'whereItActs("/home/you/course", "./a.txt")').toBe('/home/you/course/a.txt');
  expect(where('/home/you/course', '.'), 'whereItActs("/home/you/course", ".")').toBe('/home/you/course');
});

test('an absolute target ignores the working directory', () => {
  expect(where('/home/you/course', '/tmp/a.txt'), 'whereItActs("/home/you/course", "/tmp/a.txt")').toBe('/tmp/a.txt');
  expect(where('/home/you/course', '/etc/../tmp/b.txt'), 'whereItActs("/home/you/course", "/etc/../tmp/b.txt")').toBe('/tmp/b.txt');
});

test('.. at the root stays at the root', () => {
  expect(where('/', '../a.txt'), 'whereItActs("/", "../a.txt")').toBe('/a.txt');
  expect(where('/home', '../../..'), 'whereItActs("/home", "../../..")').toBe('/');
});
