import { useState } from 'react';

// How far a member has read in the current book. Every press of a button logs more pages
// and saves the new total on the server.
export function ReadingProgress({ memberId, bookId, initialPages, onSave }) {
  const [pages, setPages] = useState(initialPages);

  function handleAdd(amount) {
    setPages(pages + amount);
    onSave({ memberId, bookId, pages: pages + amount });
  }

  return (
    <section>
      <p>%%readSoFar%%: {pages}</p>
      <button type="button" onClick={() => handleAdd(10)}>+10</button>
      <button type="button" onClick={() => handleAdd(25)}>+25</button>
    </section>
  );
}
