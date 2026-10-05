function WishRow({ wish }) {
  console.log(`render WishRow ${wish.id}`);
  return (
    <li>
      {wish.name}: {`${wish.price} %%currency%%`}
    </li>
  );
}

export function App({ records }) {
  console.log("render App");
  return (
    <main>
      <button type="button" data-action="next">%%next%%</button>
      <ul>
        {records.map((wish) => <WishRow key={wish.id} wish={wish} />)}
      </ul>
    </main>
  );
}
