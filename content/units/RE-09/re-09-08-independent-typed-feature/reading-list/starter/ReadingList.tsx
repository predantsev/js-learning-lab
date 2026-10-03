import { useState } from "react";
import type { SubmitEvent } from "react";
import { BookCover } from "./BookCover";
import { useReadingList } from "./ReadingListContext";
import { validateDraft } from "./readingModel";
import type { BookDraft, BookStatus } from "./readingTypes";

const STATUS_TEXT: Record<BookStatus, string> = { toRead: "%%toRead%%", reading: "%%reading%%", done: "%%done%%" };

function AddBookForm() {
  const { addBook } = useReadingList();
  const [draft, setDraft] = useState<BookDraft>({ title: "", author: "", pages: "" });
  const [error, setError] = useState("");

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateDraft(draft);
    if (!result.ok) {
      setError("%%required%%");
      return;
    }
    await addBook(result.value);
    setDraft({ title: "", author: "", pages: "" });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p>
        <label htmlFor="book-title">%%titleLabel%%</label>{" "}
        <input id="book-title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
      </p>
      <p>
        <label htmlFor="book-author">%%authorLabel%%</label>{" "}
        <input id="book-author" value={draft.author} onChange={(event) => setDraft({ ...draft, author: event.target.value })} />
      </p>
      <p>
        <label htmlFor="book-pages">%%pagesLabel%%</label>{" "}
        <input id="book-pages" value={draft.pages} onChange={(event) => setDraft({ ...draft, pages: event.target.value })} />
      </p>
      <button type="submit">%%add%%</button>
      {error && <p style={{ color: "firebrick" }}>{error}</p>}
    </form>
  );
}

export function ReadingList() {
  const { state, reload, setStatus } = useReadingList();

  if (state.status === "loading") return <p role="status">%%loading%%</p>;
  if (state.status === "failed") {
    return (
      <div>
        <p style={{ color: "firebrick" }}>%%listFailed%%</p>
        <button onClick={reload}>%%tryAgain%%</button>
      </div>
    );
  }
  return (
    <section>
      <ul>
        {state.books.map((book) => (
          <li key={book.id} data-id={book.id}>
            <BookCover book={book} /> {book.title} — {book.author}, {book.pages} · {STATUS_TEXT[book.status]}{" "}
            {book.status !== "done" && <button onClick={() => setStatus(book.id, "done")}>%%markDone%%</button>}
          </li>
        ))}
      </ul>
      <AddBookForm />
    </section>
  );
}
