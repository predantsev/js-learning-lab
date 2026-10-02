// Your review of the pull request “Simplify the overlap check”.

// A case the change gets wrong: an existing booking and a request for the same room.
export const failingCase = {
  existing: { id: "b-1", room: "A", start: "", end: "" },
  request: { room: "A", start: "", end: "" },
};

// A review comment on the changed line: what is wrong, on which dates.
export const defectComment = "";

// Why a test that replaces the rules with a stand-in keeps passing on this change.
export const mockExplanation = "";

// "approve" or "request-changes".
export const decision = "";

// A short decision write-up for the pull request: the decision, the evidence, what must change.
export const writeUp = "";
