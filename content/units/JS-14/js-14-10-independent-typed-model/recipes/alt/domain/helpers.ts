export function indexById<Item extends { readonly id: string }>(items: readonly Item[]): Map<string, Item> {
  return items.reduce((byId, item) => (byId.has(item.id) ? byId : byId.set(item.id, item)), new Map<string, Item>());
}
