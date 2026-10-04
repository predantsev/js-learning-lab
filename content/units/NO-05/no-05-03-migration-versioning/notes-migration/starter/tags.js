// tagsOf(body): the #words of a note body, lower-case, without repeats, sorted.
// tagsOf('Buy #Tea and #tea and #bread') → ['bread', 'tea']
export function tagsOf(body) {
  const found = body.match(/#[\p{L}\p{N}-]+/gu) ?? [];
  return [...new Set(found.map((tag) => tag.slice(1).toLowerCase()))].sort();
}
