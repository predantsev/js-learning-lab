import { flow } from './flow.js';
import { createDevice } from './simDevice.js';
import { runFlow } from './e2eRunner.js';

let passesOnWorkingApp = false;

test('your flow passes on the working app', () => {
  passesOnWorkingApp = runFlow(flow, createDevice());
  expect(passesOnWorkingApp, 'the flow passes on the working app').toBe(true);
});

test('your flow fails when the habits are lost on restart', () => {
  expect(passesOnWorkingApp, 'your flow passes on the working app (the first check)').toBe(true);
  expect(runFlow(flow, createDevice({ persists: false })), 'the flow passes on an app that loses data on restart').toBe(false);
});

test('your flow fails when Save does not add the habit', () => {
  expect(passesOnWorkingApp, 'your flow passes on the working app (the first check)').toBe(true);
  expect(runFlow(flow, createDevice({ saveAdds: false })), 'the flow passes on an app whose Save adds nothing').toBe(false);
});

test('the flow runs on the declared target', () => {
  expect(flow?.runsOn, 'runsOn').toBe('target');
});
