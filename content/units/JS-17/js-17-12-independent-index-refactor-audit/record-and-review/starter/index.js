// Shows each of your comments next to the line of after/domain/locker.js it points at.
import { comments, decision } from "./record.js";

const source = await (await fetch("./after/domain/locker.js")).text();
console.log(`%%choiceLabel%% ${decision.choice || "—"}`);
for (const comment of comments) {
  const line = comment.file === "domain/locker.js" ? source.split("\n")[comment.line - 1] : undefined;
  console.log(`${comment.file}:${comment.line} [${comment.blocking ? "%%blocking%%" : "%%nonBlocking%%"}] ${line === undefined ? "%%noSuchLine%%" : line.trim()}`);
}
if (comments.length === 0) console.log("%%noComments%%");
