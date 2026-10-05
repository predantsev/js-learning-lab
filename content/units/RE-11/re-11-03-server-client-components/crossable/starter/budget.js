// A class with a method: its instances are not plain data.
export class Budget {
  constructor(limitMinor) {
    this.limitMinor = limitMinor;
  }

  remaining(spentMinor) {
    return this.limitMinor - spentMinor;
  }
}
