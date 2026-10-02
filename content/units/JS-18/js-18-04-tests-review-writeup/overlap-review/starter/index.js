// Runs your tests twice — on main and on the pull request — and shows your failing case. Read-only.
import * as onMain from "./bookings.before.js";
import * as inPullRequest from "./bookings.js";
import { bookingTests } from "./bookings.test.js";
import { failingCase } from "./review.js";
import { reset, run } from "./testing.js";

console.log("%%onMain%%");
bookingTests(onMain);
await run();

reset();
console.log("%%inPullRequest%%");
bookingTests(inPullRequest);
await run();

const { existing, request } = failingCase;
console.log(`%%caseLine%% main ${onMain.canBook([existing], request)}, pull request ${inPullRequest.canBook([existing], request)}`);
