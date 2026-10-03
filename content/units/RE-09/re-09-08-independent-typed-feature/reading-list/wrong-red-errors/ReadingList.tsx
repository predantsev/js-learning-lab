import { useState } from "react";
import type { SubmitEvent } from "react";
import { BookCover } from "./BookCover";
import { CardBoundary } from "./CardBoundary";
import { useReadingList } from "./ReadingListContext";
import { validateDraft } from "./readingModel";
import type { BookDraft, BookStatus } from "./readingTypes";

const MESSAGES: Record<string, string> = {
  required: "%%required%%",
  positiveInteger: "%%positiveInteger%%",
  saveFailed: "%%saveFailed%%",
  badResponse: "%%badResponse%%",
  listFailed: "%%listFailed%%",
};
const STATUS_TEXT: Record<BookStatus, string> = { toRead: "%%toRead%%", reading: "%%reading%%", done: "%%done%%" };
const FIELDS = [
  { name: "title", label: "%%titleLabel%%" },
  { name: "author", label: "%%authorLabel%%" },
  { name: "pages", label: "%%pagesLabel%%" },
] as const;

function AddBookForm() {
  const { addBook } = useReadingList();
  const [draft, setDraft] = useState<BookDraft>({ title: "", author: "", pages: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [requestError, setRequestError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateDraft(draft);
    if (!result.ok) {
      setFieldErrors(result.errors);
      return;
    }
    setFieldErrors({});
    const problem = await addBook(result.value);
    setRequestError(problem);
    if (problem === null) setDraft({ title: "", author: "", pages: "" });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {FIELDS.map(({ name, label }) => (
        <p key={name}>
          <label htmlFor={`book-${name}`}>{label}</label>{" "}
          <input
            id={`book-${name}`}
            value={draft[name]}
            onChange={(event) => setDraft({ ...draft, [name]: event.target.value })}
          />
          {fieldErrors[name] && <span style={{ color: "firebrick" }}> {MESSAGES[fieldErrors[name]]}</span>}
        </p>
      ))}
      <button type="submit">%%add%%</button>
      {requestError && <p role="alert">{MESSAGES[requestError]}</p>}
    </form>
  );
}

export function ReadingList() {
  const { state, reload, setStatus } = useReadingList();
  const [statusError, setStatusError] = useState<string | null>(null);

  if (state.status === "loading") return <p role="status">%%loading%%</p>;
  if (state.status === "failed") {
    return (
      <div role="alert">
        <p>{MESSAGES[state.message] ?? state.message}</p>
        <button onClick={reload}>%%tryAgain%%</button>
      </div>
    );
  }
  return (
    <section>
      <ul>
        {state.books.map((book) => (
          <li key={book.id} data-id={book.id}>
            <CardBoundary>
              <BookCover book={book} />
            </CardBoundary>{" "}
            {book.title} — {book.author}, {book.pages} · {STATUS_TEXT[book.status]}{" "}
            {book.status !== "done" && (
              <button onClick={async () => setStatusError(await setStatus(book.id, "done"))}>%%markDone%%</button>
            )}
          </li>
        ))}
      </ul>
      {statusError && <p role="alert">{MESSAGES[statusError]}</p>}
      <AddBookForm />
    </section>
  );
}
