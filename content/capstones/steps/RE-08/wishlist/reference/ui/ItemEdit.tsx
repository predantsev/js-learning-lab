// The edit screen: #/items/:id/edit. The wish comes from the cached list of all wishes. Save waits for
// the API: on success it replaces this history entry with the wish's own page (Back never returns
// into the finished form); on an error the draft stays and the message says why.
import { useState } from "react";
import { useParams, useNavigate } from "./router.tsx";
import { useItemsList, useItemMutations } from "./itemsCache.tsx";
import { QueryState } from "./QueryState.tsx";
import { useHeadingFocus } from "./focus.ts";
import { categoriesInUse } from "../domain/wishes.ts";
import { ItemForm } from "./ItemForm.tsx";
import type { WishFields } from "./itemsReducer.ts";
import { NotFound } from "./NotFound.tsx";

export function ItemEdit() {
  const { id } = useParams();
  const all = useItemsList("all");
  const mutations = useItemMutations();
  const navigate = useNavigate();
  const headingRef = useHeadingFocus("%%editTitle%%");
  const [notice, setNotice] = useState("");
  if (all.items === null) {
    return <QueryState query={all} />;
  }
  const item = all.items.find((one) => one.id === id);
  if (item === undefined) {
    return <NotFound />;
  }
  const itemId = item.id;
  const page = "/items/" + itemId;

  async function handleSave(fields: WishFields): Promise<boolean> {
    const result = await mutations.save(itemId, fields);
    if (!result.ok) {
      setNotice(result.message);
      return false;
    }
    // The draft is saved, so this navigation needs no question.
    navigate(page, { replace: true, skipGuard: true });
    return true;
  }

  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1}>
        %%editTitle%%
      </h2>
      <p role="status">{notice}</p>
      {/* key: another wish in the address starts a new form from that wish's data. */}
      <ItemForm key={item.id} item={item} categories={[...categoriesInUse(all.items)]} onSave={handleSave} onCancel={() => navigate(page, { replace: true })} />
    </section>
  );
}
