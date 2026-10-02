const wish = {
  name: "%%tickets%%",
  label() {
    return "%%prefix%% " + this.name;
  },
  labelLater() {
    // an arrow function: it has no this of its own and takes it from labelLater
    const inner = () => this.label();
    return inner();
  },
};

console.log(wish.label());
console.log(wish.labelLater());

const detached = wish.label;
try {
  console.log(detached());
} catch (error) {
  console.log(error.name + ": " + error.message);
}
