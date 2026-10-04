// Checks isSessionValid and revokeUserSessions at every boundary, then runs the learner's
// cases against a correct rule and against five broken rules: every broken rule must be caught.
import { cases } from './expiry-cases.js';
import { isSessionValid, revokeUserSessions, sessions } from './sessions.js';

const MIN = 60_000;
const IDLE = 30 * MIN;
const ABSOLUTE = 120 * MIN;
const session = (createdMinute, lastSeenMinute) => ({ createdAt: createdMinute * MIN, lastSeenAt: lastSeenMinute * MIN });

test('isSessionValid: idle up to exactly 30 minutes is valid, a millisecond more is not', () => {
  expect(isSessionValid(session(0, 10), 40 * MIN), 'idle exactly 30 min').toBe(true);
  expect(isSessionValid(session(0, 10), 40 * MIN + 1), 'idle 30 min + 1 ms').toBe(false);
  expect(isSessionValid(session(0, 90), 100 * MIN), 'login 100 min ago, last request 10 min ago').toBe(true);
});

test('isSessionValid: up to exactly 2 hours after login is valid, a millisecond more is not', () => {
  expect(isSessionValid(session(0, 115), 120 * MIN), 'age exactly 120 min').toBe(true);
  expect(isSessionValid(session(0, 115), 120 * MIN + 1), 'age 120 min + 1 ms, last request 5 min ago').toBe(false);
});

test('revokeUserSessions deletes all sessions of that user except the current one', () => {
  sessions.clear();
  sessions.set('s-laptop', { userId: 'u-01', createdAt: 0, lastSeenAt: 0 });
  sessions.set('s-tablet', { userId: 'u-01', createdAt: 0, lastSeenAt: 0 });
  sessions.set('s-phone', { userId: 'u-01', createdAt: 0, lastSeenAt: 0 });
  sessions.set('s-other', { userId: 'u-02', createdAt: 0, lastSeenAt: 0 });
  const removed = revokeUserSessions('u-01', { except: 's-phone' });
  expect([...sessions.keys()].sort(), 'sessions left').toEqual(['s-other', 's-phone']);
  expect(removed, 'returned count').toBe(2);
});

test('without except, revokeUserSessions deletes every session of that user', () => {
  sessions.clear();
  sessions.set('s-laptop', { userId: 'u-01', createdAt: 0, lastSeenAt: 0 });
  sessions.set('s-other', { userId: 'u-02', createdAt: 0, lastSeenAt: 0 });
  expect(revokeUserSessions('u-01'), 'returned count').toBe(1);
  expect([...sessions.keys()], 'sessions left').toEqual(['s-other']);
});

// ---- the learner's cases ----
const correct = (s, now) => now - s.lastSeenAt <= IDLE && now - s.createdAt <= ABSOLUTE;
const mutants = {
  'idle ignored': (s, now) => now - s.createdAt <= ABSOLUTE,
  'idle of exactly 30 min treated as expired': (s, now) => now - s.lastSeenAt < IDLE && now - s.createdAt <= ABSOLUTE,
  'idle counted from login': (s, now) => now - s.createdAt <= IDLE,
  'absolute limit ignored': (s, now) => now - s.lastSeenAt <= IDLE,
  'age of exactly 120 min treated as expired': (s, now) => now - s.lastSeenAt <= IDLE && now - s.createdAt < ABSOLUTE,
};
const failingCases = (rule) => (Array.isArray(cases) ? cases : []).filter((c) => rule(c.session, c.now) !== c.valid).map((c) => c.name);
const caught = (name) => failingCases(mutants[name]).length > 0;

test('every case uses a fixed clock: all times are within the first day', () => {
  expect(Array.isArray(cases) && cases.length > 0, 'cases is a non-empty array').toBe(true);
  for (const c of cases) {
    const times = [c.session?.createdAt, c.session?.lastSeenAt, c.now];
    expect(times.every((t) => Number.isFinite(t) && t >= 0 && t <= 24 * 60 * MIN), `times of "${c.name}"`).toBe(true);
  }
});

test('all your cases pass on a correct rule', () => {
  expect(failingCases(correct), 'cases that fail on a correct isSessionValid').toEqual([]);
});

test('your cases catch a rule that ignores idle time or counts it from login', () => {
  expect(caught('idle ignored'), 'a case fails when idle time is ignored').toBe(true);
  expect(caught('idle counted from login'), 'a case fails when idle is counted from login').toBe(true);
});

test('your cases catch a rule that ignores the 2-hour limit', () => {
  expect(caught('absolute limit ignored'), 'a case fails when the absolute limit is ignored').toBe(true);
});

test('your cases catch exactly 30 minutes idle and exactly 2 hours being treated as expired', () => {
  expect(caught('idle of exactly 30 min treated as expired'), 'a case fails for "idle < 30 min"').toBe(true);
  expect(caught('age of exactly 120 min treated as expired'), 'a case fails for "age < 120 min"').toBe(true);
});
