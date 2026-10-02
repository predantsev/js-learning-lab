// A counter that stays between 0 and a maximum,
// for example the completions of a habit in one week.
class BoundedCounter {
  // Keep the count and the maximum private.

  constructor(max) {
  }

  // Add 1, but never go above the maximum.
  increment() {
  }

  // Subtract 1, but never go below 0.
  decrement() {
  }

  // The current count.
  value() {
  }

  // data is { count, max }. Return a counter with that count and maximum.
  // Throw a RangeError when max is not a whole number of at least 1,
  // or count is not a whole number from 0 up to max.
  static fromJSON(data) {
  }
}

const counter = new BoundedCounter(3);
for (let i = 0; i < 5; i = i + 1) {
  counter.increment();
}
console.log(counter.value());

const restored = BoundedCounter.fromJSON({ count: 2, max: 5 });
console.log(restored.value());

try {
  BoundedCounter.fromJSON({ count: 9, max: 5 });
} catch (error) {
  console.log(error.name);
}
