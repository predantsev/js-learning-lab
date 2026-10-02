// Your review of the pull request “Simplify the overlap check”.

// A case the change gets wrong: an existing booking and a request for the same room.
export const failingCase = {
  existing: { id: "b-1", room: "A", start: "2026-06-10", end: "2026-06-13" },
  request: { room: "A", start: "2026-06-11", end: "2026-06-12" },
};

// A review comment on the changed line: what is wrong, on which dates.
export const defectComment =
  "overlaps now only asks whether the request starts during the booking. A request from 2026-06-08 to 2026-06-11 starts before the booking 2026-06-10–2026-06-13 and ends inside it, so it is accepted and the room is double-booked. On main canBook rejects it.";

// Why a test that replaces the rules with a stand-in keeps passing on this change.
export const mockExplanation =
  "The mocked test replaces canBook with a function that always answers true, so the real overlap rule never runs in it: it proves only that the service saves when the rules allow, whatever overlaps does.";

// "approve" or "request-changes".
export const decision = "request-changes";

// A short decision write-up for the pull request: the decision, the evidence, what must change.
export const writeUp =
  "Decision: request changes. The simplified overlaps misses stays that start before an existing booking and end inside it or after it: 2026-06-08 to 2026-06-11 against 2026-06-10 to 2026-06-13 is accepted. Evidence: the unit and integration tests in bookings.test.js fail on the branch and pass on main, while the mocked service test passes on both, because it never calls the real rule. Required: restore the two-sided check booking.start < request.end && request.start < booking.end and keep the new tests.";
