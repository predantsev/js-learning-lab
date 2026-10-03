// Demo: the timetable from a service that answers 503 once and then the departures.
import { loadTimetable } from './timetable.js';

const departures = [
  { id: 'd-01', route: '7', destination: '%%station%%', departs: '08:05' },
  { id: 'd-02', route: '12', destination: '%%park%%', departs: '08:12' },
];

let calls = 0;
const flakyFetch = async () => {
  calls += 1;
  return calls === 1 ? new Response('{"error":"busy"}', { status: 503 }) : new Response(JSON.stringify(departures), { status: 200 });
};

const outcome = await loadTimetable('http://10.0.2.2:7310/timetable', { fetchFn: flakyFetch, baseDelayMs: 50 });
console.log(`attempts: ${calls}, status: ${outcome.status}`);
for (const departure of outcome.departures ?? []) {
  console.log(`${departure.departs} · ${departure.route} → ${departure.destination}`);
}
