// A counter that stays between 0 and a maximum,
// for example the completions of a habit in one week.
class BoundedCounter {
  // Keep the count and the maximum private.
  #count = 0;
  #max;

  constructor(max) {
    this.#max = max;
  }

  // Add 1, but never go above the maximum.
  increment() {
    if (this.#count < this.#max) {
      this.#count += 1;
    }
  }

  // Subtract 1, but never go below 0.
  decrement() {
    if (this.#count > 0) {
      this.#count -= 1;
    }
  }

  // The current count.
  value() {
    return this.#count;
  }

  // data is { count, max }. Return a counter with that count and maximum.
  // Throw a RangeError when max is not a whole number of at least 1,
  // or count is not a whole number from 0 up to max.
  static fromJSON(data) {
    const { count, max } = data;
    const maxOk = Number.isInteger(max) && max >= 1;
    const countOk = Number.isInteger(count) && count >= 0 && count <= max;
    if (!maxOk || !countOk) {
      throw new RangeError("invalid counter data");
    }
    const counter = new BoundedCounter(max);
    counter.#count = count;
    return counter;
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
