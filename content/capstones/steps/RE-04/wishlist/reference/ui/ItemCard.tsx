// One wish. JSX puts every value in as text, so a name with markup stays text. Every button's
// accessible name also names the wish, so the buttons of different cards are told apart.
import { useEffect, useRef, useState } from "react";
import type { Wish } from "../domain/wishes.ts";
import { formatPrice, LOCALE } from "./format.js";

type ItemCardProps = {
  item: Wish;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
};

export function ItemCard({ item, onToggle, onEdit, onRemove }: ItemCardProps) {
  // Only this card needs to know that its delete waits for a confirmation, so the state lives here.
  const [confirming, setConfirming] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  // The button that had focus disappears when the card switches between its two sets of buttons, so
  // focus moves to the matching button of the new set. The first commit moves nothing.
  const switched = useRef(false);
  useEffect(() => {
    if (!switched.current) {
      return;
    }
    switched.current = false;
    (confirming ? cancelRef : deleteRef).current?.focus();
  }, [confirming]);

  function showConfirmation(value: boolean) {
    switched.current = true;
    setConfirming(value);
  }

  const toggleText = item.acquired ? "%%markWantedLabel%%" : "%%markAcquiredLabel%%";
  return (
    <li className="card" data-id={item.id}>
      <h3>{item.name}</h3>
      <p>%%valueLabel%%: {item.price === null ? "%%noPrice%%" : formatPrice(item.price, LOCALE)}</p>
      {item.category !== null && <p>%%categoryFieldLabel%%: {item.category}</p>}
      {item.acquired && <p className="badge">%%acquiredMark%%</p>}
      {confirming ? (
        <>
          <p>%%confirmQuestion%%</p>
          <button type="button" aria-label={"%%confirmDeleteLabel%%: " + item.name} onClick={() => onRemove(item.id)}>
            %%confirmDeleteLabel%%
          </button>
          <button type="button" ref={cancelRef} aria-label={"%%cancelLabel%%: " + item.name} onClick={() => showConfirmation(false)}>
            %%cancelLabel%%
          </button>
        </>
      ) : (
        <>
          <button type="button" aria-label={toggleText + ": " + item.name} onClick={() => onToggle(item.id)}>
            {toggleText}
          </button>
          <button type="button" aria-label={"%%editLabel%%: " + item.name} onClick={() => onEdit(item.id)}>
            %%editLabel%%
          </button>
          <button type="button" ref={deleteRef} data-action="delete" aria-label={"%%deleteLabel%%: " + item.name} onClick={() => showConfirmation(true)}>
            %%deleteLabel%%
          </button>
        </>
      )}
    </li>
  );
}
