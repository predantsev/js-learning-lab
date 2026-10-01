// V-15 / V-17 / REQ-031 / REQ-035 (automated part): an accessibility scan built on Chrome's own
// accessibility tree (no extra dependencies), and WCAG text contrast computed from computed colors
// in all three styles, light and dark — for the design-token pairs the stylesheet uses and for
// every visible text element of representative screens.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { L1, L2, Lab, buildFixtureDist, launchChrome, onboard, openApp, replaceEditor, t, waitSaved } from './helpers.mjs';

let distDir;
let browser;
before(async () => {
  distDir = await buildFixtureDist();
  browser = await launchChrome();
});
after(async () => {
  await browser?.close();
  await fs.rm(distDir, { recursive: true, force: true });
});

const STYLES = ['calm-studio', 'editorial', 'dev-workspace'];
const APPEARANCES = ['light', 'dark'];
const NAMED_ROLES = new Set(['button', 'link', 'textbox', 'searchbox', 'checkbox', 'radio', 'tab', 'combobox', 'switch', 'slider', 'spinbutton', 'menuitem', 'option', 'dialog', 'image', 'region', 'navigation', 'group', 'radiogroup', 'tablist', 'list']);
const NEEDS_NAME = new Set(['button', 'link', 'textbox', 'searchbox', 'checkbox', 'radio', 'tab', 'combobox', 'switch', 'slider', 'spinbutton', 'menuitem', 'option', 'dialog', 'image']);

/** Scan the current screen: Chrome's accessibility tree plus DOM-level checks. */
async function axScan(page, screen) {
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  await cdp.detach();
  const issues = [];
  const live = nodes.filter((n) => !n.ignored);
  for (const n of live) {
    const role = n.role?.value;
    const name = (n.name?.value ?? '').trim();
    if (NEEDS_NAME.has(role) && name === '') issues.push(`${screen}: ${role} without an accessible name or text alternative (backend node ${n.backendDOMNodeId})`);
  }
  const roles = live.map((n) => n.role?.value);
  // While a modal dialog is open, everything outside it is correctly inert (no landmarks).
  const modal = await page.evaluate(() => [...document.querySelectorAll('dialog')].some((d) => d.matches(':modal')));
  if (modal && !live.some((n) => n.role?.value === 'dialog' && (n.name?.value ?? '').trim())) issues.push(`${screen}: modal dialog without a name`);
  if (!modal && !roles.includes('main')) issues.push(`${screen}: no main landmark`);
  const dom = await page.evaluate(() => {
    const ids = new Map();
    for (const el of document.querySelectorAll('[id]')) ids.set(el.id, (ids.get(el.id) ?? 0) + 1);
    const refs = [];
    for (const attr of ['aria-labelledby', 'aria-describedby', 'aria-controls']) {
      for (const el of document.querySelectorAll(`[${attr}]`)) for (const id of el.getAttribute(attr).split(/\s+/)) if (id && !document.getElementById(id)) refs.push(`${attr}=${id}`);
    }
    const visible = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
    return {
      duplicateIds: [...ids].filter(([, n]) => n > 1).map(([id]) => id),
      brokenRefs: refs,
      h1: [...document.querySelectorAll('h1')].filter(visible).length,
      imgsWithoutAlt: [...document.querySelectorAll('img:not([alt])')].length,
      lang: document.documentElement.lang,
      tabsOutsideTablist: [...document.querySelectorAll('[role="tab"]')].filter((el) => !el.closest('[role="tablist"]')).length,
    };
  });
  if (dom.duplicateIds.length) issues.push(`${screen}: duplicate ids ${dom.duplicateIds.join(', ')}`);
  if (dom.brokenRefs.length) issues.push(`${screen}: ARIA references to missing ids ${dom.brokenRefs.join(', ')}`);
  if (dom.h1 !== 1) issues.push(`${screen}: ${dom.h1} visible h1 headings (expected exactly 1)`);
  if (dom.imgsWithoutAlt) issues.push(`${screen}: ${dom.imgsWithoutAlt} img without alt`);
  if (!['uk', 'en'].includes(dom.lang)) issues.push(`${screen}: document language "${dom.lang}"`);
  if (dom.tabsOutsideTablist) issues.push(`${screen}: tab outside a tablist`);
  return { issues, roles: new Set(roles.filter((r) => NAMED_ROLES.has(r))) };
}

