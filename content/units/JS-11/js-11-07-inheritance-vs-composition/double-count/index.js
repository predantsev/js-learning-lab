// The base class, after a "harmless" improvement: addAll now reuses add.
class ItemList {
  items = [];

  add(item) {
    this.items.push(item);
  }

  addAll(list) {
    for (const item of list) {
      this.add(item);
    }
  }
}

// Design 1: inheritance. A subclass that counts what is added.
class CountingList extends ItemList {
  count = 0;

  add(item) {
    this.count += 1;
    super.add(item);
  }

  addAll(list) {
    this.count += list.length;
    super.addAll(list);
  }
}

// Design 2: composition. An object that holds a list and delegates to it.
function countingList(list) {
  let count = 0;
  return {
    add(item) {
      count += 1;
      list.add(item);
    },
    addAll(items) {
      count += items.length;
      list.addAll(items);
    },
    get items() {
      return list.items;
    },
    get count() {
      return count;
    },
  };
}

const useComposition = false;
const wishes = ["%%lamp%%", "%%mug%%", "%%tickets%%"];

const counted = useComposition ? countingList(new ItemList()) : new CountingList();
counted.addAll(wishes);

console.log(counted.items.length);
console.log(counted.count);
