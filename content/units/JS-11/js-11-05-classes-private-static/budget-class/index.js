class Budget {
  #spentMinor = 0;

  spend(amountMinor) {
    this.#spentMinor += amountMinor;
  }
}

const budget = new Budget();
budget.spend(18000);
budget.spend(9990);

console.log(Object.keys(budget).length);
console.log(budget.spentMinor);
console.log(typeof budget.spend);
