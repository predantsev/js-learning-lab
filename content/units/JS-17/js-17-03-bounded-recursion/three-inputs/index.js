// A chain of categories: c-1 → c-2 → … → c-<levels>, one child per level.
function makeChain(levels) {
  let node = { id: "c-" + levels, children: [] };
  for (let i = levels - 1; i >= 1; i--) {
    node = { id: "c-" + i, children: [node] };
  }
  return node;
}

const shortChain = makeChain(10);
const longChain = makeChain(100000);
const looped = makeChain(3);
looped.children[0].children[0].children.push(looped); // c-3 points back to c-1

let deepest = 0;

function countNodes(node, depth) {
  deepest = Math.max(deepest, depth);
  let total = 1;
  for (const child of node.children) {
    total = total + countNodes(child, depth + 1);
  }
  return total;
}

function tryCount(label, root) {
  deepest = 0;
  try {
    const total = countNodes(root, 1);
    console.log(label, total, "%%nodes%% ·", "%%depth%%", deepest);
  } catch (error) {
    console.log(label, `${error.name}: ${error.message}`, "·", "%%depth%%", deepest);
  }
}

tryCount("%%short%%", shortChain);
tryCount("%%long%%", longChain);
tryCount("%%loop%%", looped);
