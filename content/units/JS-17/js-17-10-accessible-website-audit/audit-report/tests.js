import * as written from './audit.js';

// The problems planted in the page, by the element that carries them.
const PLANTED = ['#help-link', '#habit-name', '#add-habit', '#name-error', '#search', '.chip', '.toggle', '#saved'];
const SEVERITIES = ['critical', 'serious', 'moderate', 'minor'];
const findings = () => {
  expect(Array.isArray(written.findings), 'the findings export of audit.js is an array').toBe(true);
  return written.findings;
};
const elementOf = (finding) => {
  try {
    return typeof finding.element === 'string' && finding.element.trim() !== '' ? document.querySelector(finding.element) : null;
  } catch {
    return null; // not a valid selector
  }
};
const plantedOf = (element) => PLANTED.find((selector) => element.matches(selector) || element.closest(selector) !== null) ?? null;
const text = (value, min = 10) => typeof value === 'string' && value.trim().length >= min;

test('the report has five findings', () => {
  expect(findings().length, 'number of findings').toBe(5);
});

test('every finding points at an element of the page', () => {
  for (const [i, finding] of findings().entries()) {
    expect(elementOf(finding) !== null, `finding ${i + 1}: the selector ${JSON.stringify(finding.element)} finds an element on the page`).toBe(true);
  }
});

test('the five findings are five different planted problems', () => {
  const problems = findings().map((finding) => {
    const element = elementOf(finding);
    return element === null ? null : plantedOf(element);
  });
  for (const [i, problem] of problems.entries()) {
    expect(problem !== null, `finding ${i + 1}: ${JSON.stringify(findings()[i].element)} is one of the elements with a planted problem`).toBe(true);
  }
  expect(new Set(problems).size, 'different planted problems among the findings').toBe(5);
});

test('every finding states the expectation, the steps, a severity and a fix', () => {
  for (const [i, finding] of findings().entries()) {
    expect(text(finding.expectation), `finding ${i + 1}: expectation has at least 10 characters`).toBe(true);
    expect(Array.isArray(finding.steps) && finding.steps.length >= 2 && finding.steps.every((step) => text(step, 3)), `finding ${i + 1}: at least two steps`).toBe(true);
    expect(SEVERITIES.includes(finding.severity), `finding ${i + 1}: severity is one of ${SEVERITIES.join(', ')}`).toBe(true);
    expect(text(finding.fix), `finding ${i + 1}: fix has at least 10 characters`).toBe(true);
  }
});

test('a keyboard trap is reported as critical', () => {
  const trap = findings().filter((finding) => {
    const element = elementOf(finding);
    return element !== null && plantedOf(element) === '#search';
  });
  for (const finding of trap) {
    expect(finding.severity, 'severity of the finding about the search field').toBe('critical');
  }
});