// ---------- contrast (WCAG 2.x relative luminance) ----------
const PAGE_COLOR_HELPERS = `
  const parse = (c) => {
    let m = /^rgba?\\(([^)]+)\\)$/.exec(c);
    if (m) { const p = m[1].split(/[\\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1]; }
    m = /^color\\(srgb ([^)]+)\\)$/.exec(c);
    if (m) { const p = m[1].split(/[\\s/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1]; }
    return null;
  };
  const over = (top, bottom) => { const a = top[3] + bottom[3] * (1 - top[3]); if (a === 0) return [0, 0, 0, 0]; return [0, 1, 2].map((i) => (top[i] * top[3] + bottom[i] * bottom[3] * (1 - top[3])) / a).concat(a); };
  const lum = (c) => { const [r, g, b] = c.slice(0, 3).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
`;

/** Contrast of every token pair the stylesheet combines for text (see app.css). */
const tokenPairs = (page) => page.evaluate(`(() => {
  ${PAGE_COLOR_HELPERS}
  const probe = document.createElement('span');
  document.body.append(probe);
  const resolve = (token) => { probe.style.color = 'var(' + token + ')'; return parse(getComputedStyle(probe).color); };
  const surfaces = ['--ll-bg', '--ll-panel', '--ll-soft', '--ll-code-bg'];
  const pairs = [];
  const add = (fg, bgs) => { for (const bg of bgs) pairs.push([fg, bg]); };
  add('--ll-ink', [...surfaces, '--ll-ok-soft', '--ll-warn-soft', '--ll-danger-soft', '--ll-info-soft']);
  add('--ll-dim', [...surfaces, '--ll-info-soft', '--ll-danger-soft', '--ll-warn-soft', '--ll-ok-soft']);
  add('--ll-accent', surfaces);
  add('--ll-on-accent', ['--ll-accent']);
  add('--ll-ok', ['--ll-ok-soft', '--ll-panel', '--ll-bg']);
  add('--ll-warn', ['--ll-warn-soft', '--ll-panel', '--ll-bg']);
  add('--ll-danger', ['--ll-danger-soft', '--ll-panel', '--ll-bg']);
  add('--ll-info', ['--ll-info-soft', '--ll-panel']);
  for (const syn of ['keyword', 'string', 'number', 'comment', 'fn', 'prop', 'tag', 'punct']) add('--ll-syn-' + syn, ['--ll-code-bg', '--ll-panel']);
  const out = pairs.map(([fg, bg]) => ({ fg, bg, ratio: Math.round(ratio(resolve(fg), resolve(bg)) * 100) / 100 }));
  probe.remove();
  return out;
})()`);

