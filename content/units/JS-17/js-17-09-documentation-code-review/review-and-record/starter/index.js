// Shows each of your comments next to the line of after/ it points at.
import { comments, decision } from "./review.js";

const source = {
  "domain/planner.js": await (await fetch("./after/domain/planner.js")).text(),
  "ui/page.js": await (await fetch("./after/ui/page.js")).text(),
  "storage/planner.js": await (await fetch("./after/storage/planner.js")).text(),
  "app.js": await (await fetch("./after/app.js")).text(),
};

console.log(`%%decisionLabel%% ${decision.decision || "—"}`);
for (const comment of comments) {
  const line = source[comment.file]?.split("\n")[comment.line - 1];
  const mark = comment.blocking ? "%%blocking%%" : "%%nonBlocking%%";
  console.log(`${comment.file}:${comment.line} [${mark}] ${line === undefined ? "%%noSuchLine%%" : line.trim()}`);
}
if (comments.length === 0) console.log("%%noComments%%");
