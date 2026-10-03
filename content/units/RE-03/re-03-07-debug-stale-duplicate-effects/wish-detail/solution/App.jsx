import { useEffect, useState } from "react";

const WISH_IDS = ["w-01", "w-02", "w-03"];
// The lab answers w-01 slowly and the others quickly.
const delayFor = (id) => (id === "w-01" ? 900 : 100);

export default function WishDetail() {
  const [selectedId, setSelectedId] = useState(null);
  const [wish, setWish] = useState(null);

  // Loads the selected wish.
  useEffect(() => {
    if (selectedId === null) return;
    const controller = new AbortController();
    fetch(`/lab/wishlist/items/${selectedId}?lang=%%lang%%&delay=${delayFor(selectedId)}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => setWish(data))
      .catch((error) => {
        if (error.name !== "AbortError") throw error;
      });
    return () => controller.abort();
  }, [selectedId]);

  // The j key selects the next wish.
  useEffect(() => {
    function onKey(event) {
      if (event.key !== "j") return;
      setSelectedId((id) => WISH_IDS[(WISH_IDS.indexOf(id) + 1) % WISH_IDS.length]);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section>
      {WISH_IDS.map((id) => (
        <button key={id} aria-pressed={selectedId === id} onClick={() => setSelectedId(id)}>
          {id}
        </button>
      ))}
      <p>{wish ? `${wish.name} — ${wish.price ?? "?"}` : "%%pick%%"}</p>
    </section>
  );
}
