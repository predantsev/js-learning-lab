import { useState } from 'react';

// How far a member has read in the current book. Every press of a button logs more pages
// and saves the new total on the server.
export function ReadingProgress({ memberId, bookId, initialPages, onSave }) {
  const [pages, setPages] = useState(initialPages);

  function handleAdd(amount) {
    // `pages` is this render's snapshot: compute the new total once and use it for both.
    const next = pages + amount;
    setPages(next);
    onSave({ memberId, bookId, pages: next });
  }

  return (
    <section>
      <p>%%readSoFar%%: {pages}</p>
      <button type="button" onClick={() => handleAdd(10)}>+10</button>
      <button type="button" onClick={() => handleAdd(25)}>+25</button>
    </section>
  );
}
