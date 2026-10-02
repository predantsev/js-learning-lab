import { commitId } from "./history.js";

// Replays commits (oldest first) on top of the commit ontoId, like git rebase.
// Returns new commit objects { id, parent, message }; the input stays unchanged.
function rebase(commits, ontoId) {
  let parent = ontoId;
  return commits.map((commit) => {
    // Mistake: the new id is computed, but the next commit still sits on the old id.
    const replayed = { ...commit, parent, id: commitId(parent, commit.message) };
    parent = commit.id;
    return replayed;
  });
}

const first = commitId("", "Add habit label with a test");
const shared = commitId(first, "Explain how to run the tests");
const mainTip = commitId(shared, "Describe the habit fields");

const markCommit = { id: commitId(shared, "Mark paused habits in the label"), parent: shared, message: "Mark paused habits in the label" };
const testCommit = { id: commitId(markCommit.id, "Test the paused mark"), parent: markCommit.id, message: "Test the paused mark" };

const show = (commit) => `${commit.id} ${commit.message} (parent ${commit.parent})`;

console.log("feature/paused-mark before:");
for (const commit of [markCommit, testCommit]) console.log(show(commit));
console.log(`after rebase onto ${mainTip}:`);
for (const commit of rebase([markCommit, testCommit], mainTip)) console.log(show(commit));
