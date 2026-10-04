import { useEffect, useState } from 'react';

// How far a member has read in the current book. Every press of a button logs more pages
// and saves the new total on the server.
export function ReadingProgress({ memberId, bookId, initialPages, onSave }) {
  const [pages, setPages] = useState(initialPages);

  // Save whatever the total is after each render that changed it.
  useEffect(() => {
    onSave({ memberId, bookId, pages });
  }, [pages]);

  function handleAdd(amount) {
    setPages(pages + amount);
  }

  return (
    <section>
      <p>%%readSoFar%%: {pages}</p>
      <button type="button" onClick={() => handleAdd(10)}>+10</button>
      <button type="button" onClick={() => handleAdd(25)}>+25</button>
    </section>
  );
}
