import { connection } from './connection';
import { SyncStatus } from './SyncStatus';

const status = () => screen.byRole('status');
const toggle = () => screen.allByRole('button').find((b) => b.textContent === L.hideStatus || b.textContent === L.showStatus);

test('shows the current connection status', () => {
  expect(status(), 'the element with role="status"').toHaveTextContent(L.synced);
});

test('follows changes of the connection', async () => {
  connection.setOnline(false);
  await settle();
  expect(status(), 'the status after the connection went offline').toHaveTextContent(L.offline);
  connection.setOnline(true);
  await settle();
  expect(status(), 'the status after the connection came back').toHaveTextContent(L.synced);
});

test('listens exactly once while shown and stops when hidden', async () => {
  expect(connection.listenerCount(), 'listeners while the status is shown').toBe(1);
  await user.click(toggle());
  expect(connection.listenerCount(), 'listeners after hiding the status').toBe(0);
  await user.click(toggle());
  expect(connection.listenerCount(), 'listeners after showing it again').toBe(1);
});

test('SyncStatus is a function component', () => {
  expect(typeof SyncStatus, 'type of SyncStatus').toBe('function');
  expect(Boolean(SyncStatus.prototype?.isReactComponent), 'SyncStatus extends Component').toBe(false);
});
