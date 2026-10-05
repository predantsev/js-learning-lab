// The test data as JSON text: four habits, three of them active.
const FIXTURE_JSON = `[{"id":"h-01","name":"%%h01%%","frequency":"daily","active":true,"completions":["2026-02-27","2026-02-28","2026-03-01"]},{"id":"h-02","name":"%%h02%%","frequency":"daily","active":true,"completions":["2026-02-26","2026-02-28","2026-03-01"]},{"id":"h-03","name":"%%h03%%","frequency":"daily","active":true,"completions":["2026-03-01"]},{"id":"h-05","name":"%%h05%%","frequency":"daily","active":false,"completions":["2026-02-20"]}]`;

const parsed = JSON.parse(FIXTURE_JSON);

export function makeFixtures() {
  return parsed;
}
