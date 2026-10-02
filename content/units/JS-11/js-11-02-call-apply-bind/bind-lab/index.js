const counter = {
  count: 0,
  increment() {
    this.count += 1;
    return this.count;
  },
};

// call runs the method right now, with the this we choose
console.log(counter.increment.call(counter));

// bind builds a NEW function whose this is fixed; nothing runs yet
const bound = counter.increment.bind(counter);
console.log(bound());
console.log(bound());

// a plain copy has no object before the dot
const detached = counter.increment;
try {
  detached();
} catch (error) {
  console.log(error.name);
}
console.log(counter.count);
