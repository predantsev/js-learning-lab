// Four seeded defects. The first render looks fine.
function byPrice(a, b) {
  return a.price - b.price;
}

function WishRow({ wish }) {
  return (
    <li>
      <span>{wish.name} · {wish.price} %%currency%%</span>{" "}
      <input aria-label={`%%noteFor%% ${wish.name}`} />{" "}
      <button type="button" data-id={wish.id}>%%delete%% {wish.name}</button>
    </li>
  );
}

export function WishBoard({ wishes }) {
  const views = Number(localStorage.getItem("jsll.wishlist.views") ?? 0) + 1; // defect: storage write in render
  localStorage.setItem("jsll.wishlist.views", String(views));
  const firstAdded = wishes[0];
  const cheapestFirst = wishes.sort(byPrice); // defect: sorts the props array in place
  return (
    <main>
      <p>%%firstAdded%%: {firstAdded?.name}</p>
      <button type="button">%%again%%</button>
      <ul>
        {cheapestFirst.map((wish, index) => (
          <WishRow key={index} wish={wish} /> // defect: the index is a position, not an identity
        ))}
      </ul>
      <ul aria-label="%%categories%%">
        {cheapestFirst.map((wish) => (
          <li key={Math.random()}>{wish.category}</li> // defect: a new key on every render
        ))}
      </ul>
    </main>
  );
}
