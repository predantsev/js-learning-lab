// Authored feedback rules (`feedback: - when: { test: name } | { error: Name }`): one implementation
// for lesson exercises (Workspace) and capstone steps (the project screen).
import type { FeedbackRule, L10n, RunError, TestResult } from './types';

/**
 * The rule naming an error (`when: { error: Name }`), shown next to that error whether the program
 * threw it while loading or a test threw it. A syntax error found before running has no error name
 * of its own; it counts as SyntaxError, the most common beginner error.
 */
export function errorFeedback(rules: readonly FeedbackRule[] | null | undefined, error: Pick<RunError, 'name'> & Partial<Pick<RunError, 'kind'>>): L10n | null {
  const name = error.kind === 'syntax' ? 'SyntaxError' : error.name;
  return rules?.find((f) => f.when.error === name)?.message ?? null;
}

/**
 * Feedback for each failed test of one result list: the rule naming the test, otherwise the rule
 * naming the error the test threw (an error inside a test, not at load time). The same error message
 * is shown once per list. Create one per rendered list.
 */
export function testFeedback(rules: readonly FeedbackRule[] | null | undefined): (test: TestResult) => L10n | null {
  const shownErrorFeedback = new Set<L10n>();
  return (test) => {
    const byTest = rules?.find((f) => f.when.test === test.name)?.message;
    if (byTest) return byTest;
    if (!test.errorName || test.errorName === 'AssertionError') return null;
    const byError = errorFeedback(rules, { name: test.errorName });
    if (!byError || shownErrorFeedback.has(byError)) return null;
    shownErrorFeedback.add(byError);
    return byError;
  };
}
