// Render a copy of the page in a frame of the given width. A frame is a window of its own,
// so media queries see exactly that width. The copy reports what it measured with postMessage.
function measureAt(width) {
  return new Promise((resolve, reject) => {
    const frame = document.createElement('iframe');
    frame.style.cssText = `position:absolute;left:-10000px;top:0;border:0;width:${width}px;height:700px`;
    const copy = document.documentElement.cloneNode(true);
    copy.querySelectorAll('script').forEach((script) => script.remove());
    const probe = `<script>addEventListener('load', () => {
      const lefts = new Set([...document.querySelectorAll('.card')].map((card) => Math.round(card.getBoundingClientRect().left)));
      parent.postMessage({ jsllProbe: true, columns: lefts.size, overflow: document.documentElement.scrollWidth > innerWidth }, '*');
    });<\/script>`;
    frame.srcdoc = `<!doctype html>${copy.outerHTML.replace('</body>', `${probe}</body>`)}`;
    const timer = setTimeout(() => finish(new Error('the measuring frame did not answer')), 3000);
    function onMessage(event) {
      if (event.source === frame.contentWindow && event.data && event.data.jsllProbe) finish(null, event.data);
    }
    function finish(error, data) {
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      frame.remove();
      if (error) reject(error);
      else resolve(data);
    }
    window.addEventListener('message', onMessage);
    document.body.append(frame);
  });
}

// Pretend the person chose a motion preference by rewriting the conditions of the page's media rules
// for a moment, the way the browser's developer tools emulate the setting.
function withMotionPreference(preference, measure) {
  const yes = '(min-width: 0px)';
  const no = '(max-width: 0px)';
  const whenReduce = preference === 'reduce' ? yes : no;
  const whenNoPreference = preference === 'reduce' ? no : yes;
  const changed = [];
  const walk = (rules) => {
    for (const rule of rules) {
      if (rule instanceof CSSMediaRule) {
        const before = rule.media.mediaText;
        const after = before
          .replace(/\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/g, whenReduce)
          .replace(/\(\s*prefers-reduced-motion\s*:\s*no-preference\s*\)/g, whenNoPreference)
          .replace(/\(\s*prefers-reduced-motion\s*\)/g, whenReduce);
        if (after !== before) {
          rule.media.mediaText = after;
          changed.push([rule, before]);
        }
      }
      if (rule.cssRules) walk(rule.cssRules);
    }
  };
  for (const sheet of document.styleSheets) walk(sheet.cssRules);
  try {
    return measure();
  } finally {
    for (const [rule, before] of changed) rule.media.mediaText = before;
  }
}

const animates = (element) => {
  const s = getComputedStyle(element);
  const transition = s.transitionProperty !== 'none' && s.transitionDuration.split(',').some((duration) => parseFloat(duration) > 0.01);
  const animation = s.animationName !== 'none' && s.animationDuration.split(',').some((duration) => parseFloat(duration) > 0.01);
  return transition || animation;
};

test('one column of cards in a 320px window', async () => {
  const result = await measureAt(320);
  expect(result.columns, 'columns of cards in a 320px window').toBe(1);
});

test('several columns of cards in a wider window', async () => {
  expect((await measureAt(700)).columns, 'columns of cards in a 700px window').toBeGreaterThanOrEqual(2);
  expect((await measureAt(1000)).columns, 'columns of cards in a 1000px window').toBeGreaterThanOrEqual(3);
});

test('nothing sticks out at 320px or at 200% zoom', async () => {
  for (const width of [320, 640]) {
    expect((await measureAt(width)).overflow, `horizontal scrolling in a ${width}px window`).toBe(false);
  }
});

test('the cards still move smoothly for people who did not ask to reduce motion', () => {
  const allAnimate = withMotionPreference('no-preference', () => screen.$$('.card').every(animates));
  expect(allAnimate, 'every card has its transition').toBe(true);
});

test('the cards do not animate when reduced motion is requested', () => {
  const anyAnimates = withMotionPreference('reduce', () => screen.$$('.card').some(animates));
  expect(anyAnimates, 'a card still has a transition or an animation').toBe(false);
});
