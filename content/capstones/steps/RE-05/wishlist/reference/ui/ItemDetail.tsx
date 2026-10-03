// One wish: #/items/:id. The id from the address is only text: it is looked up in the list, and an
// id that no wish has shows the not-found screen.
import { useParams, Link } from "./router.tsx";
import { useItemsData } from "./useItems.ts";
import { useHeadingFocus } from "./focus.ts";
import { formatPrice, LOCALE } from "./format.js";
import { NotFound } from "./NotFound.tsx";

export function ItemDetail() {
  const { id } = useParams();
  const { items } = useItemsData();
  const item = items.find((one) => one.id === id);
  const headingRef = useHeadingFocus(item?.name ?? "%%notFoundTitle%%");
  if (item === undefined) {
    return <NotFound />;
  }
  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1}>
        {item.name}
      </h2>
      <p>%%valueLabel%%: {item.price === null ? "%%noPrice%%" : formatPrice(item.price, LOCALE)}</p>
      <p>%%categoryFieldLabel%%: {item.category ?? "—"}</p>
      <p>{item.acquired ? "%%acquiredMark%%" : "%%wantedMark%%"}</p>
      <p>
        <Link to={"/items/" + item.id + "/edit"}>%%editLabel%%</Link> · <Link to="/items">%%backToListLabel%%</Link>
      </p>
    </section>
  );
}
