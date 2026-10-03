// A cover widget from another team. Read-only. It sometimes crashes while rendering.
import { server } from "./readingServer";
import type { Book } from "./readingTypes";

export function BookCover({ book }: { book: Book }) {
  if (server.brokenCovers.includes(book.id)) throw new Error(`cover renderer failed for ${book.id}`);
  const initials = book.title
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
  return (
    <span aria-hidden="true" style={{ display: "inline-block", width: "2rem", textAlign: "center", border: "1px solid dimgray" }}>
      {initials}
    </span>
  );
}
