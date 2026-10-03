// Each row has an input for a note. The input is not controlled by React:
// what you type lives only in that DOM node.
function WishRow({ wish }) {
  return (
    <li>
      <span>{wish.name}</span>{" "}
      <input aria-label={`%%noteFor%% ${wish.name}`} placeholder="%%note%%" />{" "}
      <button type="button" data-action="delete" data-id={wish.id}>
        %%delete%% {wish.name}
      </button>
    </li>
  );
}

export function WishList({ wishes }) {
  return (
    <>
      <button type="button" data-action="reverse">%%reverse%%</button>
      <ul>
        {wishes.map((wish, index) => (
          <WishRow key={index} wish={wish} />
        ))}
      </ul>
    </>
  );
}
