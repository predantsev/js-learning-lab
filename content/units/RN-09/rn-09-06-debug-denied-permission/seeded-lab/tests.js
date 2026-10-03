import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { createLabDevice } from './labDevice.jsx';
import { ProgressPhoto } from './ProgressPhoto.jsx';

// Mounts a fresh lab screen on a fresh simulated device, so every check starts from "not asked yet".
function mount({ hasCamera }) {
  const device = createLabDevice({ hasCamera });
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  flushSync(() => root.render(createElement(ProgressPhoto, { device })));
  const button = (label) => [...box.querySelectorAll('[role="button"]')].find((el) => el.textContent.trim() === label);
  return {
    device,
    text: () => box.textContent,
    button,
    async press(label) {
      const el = button(label);
      expect(Boolean(el), `a button "${label}"`).toBe(true);
      await user.click(el);
    },
    async answer(allow) {
      await waitFor(() => device.panel.info().dialogOpen);
      device.panel.answerDialog(allow);
      await sleep(60);
    },
    done() {
      root.unmount();
      box.remove();
    },
  };
}

test('with a camera and Allow the camera starts', async () => {
  const lab = mount({ hasCamera: true });
  try {
    await lab.press(L.takePhoto);
    await lab.answer(true);
    await waitFor(() => lab.text().includes(L.ready));
    expect(lab.text().includes(L.ready), `the screen shows "${L.ready}"`).toBe(true);
  } finally {
    lab.done();
  }
});

test('a deny shows the explanation, Ask again and a way on without a photo', async () => {
  const lab = mount({ hasCamera: true });
  try {
    await lab.press(L.takePhoto);
    await lab.answer(false);
    expect(lab.text().includes(L.rationale), `the screen shows "${L.rationale}"`).toBe(true);
    expect(Boolean(lab.button(L.askAgain)), `a button "${L.askAgain}"`).toBe(true);
    expect(Boolean(lab.button(L.withoutPhoto)), `a button "${L.withoutPhoto}"`).toBe(true);
  } finally {
    lab.done();
  }
});

test('a second deny offers Settings and no further request', async () => {
  const lab = mount({ hasCamera: true });
  try {
    await lab.press(L.takePhoto);
    await lab.answer(false);
    await lab.press(L.askAgain);
    await lab.answer(false);
    expect(Boolean(lab.button(L.openSettings)), `a button "${L.openSettings}"`).toBe(true);
    expect(Boolean(lab.button(L.withoutPhoto)), `a button "${L.withoutPhoto}"`).toBe(true);
    expect(Boolean(lab.button(L.askAgain)), `a button "${L.askAgain}" after the second deny`).toBe(false);
    expect(lab.device.panel.info().dialogsShown, 'system dialogs shown').toBe(2);
  } finally {
    lab.done();
  }
});

test('without a camera the screen falls back instead of waiting', async () => {
  const lab = mount({ hasCamera: false });
  try {
    await lab.press(L.takePhoto);
    await lab.answer(true);
    await sleep(100);
    expect(lab.text().includes(L.noCamera), `the screen shows "${L.noCamera}"`).toBe(true);
    expect(lab.text().includes(L.starting), `the screen still shows "${L.starting}"`).toBe(false);
    expect(Boolean(lab.button(L.withoutPhoto)), `a button "${L.withoutPhoto}"`).toBe(true);
  } finally {
    lab.done();
  }
});

test('saving without a photo finishes the check-in', async () => {
  const lab = mount({ hasCamera: true });
  try {
    await lab.press(L.takePhoto);
    await lab.answer(false);
    await lab.press(L.withoutPhoto);
    expect(lab.text().includes(L.savedWithout), `the screen shows "${L.savedWithout}"`).toBe(true);
  } finally {
    lab.done();
  }
});
