// A tiny model of Git history (read-only).
// Real Git computes a commit id from the whole commit: the snapshot of the files,
// the parent id, the author, the time and the message. This model keeps only the
// parent id and the message, so the same parent and message always give the same id.
export function commitId(parent, message) {
  let hash = 5381;
  for (const char of `${parent}|${message}`) {
    hash = (hash * 33 + char.codePointAt(0)) % 16777216;
  }
  return hash.toString(16).padStart(6, "0");
}