/** Every visible text element on the screen against its effective background. */
const renderedContrast = (page) => page.evaluate(`(() => {
  ${PAGE_COLOR_HELPERS}
  const failures = [];
  let checked = 0;
  const background = (el) => {
    let color = [0, 0, 0, 0];
    for (let n = el; n; n = n.parentElement) {
      const bg = parse(getComputedStyle(n).backgroundColor);
      if (bg && bg[3] > 0) { color = over(color, bg); if (color[3] >= 0.999) return color; }
    }
    return over(color, [255, 255, 255, 1]);
  };
  const opacity = (el) => { let o = 1; for (let n = el; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity); return o; };
  const exempt = (el) => el.closest('[disabled], [aria-disabled="true"], .sr-only, [aria-hidden="true"], .runner-frame, .hidden-frame-host, .preview-hidden, noscript, .cm-gutters');
  for (const el of document.body.querySelectorAll('*')) {
    const own = [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim() !== '');
    if (!own || exempt(el)) continue;
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    if (rect.width === 0 || rect.height === 0 || style.visibility === 'hidden' || style.display === 'none') continue;
    // SVG text is painted with fill, HTML text with color.
    const fg = parse(el instanceof SVGElement ? style.fill : style.color);
    if (!fg) continue;
    const bg = background(el);
    const text = over([fg[0], fg[1], fg[2], fg[3] * opacity(el)], bg);
    const size = parseFloat(style.fontSize);
    const large = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700);
    const r = ratio(text, bg);
    checked += 1;
    const cls = typeof el.className === 'string' ? el.className : el.getAttribute('class') ?? '';
    if (r < (large ? 3 : 4.5)) failures.push({ text: el.textContent.trim().slice(0, 40), cls: cls.slice(0, 50), ratio: Math.round(r * 100) / 100, color: el instanceof SVGElement ? style.fill : style.color, opacity: Math.round(opacity(el) * 100) / 100, bg: 'rgb(' + bg.slice(0, 3).map(Math.round).join(',') + ')' });
  }
  return { checked, failures };
})()`);

/** The look really in effect (a profile update re-applies the stored style, so verify). */
const assertLook = async (page, style, appearance) => assert.deepEqual(
  await page.evaluate(() => [document.documentElement.dataset.style, document.documentElement.dataset.appearance]),
  [style, appearance],
  'the measured style/appearance was in effect',
);

async function setLook(page, lab, style, appearance) {
  await page.evaluate(([s, a]) => { document.documentElement.dataset.style = s; document.documentElement.dataset.appearance = a; }, [style, appearance]);
  // Measure the steady state: let one-shot transitions/animations (e.g. a step highlight fading
  // in) finish. Infinite ones (the editor caret blink) do not change text colors.
  await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {}))));
}

/** A lesson screen with as many kinds of text as possible: output, errors, test results, hints, answers. */
async function richLessonScreen(page, lab) {
  await page.goto(lab.url(`#/lesson/${L1}/2`));
  const exercise = page.locator('#block-basics-exercise');
  await exercise.waitFor();
  await replaceEditor(page, "import { label } from './label.js';\n// a comment\nconst n = 1, s = 'text', f = (x) => x;\nconsole.log(label, \"3\", { n, s }, [1, true], null);\nconsole.warn('careful');\n");
  await page.locator('.ws-actions').getByRole('button', { name: t('uk', 'ws.run'), exact: true }).click();
  await page.locator('.console-line').first().waitFor();
  await page.locator('.ws-actions').getByRole('button', { name: t('uk', 'ws.check'), exact: true }).click();
  await page.locator('.tests-summary').waitFor({ timeout: 15_000 });
  await exercise.getByRole('button', { name: t('uk', 'hint.need') }).click();
  const predict = page.locator('#block-basics-predict');
  if (await predict.locator('input[type=radio]').count()) {
    await predict.locator('input[type=radio]').nth(1).check();
    await predict.getByRole('button', { name: t('uk', 'q.submit') }).click();
  }
  await waitSaved(page);
}

