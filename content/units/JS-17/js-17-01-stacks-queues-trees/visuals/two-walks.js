// The same category tree, written as the list of children of every name.
const children = {
  "%%all%%": ["%%home%%", "%%hobby%%"],
  "%%home%%": ["%%kitchen%%", "%%lighting%%"],
  "%%hobby%%": ["%%sport%%", "%%books%%"],
  "%%kitchen%%": [],
  "%%lighting%%": [],
  "%%sport%%": [],
  "%%books%%": [],
};

// Depth-first with a stack: pop() takes the name added last.
const stack = ["%%all%%"];
const depthFirst = [];
while (stack.length > 0) {
  const name = stack.pop();
  depthFirst.push(name);
  const kids = children[name];
  for (let i = kids.length - 1; i >= 0; i--) {
    stack.push(kids[i]);
  }
}

// Breadth-first with a queue: shift() takes the name added first.
const queue = ["%%all%%"];
const breadthFirst = [];
while (queue.length > 0) {
  const name = queue.shift();
  breadthFirst.push(name);
  for (const kid of children[name]) {
    queue.push(kid);
  }
}

console.log(depthFirst.join(" → "));
console.log(breadthFirst.join(" → "));
