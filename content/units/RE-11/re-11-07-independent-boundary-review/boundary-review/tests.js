import { CANNOT_CROSS, COMPONENTS, LABELS, PAGES, SECRETS } from './review';

const norm = (value) => String(value ?? '').trim().toLowerCase();
const sorted = (values) => (Array.isArray(values) ? values.map((v) => String(v).trim()).sort() : values);

test('each page gets the strategy its facts call for', () => {
  expect(norm(PAGES.catalog?.strategy), 'PAGES.catalog.strategy').toBe('static');
  expect(norm(PAGES.dashboard?.strategy), 'PAGES.dashboard.strategy').toBe('ssr');
  expect(norm(PAGES.admin?.strategy), 'PAGES.admin.strategy').toBe('csr');
});

test('each page choice has its own reason of at least 20 characters', () => {
  const reasons = ['catalog', 'dashboard', 'admin'].map((page) => String(PAGES[page]?.why ?? '').trim());
  reasons.forEach((reason, i) => expect(reason.length, `length of PAGES.${['catalog', 'dashboard', 'admin'][i]}.why`).toBeGreaterThanOrEqual(20));
  expect(new Set(reasons.map((r) => r.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim())).size, 'the number of different reasons').toBe(3);
});

test('components that need the browser are client components, the rest are server components', () => {
  const expected = {
    EventsPage: 'server', EventList: 'server', EventCard: 'server', RegisterButton: 'client', CategoryFilter: 'client', CountdownBadge: 'client',
    DashboardPage: 'server', MyRegistrations: 'server', CancelButton: 'client', AdminPage: 'server', AdminEventForm: 'client',
  };
  const wrong = Object.keys(expected).filter((name) => norm(COMPONENTS[name]) !== expected[name]);
  expect(wrong, 'components with a wrong or missing side').toEqual([]);
});

test('CANNOT_CROSS names exactly the props React cannot serialize', () => {
  expect(sorted(CANNOT_CROSS), 'CANNOT_CROSS').toEqual(['onRegistered', 'registration']);
});

test('SECRETS names the prop that serializes but must never reach the browser', () => {
  expect(sorted(SECRETS), 'SECRETS').toEqual(['adminToken']);
});

test('LABELS give each tutorial API its stability or mark it as a framework rule', () => {
  expect({ useServer: norm(LABELS.useServer), taintObjectReference: norm(LABELS.taintObjectReference), serverOnlyPackage: norm(LABELS.serverOnlyPackage) }, 'LABELS').toEqual({
    useServer: 'stable',
    taintObjectReference: 'experimental',
    serverOnlyPackage: 'framework',
  });
});
