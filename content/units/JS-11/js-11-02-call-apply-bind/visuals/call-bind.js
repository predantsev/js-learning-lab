const habit = {
  name: "%%water%%",
  count: 0,
  done() {
    this.count += 1;
  },
};

function fire(handler) {
  handler();
}

habit.done.call(habit);
try {
  fire(habit.done);
} catch (error) {
  console.log(error.name);
}
const bound = habit.done.bind(habit);
fire(bound);
console.log(habit.count);
