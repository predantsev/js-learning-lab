import { blockedProps, rscNote } from './note.js';
import { wishTree } from './tree.js';

const fn = () => 0;
// A fresh tree inside the checks: planner tasks with props at several levels.
const plannerTree = () => ({
  name: 'TaskPage', kind: 'server', props: {}, children: [
    { name: 'TaskStats', kind: 'server', props: { sortBy: fn }, children: [] },
    {
      name: 'TaskBoard', kind: 'client', props: { tasks: [{ id: 't-01', title: L.water }], onSave: fn, today: '2026-03-01' }, children: [
        { name: 'TaskRow', kind: 'client', props: { onDone: fn }, children: [] },
      ],
    },
    {
      name: 'TaskSection', kind: 'server', props: {}, children: [
        { name: 'DueBadge', kind: 'client', props: { due: new Date('2026-03-02'), format: fn }, children: [] },
      ],
    },
  ],
});

function blocked(tree) {
  expect(typeof blockedProps, 'type of blockedProps').toBe('function');
  const result = blockedProps(tree);
  expect(Array.isArray(result), 'blockedProps returns an array').toBe(true);
  return result;
}

test('finds a function passed from a server to a client component', () => {
  expect(blocked(plannerTree()), 'blockedProps(plannerTree)').toContain('TaskPage → TaskBoard.onSave');
});

test('finds blocked props deeper in the tree', () => {
  expect(blocked(plannerTree()), 'blockedProps(plannerTree)').toContain('TaskSection → DueBadge.format');
});

test('ignores props between two client components', () => {
  expect(blocked(plannerTree()).some((line) => line.includes('TaskRow')), 'a TaskRow line').toBe(false);
});

test('ignores props between two server components', () => {
  expect(blocked(plannerTree()).some((line) => line.includes('TaskStats')), 'a TaskStats line').toBe(false);
});

test('lists exactly the blocked props in tree order', () => {
  expect(blocked(plannerTree()), 'blockedProps(plannerTree)').toEqual(['TaskPage → TaskBoard.onSave', 'TaskSection → DueBadge.format']);
});

test('the note cites the checker output for the wishlist tree', () => {
  expect(rscNote?.blockers, 'rscNote.blockers').toEqual(blocked(wishTree));
  expect(rscNote.blockers.length, 'number of blockers for the wishlist tree').toBeGreaterThan(0);
});

test('requires names the three real requirements', () => {
  expect([...(rscNote?.requires ?? [])].sort(), 'rscNote.requires').toEqual(['bundler-split', 'pinned-react', 'rsc-runtime']);
});

test('gains names exactly the two real gains', () => {
  expect([...(rscNote?.gains ?? [])].sort(), 'rscNote.gains').toEqual(['less-to-hydrate', 'server-code-out-of-bundle']);
});
