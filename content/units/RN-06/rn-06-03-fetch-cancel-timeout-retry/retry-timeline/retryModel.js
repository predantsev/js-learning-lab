// A MODEL of a retry policy on a virtual clock: no requests, no timers — only the decisions,
// written out as a timeline so you can see when each attempt starts and why the next one does or does not.
//
// server: what each attempt meets — { answersAfterMs, status } or { silent: true }.
const say = (template, values = {}) => template.replace(/\{(\w+)\}/g, (match, key) => values[key]);

export function modelTimeline(server, { timeoutMs, maxAttempts, baseDelayMs, blurAtMs = Infinity }) {
  const events = [];
  let clock = 0;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    events.push({ at: clock, text: say('%%starts%%', { n: attempt }) });
    const reply = server[Math.min(attempt - 1, server.length - 1)];
    const answerAt = reply.silent ? Infinity : clock + reply.answersAfterMs;
    const deadline = clock + timeoutMs;
    const end = Math.min(answerAt, deadline, blurAtMs);

    if (end === blurAtMs) {
      events.push({ at: blurAtMs, text: say('%%blurDuring%%') });
      return events;
    }
    if (end === deadline) {
      events.push({ at: deadline, text: say('%%timedOut%%', { ms: timeoutMs }) });
    } else if (reply.status < 500) {
      events.push({ at: answerAt, text: say('%%done%%', { status: reply.status }) });
      return events;
    } else {
      events.push({ at: answerAt, text: say('%%retryable%%', { status: reply.status }) });
    }
    clock = end;
    if (attempt === maxAttempts) {
      events.push({ at: clock, text: say('%%budget%%', { n: maxAttempts }) });
      return events;
    }
    const delay = baseDelayMs * 2 ** (attempt - 1);
    if (clock + delay > blurAtMs) {
      events.push({ at: blurAtMs, text: say('%%blurWaiting%%') });
      return events;
    }
    events.push({ at: clock, text: say('%%wait%%', { ms: delay }) });
    clock += delay;
  }
  return events;
}
