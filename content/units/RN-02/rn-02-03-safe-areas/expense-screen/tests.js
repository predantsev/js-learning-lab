// The simulated insets of the two frames (DeviceFrame.jsx).
const FRAMES = {
  portrait: { top: 59, right: 0, bottom: 34, left: 0 },
  landscape: { top: 0, right: 59, bottom: 21, left: 59 },
};

// The inner screen of a frame (without its border), in page coordinates.
function screenOf(frame) {
  const r = frame.getBoundingClientRect();
  const left = r.left + frame.clientLeft;
  const top = r.top + frame.clientTop;
  return { left, top, right: left + frame.clientWidth, bottom: top + frame.clientHeight };
}
// Where the glyphs of a Text are, without its padding.
function glyphs(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect();
}
const inFrame = (frame, id) => [...frame.querySelectorAll(`[data-testid="${id}"]`)];
const frames = async () => {
  await waitFor(() => screen.$('[data-testid="frame-landscape"] [data-testid="add"]'));
  return Object.keys(FRAMES).map((name) => ({ name, frame: screen.$(`[data-testid="frame-${name}"]`), insets: FRAMES[name] }));
};

test('the title stays inside the safe area in both orientations', async () => {
  for (const { name, frame, insets } of await frames()) {
    const area = screenOf(frame);
    const title = glyphs(inFrame(frame, 'title')[0]);
    expect(title.top, `${name}: top of the title text`).toBeGreaterThanOrEqual(area.top + insets.top - 0.5);
    expect(title.left, `${name}: left edge of the title text`).toBeGreaterThanOrEqual(area.left + insets.left - 0.5);
  }
});

test('the list rows stay inside the safe area in both orientations', async () => {
  for (const { name, frame, insets } of await frames()) {
    const area = screenOf(frame);
    for (const row of inFrame(frame, 'row')) {
      const text = glyphs(row);
      expect(text.left, `${name}: left edge of the row text "${row.textContent}"`).toBeGreaterThanOrEqual(area.left + insets.left - 0.5);
      expect(text.right, `${name}: right edge of the row text "${row.textContent}"`).toBeLessThanOrEqual(area.right - insets.right + 0.5);
    }
  }
});

test('the add button stays inside the safe area in both orientations', async () => {
  for (const { name, frame, insets } of await frames()) {
    const area = screenOf(frame);
    const button = inFrame(frame, 'add')[0].getBoundingClientRect();
    expect(button.bottom, `${name}: bottom of the add button`).toBeLessThanOrEqual(area.bottom - insets.bottom + 0.5);
    expect(button.left, `${name}: left edge of the add button`).toBeGreaterThanOrEqual(area.left + insets.left - 0.5);
    expect(button.right, `${name}: right edge of the add button`).toBeLessThanOrEqual(area.right - insets.right + 0.5);
  }
});

test('the backgrounds run edge to edge', async () => {
  for (const { name, frame } of await frames()) {
    const area = screenOf(frame);
    const header = inFrame(frame, 'header')[0].getBoundingClientRect();
    const list = inFrame(frame, 'list')[0].getBoundingClientRect();
    const bar = inFrame(frame, 'bar')[0].getBoundingClientRect();
    expect(header.top, `${name}: top of the header background`).toBeLessThanOrEqual(area.top + 0.5);
    expect(bar.bottom, `${name}: bottom of the bar background`).toBeGreaterThanOrEqual(area.bottom - 0.5);
    expect(list.left, `${name}: left edge of the list background`).toBeLessThanOrEqual(area.left + 0.5);
    expect(list.right, `${name}: right edge of the list background`).toBeGreaterThanOrEqual(area.right - 0.5);
  }
});
