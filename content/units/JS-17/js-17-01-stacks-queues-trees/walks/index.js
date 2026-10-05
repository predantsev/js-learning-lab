// A category tree: every node has a name and a list of children.
const tree = {
  name: "%%all%%",
  children: [
    {
      name: "%%home%%",
      children: [
        { name: "%%kitchen%%", children: [] },
        { name: "%%lighting%%", children: [] },
      ],
    },
    {
      name: "%%hobby%%",
      children: [
        { name: "%%sport%%", children: [] },
        { name: "%%books%%", children: [] },
      ],
    },
  ],
};

// Depth-first: a stack. pop() takes the item that was added last.
function walkWithStack(root) {
  const order = [];
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    order.push(node.name);
    // From the last child to the first, so that the first child is on top.
    for (let i = node.children.length - 1; i >= 0; i--) {
      stack.push(node.children[i]);
    }
  }
  return order;
}

// Breadth-first: a queue. shift() takes the item that was added first.
function walkWithQueue(root) {
  const order = [];
  const queue = [root];
  while (queue.length > 0) {
    const node = queue.shift();
    order.push(node.name);
    for (const child of node.children) {
      queue.push(child);
    }
  }
  return order;
}

console.log("%%stackWalk%%", walkWithStack(tree).join(" → "));
console.log("%%queueWalk%%", walkWithQueue(tree).join(" → "));

// What does shift() cost? Empty a queue of n saves with shift(),
// then empty one of the same size by moving a head index forward.
function makeSaves(n) {
  const saves = [];
  for (let i = 0; i < n; i++) {
    saves.push({ id: "s-" + i });
  }
  return saves;
}

function emptyWithShift(saves) {
  while (saves.length > 0) {
    saves.shift();
  }
}

function emptyWithHead(saves) {
  let head = 0;
  while (head < saves.length) {
    saves[head] = undefined; // let the taken save go
    head = head + 1;
  }
}

for (const n of [1000, 10000, 30000]) {
  const forShift = makeSaves(n);
  const forHead = makeSaves(n);
  let start = performance.now();
  emptyWithShift(forShift);
  const shiftMs = performance.now() - start;
  start = performance.now();
  emptyWithHead(forHead);
  const headMs = performance.now() - start;
  console.log(n, "shift():", shiftMs.toFixed(1), "ms ·", "%%headIndex%%", headMs.toFixed(1), "ms");
}
