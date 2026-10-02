// Expense categories as a tree. Ids are unique; names may repeat in different branches.
const node = (id, name, children = []) => ({ id, name, children });
const categories = node("k-all", "%%all%%", [
  node("k-food", "%%food%%", [node("k-groceries", "%%groceries%%"), node("k-cafe", "%%cafe%%")]),
  node("k-fun", "%%fun%%", [node("k-cinema", "%%cinema%%"), node("k-fun-other", "%%other%%")]),
  node("k-home", "%%home%%", [node("k-home-other", "%%other%%")]),
]);

// flattenCategories(tree, maxDepth) lists every category in depth-first order as
// { id, name, level }; the root is level 1.
// - A category deeper than maxDepth: throw a RangeError whose message contains its id.
// - A category whose id was already visited (a cycle): throw an Error whose message contains that id.
// The tree is not changed.
function flattenCategories(tree, maxDepth) {
  // your code here
}

console.log(flattenCategories(categories, 5));

// An imported tree in which "%%cafe%%" points back to the root.
const broken = node("k-all", "%%all%%", [node("k-food", "%%food%%", [node("k-cafe", "%%cafe%%")])]);
broken.children[0].children[0].children.push(broken);
try {
  flattenCategories(broken, 5);
} catch (error) {
  console.log(`${error.name}: ${error.message}`);
}
