const card = (id) => screen.$(`[data-testid="wish-${id}"]`);
const placeholders = (id) => card(id)?.querySelectorAll('[data-testid="placeholder"]').length ?? 0;
// React Native Web draws an Image as a box holding an <img> whose alt is the accessibilityLabel.
const namedImg = (name) => screen.allByRole('img').find((el) => el.tagName === 'IMG' && screen.nameOf(el) === name);
const picture = (name) => namedImg(name)?.parentElement;
// The width written inside the picture source the Image shows (the variants are generated squares).
function shownWidth(name) {
  const match = /width%3D%22(\d+)%22/.exec(namedImg(name)?.getAttribute('src') ?? '');
  return match ? Number(match[1]) : null;
}

test('a placeholder stands in until the picture and the font are ready', async () => {
  await waitFor(() => card('w-01'));
  expect(placeholders('w-01'), 'placeholders in the first wish right after start').toBeGreaterThan(0);
  expect(screen.text(), 'visible text right after start (the font is not loaded yet)').not.toContain(L.headphones);
  await waitFor(() => placeholders('w-01') === 0 && placeholders('w-02') === 0, { timeout: 4000 });
  expect(screen.text(), 'visible text once the font has loaded').toContain(L.headphones);
  expect(screen.text(), 'visible text once the font has loaded').toContain(L.lamp);
});

test('each picture is named by its wish', async () => {
  await waitFor(() => card('w-02'));
  expect(picture(L.headphones), `a picture named "${L.headphones}"`).toBeTruthy();
  expect(picture(L.lamp), `a picture named "${L.lamp}"`).toBeTruthy();
});

test('each picture is 64 × 64 points', async () => {
  await waitFor(() => picture(L.headphones) && picture(L.lamp));
  for (const name of [L.headphones, L.lamp]) {
    const box = picture(name).getBoundingClientRect();
    expect(Math.round(box.width), `width of the picture "${name}"`).toBe(64);
    expect(Math.round(box.height), `height of the picture "${name}"`).toBe(64);
  }
});

test('each thumbnail uses the smallest variant that covers 64 points at 3×', async () => {
  await waitFor(() => picture(L.headphones) && picture(L.lamp));
  expect(shownWidth(L.headphones), `pixel width of the variant shown for "${L.headphones}"`).toBe(192);
  expect(shownWidth(L.lamp), `pixel width of the variant shown for "${L.lamp}"`).toBe(192);
});
