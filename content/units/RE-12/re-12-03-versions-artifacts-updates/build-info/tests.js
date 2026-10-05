import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import BuildInfo from './BuildInfo';

const FULL = '9c08fd1e2b7a4c55d0e3f6a8b1c2d3e4f5a6b7c8';

// Renders BuildInfo with the given props in a fresh container and returns its footer text.
function footerText(props) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    flushSync(() => root.render(createElement(BuildInfo, props)));
    const footer = container.querySelector('footer');
    expect(footer !== null, 'a <footer> element is rendered').toBe(true);
    return footer.textContent.replace(/\s+/g, ' ').trim();
  } finally {
    root.unmount();
    container.remove();
  }
}

test('shows the version and the first 7 characters of the commit', () => {
  expect(footerText({ version: '1.4.0', commit: FULL }), 'footer for version "1.4.0" and the full commit id').toBe(`${L.versionWord} 1.4.0 (9c08fd1)`);
});

test('a commit id that is already short is shown whole', () => {
  expect(footerText({ version: '2.0.1', commit: '3fa1c02' }), 'footer for version "2.0.1" and commit "3fa1c02"').toBe(`${L.versionWord} 2.0.1 (3fa1c02)`);
});

test('without a version it shows dev', () => {
  expect(footerText({ version: undefined, commit: FULL }), 'footer with no version').toBe(`${L.versionWord} dev`);
});

test('an empty version also shows dev', () => {
  expect(footerText({ version: '', commit: '' }), 'footer with version ""').toBe(`${L.versionWord} dev`);
});

test('without a commit it shows only the version', () => {
  expect(footerText({ version: '1.4.0', commit: undefined }), 'footer with no commit').toBe(`${L.versionWord} 1.4.0`);
  expect(footerText({ version: '1.4.0', commit: '' }), 'footer with commit ""').toBe(`${L.versionWord} 1.4.0`);
});