test('accessibility scan: names, landmarks, headings, unique ids and valid references on every screen', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await openApp(browser, lab);
    const issues = [];
    const seenRoles = new Set();
    const scan = async (screen) => { const r = await axScan(page, screen); issues.push(...r.issues); for (const role of r.roles) seenRoles.add(role); };
    await scan('onboarding');
    await onboard(page);
    await page.locator('#block-basics-visual .viz').waitFor();
    await scan('lesson page 1 (explanation, analogy, visual, example)');
    await richLessonScreen(page, lab);
    await scan('lesson page 2 (prediction, exercise, results, hints)');
    await page.locator('#block-basics-intro').count();
    await page.goto(lab.url(`#/lesson/${L2}/1`));
    await page.locator('#block-practice-review').waitFor();
    await scan('lesson with review block');
    await page.goto(lab.url(`#/lesson/${L2}/3`));
    await page.locator('#block-practice-local').waitFor();
    await scan('lesson with local task');
    await page.locator('.lesson-footer').getByRole('button', { name: new RegExp(t('uk', 'lesson.known')) }).click();
    await page.getByRole('dialog', { name: t('uk', 'skip.title') }).getByRole('button', { name: t('uk', 'skip.selfCheck') }).click();
    await page.getByRole('dialog', { name: t('uk', 'skip.selfCheckTitle') }).waitFor();
    await scan('self-check dialog');
    await page.keyboard.press('Escape');
    for (const [hash, screen] of [['#/course', 'course map'], ['#/bookmarks', 'bookmarks'], ['#/review', 'review'], ['#/glossary', 'glossary'], ['#/settings', 'settings'], ['#/project', 'project'], ['#/nowhere', 'not found']]) {
      await page.goto(lab.url(hash));
      await page.locator('.app-main h1').first().waitFor();
      await scan(screen);
    }
    await page.goto(lab.url(`#/lesson/${L1}/1`));
    await page.locator('.lang-switch').getByRole('button', { name: 'EN', exact: true }).click();
    await page.locator('#block-basics-intro h2', { hasText: 'Statements run in order' }).waitFor();
    await scan('lesson page 1 in English');
    assert.deepEqual(issues, []);
    for (const role of ['button', 'link', 'textbox', 'radio', 'tab', 'region', 'navigation', 'image']) assert.ok(seenRoles.has(role), `the scan covered ${role} elements`);
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('design tokens: every text color pair reaches 4.5:1 in all three styles, light and dark', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, context } = await openApp(browser, lab);
    const failures = [];
    let pairs = 0;
    for (const style of STYLES) {
      for (const appearance of APPEARANCES) {
        await setLook(page, lab, style, appearance);
        for (const p of await tokenPairs(page)) {
          pairs += 1;
          if (p.ratio < 4.5) failures.push(`${style}/${appearance}: ${p.fg} on ${p.bg} = ${p.ratio}`);
        }
        await assertLook(page, style, appearance);
      }
    }
    assert.deepEqual(failures, []);
    assert.equal(pairs, 288, 'checked 48 token pairs in each of the 6 style × appearance combinations');
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('rendered screens: every visible text element reaches WCAG AA contrast in all styles and appearances', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await openApp(browser, lab);
    await onboard(page);
    const failures = [];
    let checked = 0;
    const screens = [
      ['lesson page 2', () => richLessonScreen(page, lab)],
      ['lesson page 1', async () => { await page.goto(lab.url(`#/lesson/${L1}/1`)); await page.locator('#block-basics-visual .viz').waitFor(); }],
      ['course map', async () => { await page.goto(lab.url('#/course')); await page.locator('.unit-card').first().waitFor(); }],
      ['settings', async () => { await page.goto(lab.url('#/settings')); await page.locator('.segmented').first().waitFor(); }],
      ['glossary', async () => { await page.goto(lab.url('#/glossary')); await page.locator('.glossary-item').first().waitFor(); }],
    ];
    for (const [name, show] of screens) {
      await show();
      for (const style of STYLES) {
        for (const appearance of APPEARANCES) {
          await setLook(page, lab, style, appearance);
          const result = await renderedContrast(page);
          await assertLook(page, style, appearance);
          checked += result.checked;
          for (const f of result.failures) failures.push(`${name} ${style}/${appearance}: "${f.text}" (${f.cls}) ${f.ratio}:1 ${f.color} opacity ${f.opacity} on ${f.bg}`);
        }
      }
    }
    assert.ok(checked > 1000, `checked ${checked} text elements`);
    assert.deepEqual(failures, []);
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});
