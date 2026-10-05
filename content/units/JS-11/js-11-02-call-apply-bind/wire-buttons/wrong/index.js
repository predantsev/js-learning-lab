const habit = {
  name: "%%water%%",
  completed: 0,
  markDone() {
    this.completed += 1;
  },
};

// Make habit.markDone the click handler of both buttons:
// the first one with bind, the second one with an arrow function.
// Both must count on the habit, not on the button.
function wire(first, second) {
  first.addEventListener("click", habit.markDone);
  second.addEventListener("click", habit.markDone);
}

const firstButton = document.createElement("button");
const secondButton = document.createElement("button");
wire(firstButton, secondButton);

firstButton.click();
secondButton.click();
console.log(habit.completed);
