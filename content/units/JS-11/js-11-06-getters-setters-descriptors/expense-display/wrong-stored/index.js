class Expense {
  constructor(label, amountMinor) {
    this.label = label;
    this.amountMinor = amountMinor;
    this.display = label + ": " + (amountMinor / 100).toFixed(2);
  }

  // Add a read-only getter `display`: the label, a colon and a space,
  // then the amount in major units with two decimals ("Lunch: 210.50").
  // It must be computed on every read, not stored.
}

const lunch = new Expense("%%lunch%%", 21050);
console.log(lunch.display);
lunch.amountMinor = 25000;
console.log(lunch.display);
console.log(Object.keys(lunch).join());
