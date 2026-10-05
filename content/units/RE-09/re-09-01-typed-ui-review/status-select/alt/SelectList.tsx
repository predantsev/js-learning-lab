interface SelectListProps<Item> {
  label: string;
  items: readonly Item[];
  selected: Item;
  getKey(item: Item): string;
  getLabel(item: Item): string;
  onSelect(item: Item): void;
}

export function SelectList<Item>(props: SelectListProps<Item>) {
  return (
    <fieldset>
      <legend>{props.label}</legend>
      {props.items.map((item) => {
        const key = props.getKey(item);
        const isSelected = key === props.getKey(props.selected);
        return (
          <button key={key} type="button" aria-pressed={isSelected ? "true" : "false"} onClick={() => props.onSelect(item)}>
            {props.getLabel(item)}
          </button>
        );
      })}
    </fieldset>
  );
}
