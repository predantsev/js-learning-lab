// The edit screen: #/items/:id/edit. Save and Cancel replace this history entry with the wish's own
// page, so Back from there never returns into the finished form.
import { useParams, useNavigate } from "./router.tsx";
import { useItemsData } from "./useItems.ts";
import { useHeadingFocus } from "./focus.ts";
import { categoriesInUse } from "../domain/wishes.ts";
import { ItemForm } from "./ItemForm.tsx";
import type { WishFields } from "./itemsReducer.ts";
import { NotFound } from "./NotFound.tsx";

export function ItemEdit() {
  const { id } = useParams();
  const { items, dispatch } = useItemsData();
  const navigate = useNavigate();
  const headingRef = useHeadingFocus("%%editTitle%%");
  const item = items.find((one) => one.id === id);
  if (item === undefined) {
    return <NotFound />;
  }
  const itemId = item.id;
  const page = "/items/" + itemId;

  function handleSave(fields: WishFields) {
    dispatch({ type: "updated", id: itemId, fields: fields });
    // The draft is saved, so this navigation needs no question.
    navigate(page, { replace: true, skipGuard: true });
  }

  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1}>
        %%editTitle%%
      </h2>
      {/* key: another wish in the address starts a new form from that wish's data. */}
      <ItemForm key={item.id} item={item} categories={[...categoriesInUse(items)]} onSave={handleSave} onCancel={() => navigate(page, { replace: true })} />
    </section>
  );
}
