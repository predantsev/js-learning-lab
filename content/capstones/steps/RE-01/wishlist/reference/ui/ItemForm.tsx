// The shell of the wish form: labels, fields and the Save button, but no state and no handlers yet,
// so the button stays disabled. The next step makes the form work.
type ItemFormProps = { categories: string[] };

export function ItemForm({ categories }: ItemFormProps) {
  return (
    <form noValidate>
      <h2>%%formTitle%%</h2>
      <div className="field">
        <label htmlFor="item-name">%%nameLabel%%</label>
        <input id="item-name" name="name" />
      </div>
      <div className="field">
        <label htmlFor="item-price">%%valueLabel%%</label>
        <input id="item-price" name="price" type="number" min="0" />
      </div>
      <div className="field">
        <label htmlFor="item-category">%%categoryFieldLabel%%</label>
        <input id="item-category" name="category" maxLength={30} list="category-options" />
        <datalist id="category-options">
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      </div>
      <div className="field field-check">
        <input id="item-acquired" name="acquired" type="checkbox" />
        <label htmlFor="item-acquired">%%acquiredFieldLabel%%</label>
      </div>
      <button type="submit" disabled>
        %%saveLabel%%
      </button>
      <p className="note">%%formShellNote%%</p>
    </form>
  );
}
