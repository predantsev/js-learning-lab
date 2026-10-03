import { dismissAlert, openAlert } from './alertSim.jsx';

// Each check starts from a fresh edit screen of "Transit pass": back to the list (without asking anyone), then open it.
async function freshEdit() {
  dismissAlert();
  const stack = scope.stack;
  while (stack.getState().routes.length > 1) {
    const top = stack.getState().routes.at(-1);
    stack.navigationFor(top.key).dispatch({ type: 'GO_BACK', visited: new Set([top.key]) });
  }
  await settle();
  await user.click(screen.byText(L.transit));
  return waitFor(() => screen.byLabel(L.labelLabel));
}
const topName = () => scope.stack.getState().routes.at(-1).name;
const dialogButton = (name) => screen.byRole('button', { name });

test('leaving an unchanged form does not ask', async () => {
  await freshEdit();
  scope.stack.hardwareBack();
  await settle();
  expect(openAlert(), 'the dialog after the Android back button on an unchanged form').toBeNull();
  expect(topName(), 'the screen on top').toBe('List');
});

test('the Android back button asks when the label changed', async () => {
  const field = await freshEdit();
  await user.fill(field, L.changedLabel);
  scope.stack.hardwareBack();
  await settle();
  expect(topName(), 'the screen on top after the Android back button').toBe('Edit');
  expect(openAlert(), 'the dialog after the Android back button').not.toBeNull();
});

test('the iOS swipe and the header back button ask too', async () => {
  const field = await freshEdit();
  await user.fill(field, L.changedLabel);
  scope.stack.swipeBack();
  await settle();
  expect(topName(), 'the screen on top after the iOS swipe back').toBe('Edit');
  expect(openAlert(), 'the dialog after the iOS swipe back').not.toBeNull();
  dismissAlert();
  scope.stack.headerBack();
  await settle();
  expect(topName(), 'the screen on top after the header back button').toBe('Edit');
  expect(openAlert(), 'the dialog after the header back button').not.toBeNull();
});

test('spaces at the ends of the label alone are not a change', async () => {
  const field = await freshEdit();
  await user.fill(field, `${L.transit} `);
  scope.stack.hardwareBack();
  await settle();
  expect(openAlert(), 'the dialog after adding only a space at the end of the label').toBeNull();
  expect(topName(), 'the screen on top').toBe('List');
});

test('a changed category alone counts as unsaved', async () => {
  await freshEdit();
  await user.click(screen.byRole('radio', { name: L.fun }));
  scope.stack.hardwareBack();
  await settle();
  expect(topName(), 'the screen on top after changing only the category').toBe('Edit');
});

test('keep editing stays on the screen with the draft', async () => {
  const field = await freshEdit();
  await user.fill(field, L.changedLabel);
  scope.stack.hardwareBack();
  await settle();
  await user.click(await waitFor(() => dialogButton(L.keepEditing)));
  await settle();
  expect(topName(), 'the screen on top after “keep editing”').toBe('Edit');
  expect(screen.byLabel(L.labelLabel), 'the label field').toHaveValue(L.changedLabel);
});

test('discard leaves the screen', async () => {
  const field = await freshEdit();
  await user.fill(field, L.changedLabel);
  scope.stack.hardwareBack();
  await settle();
  await user.click(await waitFor(() => dialogButton(L.discard)));
  await settle();
  expect(topName(), 'the screen on top after “discard”').toBe('List');
  expect(openAlert(), 'a second dialog after “discard”').toBeNull();
});

test('after saving, leaving does not ask', async () => {
  const field = await freshEdit();
  await user.fill(field, L.changedLabel);
  await user.click(screen.byRole('button', { name: L.save }));
  await settle();
  scope.stack.hardwareBack();
  await settle();
  expect(openAlert(), 'the dialog after saving and pressing back').toBeNull();
  expect(topName(), 'the screen on top').toBe('List');
});
